#!/usr/bin/env node

import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';

const IMPORT_OUTPUT = 'data/imports/freecodecamp/solocoder-html-v9.json';

function runNodeScript(scriptPath, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      cwd: process.cwd(),
      stdio: 'inherit'
    });

    child.on('exit', code => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${path.basename(scriptPath)} exited with code ${code}`));
    });

    child.on('error', reject);
  });
}

async function main() {
  const root = process.cwd();

  await runNodeScript(path.join(root, 'scripts/import-freecodecamp.mjs'), [
    '--preset=solocoder-html-v9',
    '--include-content',
    `--out=${IMPORT_OUTPUT}`
  ]);

  await runNodeScript(path.join(root, 'scripts/convert-freecodecamp-to-solocoder.mjs'), [
    `--input=${IMPORT_OUTPUT}`,
    '--categories=html'
  ]);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
