#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const SOURCE_REPO = 'freeCodeCamp/freeCodeCamp';
const DEFAULT_BRANCH = 'main';
const DEFAULT_LANGUAGE = 'english';
const DEFAULT_PRESET = 'html-css-js';
const DEFAULT_OUTPUT = 'data/imports/freecodecamp/html-css-js.json';

const PRESETS = {
  'html-css-js': {
    description:
      'All current curriculum superblocks whose slugs indicate HTML, CSS, JavaScript, or Responsive Web Design.'
  },
  'solocoder-html-v9': {
    description:
      'Only the Responsive Web Design v9 superblock, for SoloCoder HTML-first conversion.'
  },
  'solocoder-v9': {
    description:
      'Latest v9 Responsive Web Design and JavaScript curriculum for SoloCoder conversion.'
  }
};

function printHelp() {
  const presetDescriptions = Object.entries(PRESETS)
    .map(([name, preset]) => `  - ${name}: ${preset.description}`)
    .join('\n');

  console.log(`Usage: npm run import:freecodecamp -- [options]

Options:
  --preset=<name>            Preset of superblocks to import. Default: ${DEFAULT_PRESET}
  --superblocks=a,b,c        Explicit comma-separated superblock slugs.
  --include-content          Download and parse challenge markdown content.
  --branch=<name>            Git branch/tag to read from. Default: ${DEFAULT_BRANCH}
  --lang=<name>              Challenge language directory. Default: ${DEFAULT_LANGUAGE}
  --out=<path>               Output JSON file path. Default: ${DEFAULT_OUTPUT}
  --concurrency=<number>     Concurrent network requests. Default: 6
  --help                     Show this message.

Examples:
  npm run import:freecodecamp --
  npm run import:freecodecamp -- --include-content
  npm run import:freecodecamp -- --preset=solocoder-v9 --include-content
  npm run import:freecodecamp -- --superblocks=basic-html,basic-css,javascript-v9 --include-content

Presets:
${presetDescriptions}
`);
}

function parseArgs(argv) {
  const options = {
    preset: DEFAULT_PRESET,
    superblocks: [],
    includeContent: false,
    branch: DEFAULT_BRANCH,
    lang: DEFAULT_LANGUAGE,
    out: DEFAULT_OUTPUT,
    concurrency: 6
  };

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--include-content') {
      options.includeContent = true;
      continue;
    }

    if (arg.startsWith('--preset=')) {
      options.preset = arg.slice('--preset='.length).trim();
      continue;
    }

    if (arg.startsWith('--superblocks=')) {
      options.superblocks = arg
        .slice('--superblocks='.length)
        .split(',')
        .map(value => value.trim())
        .filter(Boolean);
      continue;
    }

    if (arg.startsWith('--branch=')) {
      options.branch = arg.slice('--branch='.length).trim();
      continue;
    }

    if (arg.startsWith('--lang=')) {
      options.lang = arg.slice('--lang='.length).trim();
      continue;
    }

    if (arg.startsWith('--out=')) {
      options.out = arg.slice('--out='.length).trim();
      continue;
    }

    if (arg.startsWith('--concurrency=')) {
      const concurrency = Number(arg.slice('--concurrency='.length).trim());

      if (!Number.isInteger(concurrency) || concurrency <= 0) {
        throw new Error(`Invalid concurrency value: ${arg}`);
      }

      options.concurrency = concurrency;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function isHtmlCssJsSlug(slug) {
  const value = slug.toLowerCase();

  if (value.startsWith('responsive-web-design')) {
    return true;
  }

  return ['html', 'css', 'javascript'].some(keyword => value.includes(keyword));
}

function inferCategory(slug) {
  const value = slug.toLowerCase();

  if (value.includes('javascript')) {
    return 'javascript';
  }

  if (value.includes('css') || value.startsWith('responsive-web-design')) {
    return 'css';
  }

  if (value.includes('html')) {
    return 'html';
  }

  return 'mixed';
}

function uniqueSorted(items) {
  return [...new Set(items)].sort((left, right) => left.localeCompare(right));
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'SoloCoder freeCodeCamp importer'
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }

  return response.text();
}

async function fetchJson(url) {
  const text = await fetchText(url);
  return JSON.parse(text);
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      if (currentIndex >= items.length) {
        return;
      }

      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

function parseFrontMatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);

  if (!match) {
    return {
      frontMatter: {},
      frontMatterRaw: '',
      body: markdown
    };
  }

  const raw = match[1];
  const frontMatter = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf(':');

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    frontMatter[key] = parseScalar(value);
  }

  return {
    frontMatter,
    frontMatterRaw: raw,
    body: markdown.slice(match[0].length)
  };
}

function parseScalar(value) {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function parseSections(body) {
  const sectionRegex = /^(#{1,6}) --([a-z0-9-]+)--\s*$/gm;
  const matches = [...body.matchAll(sectionRegex)];

  if (matches.length === 0) {
    return {};
  }

  const sections = {};
  let currentTopLevel = null;

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const nextMatch = matches[index + 1];
    const headingLevel = match[1].length;
    const sectionName = match[2];
    const contentStart = match.index + match[0].length;
    const content = body
      .slice(contentStart, nextMatch ? nextMatch.index : body.length)
      .trim();

    if (headingLevel === 1 || !currentTopLevel) {
      currentTopLevel = sectionName;
      sections[sectionName] = {
        content,
        subsections: {}
      };
      continue;
    }

    sections[currentTopLevel].subsections[sectionName] = content;
  }

  return sections;
}

function extractFirstCodeBlock(content) {
  if (!content) {
    return null;
  }

  const match = content.match(/```[a-zA-Z0-9-]*\r?\n([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}

function parseHints(content) {
  if (!content) {
    return [];
  }

  const hintRegex = /```[a-zA-Z0-9-]*\r?\n([\s\S]*?)```/g;
  const hints = [];
  let cursor = 0;
  let match;

  while ((match = hintRegex.exec(content)) !== null) {
    const text = content.slice(cursor, match.index).trim();
    const assertion = match[1].trim();

    hints.push({
      text: text || null,
      assertion
    });

    cursor = match.index + match[0].length;
  }

  const trailingText = content.slice(cursor).trim();

  if (hints.length === 0 && trailingText) {
    return [{ text: trailingText, assertion: null }];
  }

  if (trailingText && hints.length > 0) {
    hints[hints.length - 1].trailingText = trailingText;
  }

  return hints;
}

function normalizeChallenge(markdown, sourceUrl) {
  const { frontMatter, frontMatterRaw, body } = parseFrontMatter(markdown);
  const sections = parseSections(body);
  const description = sections.description?.content ?? null;
  const instructions = sections.instructions?.content ?? null;
  const question = sections.question?.content ?? null;
  const hintsContent = sections.hints?.content ?? null;
  const seedSection = sections.seed ?? null;
  const seedContents = seedSection?.subsections?.['seed-contents'] ?? null;
  const answerContent = sections.answer?.content ?? null;
  const solutionContent =
    sections.solution?.content ?? sections.solution?.subsections?.contents ?? null;

  return {
    id: frontMatter.id ?? null,
    title: frontMatter.title ?? null,
    dashedName: frontMatter.dashedName ?? null,
    challengeType: frontMatter.challengeType ?? null,
    demoType: frontMatter.demoType ?? null,
    description,
    instructions,
    question,
    seedCode: extractFirstCodeBlock(seedContents),
    answerCode: extractFirstCodeBlock(answerContent),
    solutionCode: extractFirstCodeBlock(solutionContent),
    hints: parseHints(hintsContent),
    sections,
    frontMatter,
    frontMatterRaw,
    sourceUrl
  };
}

function createRawBase(branch) {
  return `https://raw.githubusercontent.com/${SOURCE_REPO}/${branch}`;
}

function createSourceUrls(branch, lang) {
  const rawBase = createRawBase(branch);

  return {
    curriculum: `${rawBase}/curriculum/structure/curriculum.json`,
    superblock: slug => `${rawBase}/curriculum/structure/superblocks/${slug}.json`,
    block: slug => `${rawBase}/curriculum/structure/blocks/${slug}.json`,
    challenge: (blockSlug, challengeId) =>
      `${rawBase}/curriculum/challenges/${lang}/blocks/${blockSlug}/${challengeId}.md`
  };
}

async function loadSelectedSuperblocks(options, sourceUrls) {
  if (options.superblocks.length > 0) {
    return uniqueSorted(options.superblocks);
  }

  const curriculum = await fetchJson(sourceUrls.curriculum);

  if (options.preset === 'html-css-js') {
    return uniqueSorted(curriculum.superblocks.filter(isHtmlCssJsSlug));
  }

  if (options.preset === 'solocoder-v9') {
    return ['responsive-web-design-v9', 'javascript-v9'];
  }

  if (options.preset === 'solocoder-html-v9') {
    return ['responsive-web-design-v9'];
  }

  throw new Error(`Unknown preset: ${options.preset}`);
}

async function loadChallenge(blockSlug, challengeMeta, options, sourceUrls) {
  const sourceUrl = sourceUrls.challenge(blockSlug, challengeMeta.id);

  if (!options.includeContent) {
    return {
      id: challengeMeta.id,
      title: challengeMeta.title,
      sourceUrl
    };
  }

  const markdown = await fetchText(sourceUrl);
  return normalizeChallenge(markdown, sourceUrl);
}

async function loadBlock(blockSlug, options, sourceUrls) {
  const blockStructure = await fetchJson(sourceUrls.block(blockSlug));
  const challenges = await mapWithConcurrency(
    blockStructure.challengeOrder,
    options.concurrency,
    challenge => loadChallenge(blockSlug, challenge, options, sourceUrls)
  );

  return {
    slug: blockSlug,
    blockLabel: blockStructure.blockLabel ?? null,
    blockLayout: blockStructure.blockLayout ?? null,
    helpCategory: blockStructure.helpCategory ?? null,
    isUpcomingChange: blockStructure.isUpcomingChange ?? false,
    usesMultifileEditor: blockStructure.usesMultifileEditor ?? false,
    hasEditableBoundaries: blockStructure.hasEditableBoundaries ?? false,
    challengeCount: challenges.length,
    challenges,
    sourceUrl: sourceUrls.block(blockSlug)
  };
}

function extractBlockLayout(superblockStructure) {
  if (Array.isArray(superblockStructure.blocks)) {
    return {
      blockSlugs: superblockStructure.blocks,
      chapters: null
    };
  }

  if (Array.isArray(superblockStructure.chapters)) {
    const chapters = superblockStructure.chapters.map(chapter => ({
      dashedName: chapter.dashedName ?? null,
      modules: (chapter.modules ?? []).map(module => ({
        dashedName: module.dashedName ?? null,
        moduleType: module.moduleType ?? 'module',
        blocks: Array.isArray(module.blocks) ? module.blocks : []
      }))
    }));

    return {
      blockSlugs: uniqueSorted(
        chapters.flatMap(chapter =>
          chapter.modules.flatMap(module => module.blocks)
        )
      ),
      chapters
    };
  }

  throw new Error(
    `Unsupported superblock structure. Expected "blocks" or "chapters". Found keys: ${Object.keys(
      superblockStructure
    ).join(', ')}`
  );
}

async function loadSuperblock(superblockSlug, options, sourceUrls) {
  const superblock = await fetchJson(sourceUrls.superblock(superblockSlug));
  const { blockSlugs, chapters } = extractBlockLayout(superblock);
  const blocks = await mapWithConcurrency(
    blockSlugs,
    options.concurrency,
    blockSlug => loadBlock(blockSlug, options, sourceUrls)
  );

  return {
    slug: superblockSlug,
    category: inferCategory(superblockSlug),
    blockCount: blocks.length,
    chapters,
    blocks,
    sourceUrl: sourceUrls.superblock(superblockSlug)
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const sourceUrls = createSourceUrls(options.branch, options.lang);
  const selectedSuperblocks = await loadSelectedSuperblocks(options, sourceUrls);

  if (selectedSuperblocks.length === 0) {
    throw new Error('No superblocks selected for import.');
  }

  console.log(
    `Importing ${selectedSuperblocks.length} freeCodeCamp superblocks from ${options.branch} (${options.lang})`
  );
  console.log(
    options.includeContent
      ? 'Mode: full content import'
      : 'Mode: metadata only. Pass --include-content to download challenge markdown too.'
  );

  const superblocks = await mapWithConcurrency(
    selectedSuperblocks,
    Math.min(options.concurrency, 4),
    async superblockSlug => {
      console.log(`- ${superblockSlug}`);
      return loadSuperblock(superblockSlug, options, sourceUrls);
    }
  );

  const output = {
    generatedAt: new Date().toISOString(),
    source: {
      repo: SOURCE_REPO,
      branch: options.branch,
      language: options.lang,
      preset: options.superblocks.length > 0 ? null : options.preset
    },
    selectedSuperblocks,
    includeContent: options.includeContent,
    licensing: {
      summary:
        "freeCodeCamp's repository README states the software is BSD-3-Clause, while the learning resources under /curriculum are copyrighted by freeCodeCamp.org.",
      note:
        'Review freeCodeCamp licensing before redistributing imported curriculum content inside a commercial or school product.'
    },
    superblocks
  };

  const outputPath = path.resolve(process.cwd(), options.out);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  console.log(`Wrote ${outputPath}`);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
