#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const CATEGORY_IDS = ['html', 'css', 'javascript'];
const EDITABLE_REGION_MARKER = '--fcc-editable-region--';
const PREVIEW_PLACEHOLDER = '__SOLOCODER_EDITABLE_REGION__';
const DEFAULT_INPUT = 'data/imports/freecodecamp/solocoder-v9.json';
const DEFAULT_PROJECTS_DIR = 'src/lib/generated/projects';
const DEFAULT_CURRICULUM_DIR = 'public/curriculum';
const DEFAULT_CATEGORIES = CATEGORY_IDS.join(',');

function parseArgs(argv) {
  const options = {
    input: DEFAULT_INPUT,
    projectsDir: DEFAULT_PROJECTS_DIR,
    curriculumDir: DEFAULT_CURRICULUM_DIR,
    categories: [...CATEGORY_IDS]
  };

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg.startsWith('--input=')) {
      options.input = arg.slice('--input='.length).trim();
      continue;
    }

    if (arg.startsWith('--projects-dir=')) {
      options.projectsDir = arg.slice('--projects-dir='.length).trim();
      continue;
    }

    if (arg.startsWith('--curriculum-dir=')) {
      options.curriculumDir = arg.slice('--curriculum-dir='.length).trim();
      continue;
    }

    if (arg.startsWith('--categories=')) {
      const categories = arg
        .slice('--categories='.length)
        .split(',')
        .map(value => value.trim())
        .filter(Boolean);

      if (categories.length === 0 || categories.some(category => !CATEGORY_IDS.includes(category))) {
        throw new Error(`Invalid categories list: ${arg}`);
      }

      options.categories = categories;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function printHelp() {
  console.log(`Usage: npm run convert:freecodecamp -- [options]

Options:
  --input=<path>            Imported freeCodeCamp JSON snapshot. Default: ${DEFAULT_INPUT}
  --projects-dir=<path>     Output directory for project metadata. Default: ${DEFAULT_PROJECTS_DIR}
  --curriculum-dir=<path>   Output directory for per-category lesson JSON. Default: ${DEFAULT_CURRICULUM_DIR}
  --categories=<list>       Comma-separated categories to generate. Default: ${DEFAULT_CATEGORIES}
  --help                    Show this message.
`);
}

function normalizeLanguage(language) {
  const value = (language ?? '').toLowerCase().trim();

  if (value === 'js' || value === 'javascript') {
    return 'javascript';
  }

  if (value === 'css') {
    return 'css';
  }

  return 'html';
}

function languageToFilename(language) {
  if (language === 'javascript') {
    return 'script.js';
  }

  if (language === 'css') {
    return 'styles.css';
  }

  return 'index.html';
}

function stripMarkdown(text) {
  if (!text) {
    return '';
  }

  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '- ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function firstParagraph(text) {
  const normalized = stripMarkdown(text);

  if (!normalized) {
    return '';
  }

  return normalized.split(/\n\s*\n/)[0]?.trim() ?? normalized;
}

function humanizeSlug(slug) {
  return slug
    .replace(/^(workshop|lab|lecture|review|quiz)-/, '')
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function applyTextReplacements(text, replacements) {
  return replacements.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), text);
}

function protectSegments(text) {
  const tokens = [];
  let value = text;
  const patterns = [
    /`[^`]+`/g,
    /<[^>\n]+>/g,
    /https?:\/\/\S+/g,
    /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g,
    /\b[a-zA-Z_$][\w$.]*\([^)\n]*\)/g,
    /\b[a-zA-Z_-]+\s*:\s*[^.;\n]+[;\n]?/g
  ];

  for (const pattern of patterns) {
    value = value.replace(pattern, match => {
      const placeholder = `__SOLOCODER_TOKEN_${tokens.length}__`;
      tokens.push(match);
      return placeholder;
    });
  }

  return {
    text: value,
    restore(current) {
      let restored = current;

      // Restore later placeholders first because function-call tokens can contain
      // earlier string placeholders inside them.
      for (let index = tokens.length - 1; index >= 0; index -= 1) {
        restored = restored.replaceAll(`__SOLOCODER_TOKEN_${index}__`, tokens[index]);
      }

      return restored;
    }
  };
}

function translateHtmlTitle(title) {
  if (!title) {
    return '';
  }

  const directMap = new Map([
    ['Curriculum Outline', 'مخطط المنهج'],
    ['Debug Camperbot\'s Profile Page', 'صحّح صفحة ملف Camperbot الشخصي'],
    ['Debug a Pet Adoption Page', 'صحّح صفحة تبنّي الحيوانات الأليفة'],
    ['Cat Photo App', 'تطبيق صور القطط'],
    ['Build a Recipe Page', 'ابنِ صفحة وصفة'],
    ['Bookstore Page', 'صفحة متجر الكتب'],
    ['Build a Travel Agency Page', 'ابنِ صفحة وكالة سفر'],
    ['Html Music Player', 'مشغل موسيقى HTML'],
    ['Html Video Player', 'مشغل فيديو HTML'],
    ['Build an HTML Audio and Video Player', 'ابنِ مشغل صوت وفيديو باستخدام HTML'],
    ['Build A Heart Icon', 'ابنِ أيقونة قلب'],
    ['Build A Video Display Using Iframe', 'ابنِ عرض فيديو باستخدام iframe'],
    ['Build a Video Compilation Page', 'ابنِ صفحة تجميع فيديوهات'],
    ['Major Browsers List', 'قائمة المتصفحات الرئيسية'],
    ['Quincys Job Tips', 'نصائح Quincy المهنية'],
    ['Blog Page', 'صفحة مدونة'],
    ['Build an Event Hub', 'ابنِ منصة فعاليات'],
    ['Hotel Feedback Form', 'نموذج ملاحظات فندق'],
    ['Final Exams Table', 'جدول الاختبارات النهائية'],
    ['Build a Book Catalog Table', 'ابنِ جدول فهرس كتب'],
    ['Build a Survey Form', 'ابنِ نموذج استطلاع'],
    ['Debug Coding Journey Blog Page', 'صحّح صفحة مدونة رحلة البرمجة'],
    ['Tech Conference Schedule', 'جدول مؤتمر تقني'],
    ['Debug a Donation Form', 'صحّح نموذج تبرع'],
    ['Accessible Audio Controller', 'متحكم صوت سهل الوصول'],
    ['Build a Checkout Page', 'ابنِ صفحة إتمام الشراء'],
    ['Design a Movie Review Page', 'صمّم صفحة مراجعة فيلم'],
    ['Build a Multimedia Player', 'ابنِ مشغل وسائط متعددة']
  ]);

  if (directMap.has(title)) {
    return directMap.get(title);
  }

  let result = title;

  const replacements = [
    [/^Step (\d+)$/i, (_, stepNumber) => `الخطوة ${stepNumber}`],
    [/^Debug /i, 'صحّح '],
    [/^Build /i, 'ابنِ '],
    [/^Create /i, 'أنشئ '],
    [/^Introduction to /i, 'مقدمة إلى '],
    [/Profile Page/gi, 'صفحة الملف الشخصي'],
    [/Pet Adoption Page/gi, 'صفحة تبنّي الحيوانات'],
    [/Photo/gi, 'صور'],
    [/Page/gi, 'صفحة'],
    [/App/gi, 'تطبيق'],
    [/Outline/gi, 'مخطط'],
    [/Hub/gi, 'منصة'],
    [/Event/gi, 'فعاليات'],
    [/Bookstore/gi, 'مكتبة الكتب'],
    [/Camperbot/gi, 'كامبر بوت'],
    [/Cat/gi, 'القطط'],
    [/Video/gi, 'فيديو'],
    [/Browser/gi, 'المتصفحات'],
    [/HTML/gi, 'HTML']
  ];

  result = applyTextReplacements(result, replacements);
  return result;
}

function translateGenericTitle(title) {
  if (!title) {
    return '';
  }

  const directMap = new Map([
    ['Cafe Menu', 'قائمة المقهى'],
    ['Greeting Bot', 'روبوت الترحيب'],
    ['Teacher Chatbot', 'روبوت المعلم للدردشة'],
    ['Build a JavaScript Trivia Bot', 'ابنِ روبوت أسئلة JavaScript'],
    ['Build a Sentence Maker', 'ابنِ مولّد الجمل'],
    ['Design a Business Card', 'صمّم بطاقة عمل'],
    ['Design a Blog Post Card', 'صمّم بطاقة تدوينة'],
    ['Build a Stylized To-Do list', 'ابنِ قائمة مهام منسقة'],
    ['Build an Event Flyer Page', 'ابنِ صفحة إعلان فعالية'],
    ['Greeting Card', 'بطاقة ترحيب'],
    ['Parent Teacher Conference Form', 'نموذج اجتماع أولياء الأمور والمعلمين'],
    ['Build a Job Application Form', 'ابنِ نموذج طلب وظيفة'],
    ['Colored Markers', 'أقلام تلوين'],
    ['Design a Set of Colored Boxes', 'صمّم مجموعة صناديق ملونة'],
    ['String Inspector', 'فاحص النصوص'],
    ['String Formatter', 'منسّق النصوص'],
    ['String Transformer', 'محوّل النصوص'],
    ['Logic Checker App', 'تطبيق فحص المنطق'],
    ['Debug Type Coercion Errors in a Buggy App', 'صحّح أخطاء تحويل الأنواع في تطبيق معطوب'],
    ['Debug Increment and Decrement Operator Errors in a Buggy App', 'صحّح أخطاء معاملي الزيادة والنقصان في تطبيق معطوب']
  ]);

  if (directMap.has(title)) {
    return directMap.get(title);
  }

  let result = title;

  const replacements = [
    [/^Step (\d+)$/i, (_, stepNumber) => `الخطوة ${stepNumber}`],
    [/^Build /i, 'ابنِ '],
    [/^Debug /i, 'صحّح '],
    [/^Design /i, 'صمّم '],
    [/^Create /i, 'أنشئ '],
    [/^Working With /i, 'التعامل مع '],
    [/^Learn /i, 'تعلّم '],
    [/^Introduction to /i, 'مقدمة إلى ']
  ];

  result = applyTextReplacements(result, replacements);

  const glossary = [
    ['Page', 'صفحة'],
    ['App', 'تطبيق'],
    ['Form', 'نموذج'],
    ['Menu', 'قائمة'],
    ['Cafe', 'مقهى'],
    ['Coffee', 'قهوة'],
    ['Bot', 'روبوت'],
    ['Greeting', 'تحية'],
    ['Player', 'مشغل'],
    ['Gallery', 'معرض'],
    ['Counter', 'عداد'],
    ['Calculator', 'آلة حاسبة'],
    ['Game', 'لعبة'],
    ['Quiz', 'اختبار'],
    ['Card', 'بطاقة'],
    ['Event', 'فعالية'],
    ['Flyer', 'إعلان'],
    ['Greeting', 'ترحيب'],
    ['Parent', 'أولياء الأمور'],
    ['Teacher', 'المعلم'],
    ['Conference', 'اجتماع'],
    ['Job', 'وظيفة'],
    ['Application', 'طلب'],
    ['Colored', 'ملون'],
    ['Marker', 'قلم'],
    ['Markers', 'أقلام'],
    ['Box', 'صندوق'],
    ['Boxes', 'صناديق'],
    ['String', 'نص'],
    ['Inspector', 'فاحص'],
    ['Formatter', 'منسّق'],
    ['Transformer', 'محوّل'],
    ['Logic', 'منطق'],
    ['Checker', 'فاحص'],
    ['Buggy', 'معطوب'],
    ['Errors', 'أخطاء'],
    ['Error', 'خطأ'],
    ['Operator', 'معامل'],
    ['Increment', 'زيادة'],
    ['Decrement', 'نقصان'],
    ['Type', 'نوع'],
    ['Coercion', 'تحويل'],
    ['Forum', 'منتدى'],
    ['Leaderboard', 'لوحة الصدارة'],
    ['Spreadsheet', 'جدول بيانات'],
    ['Todo', 'المهام'],
    ['Color', 'لون'],
    ['Grid', 'شبكة'],
    ['Flexbox', 'Flexbox'],
    ['CSS', 'CSS'],
    ['JavaScript', 'JavaScript']
  ];

  for (const [english, arabic] of glossary) {
    result = result.replace(new RegExp(`\\b${escapeRegExp(english)}\\b`, 'g'), arabic);
  }

  return result;
}

function translateOrdinal(word) {
  const map = {
    first: 'الأول',
    second: 'الثاني',
    third: 'الثالث',
    fourth: 'الرابع',
    fifth: 'الخامس',
    sixth: 'السادس'
  };

  return map[word.toLowerCase()] ?? word;
}

function translateOrdinalFeminine(word) {
  const map = {
    first: 'الأولى',
    second: 'الثانية',
    third: 'الثالثة',
    fourth: 'الرابعة',
    fifth: 'الخامسة',
    sixth: 'السادسة'
  };

  return map[word.toLowerCase()] ?? word;
}

function translateHtmlText(text) {
  if (!text) {
    return '';
  }

  const protectedText = protectSegments(text);
  let result = protectedText.text;

  const replacements = [
    [/^Step (\d+)$/gim, (_, stepNumber) => `الخطوة ${stepNumber}`],
    [/HTML stands for HyperText Markup Language\./g, 'HTML اختصار لـ HyperText Markup Language.'],
    [/It's the code that defines the structure and content of a webpage\./g, 'وهو الكود الذي يحدد بنية صفحة الويب ومحتواها.'],
    [/This is your code editor, where you'll write HTML\./g, 'هذا هو محرر الكود الذي ستكتب فيه HTML.'],
    [/Find line (\d+) in the editor and type this text:/g, (_, lineNumber) => `ابحث عن السطر ${lineNumber} في المحرر واكتب النص التالي:`],
    [/When you are done, click the (__SOLOCODER_TOKEN_\d+__) button to see if it's correct\./g, (_, token) => `عند الانتهاء، اضغط زر ${token} للتأكد من صحة الحل.`],
    [/Notice that /g, 'لاحظ أن '],
    [/In this workshop, you will /g, 'في هذا التمرين ستقوم بـ'],
    [/In this workshop, you are going to /g, 'في هذا التمرين سوف تقوم بـ'],
    [/In this lab you will /g, 'في هذا المختبر ستقوم بـ'],
    [/In this lab, you will /g, 'في هذا المختبر ستقوم بـ'],
    [/In this lesson, you learned /g, 'في هذا الدرس تعلّمت '],
    [/As you recall from an earlier lesson, /g, 'كما تتذكر من درس سابق، '],
    [/Objective: Fulfill the user stories below and get all the tests to pass to complete the lab\./g, 'الهدف: نفّذ المتطلبات التالية ومرّر جميع الاختبارات لإكمال هذا المختبر.'],
    [/Below the other two lines of text, add:/g, 'أسفل السطرين السابقين، أضف ما يلي:'],
    [/Below the /g, 'أسفل '],
    [/Next, /g, 'بعد ذلك، '],
    [/Finally, /g, 'أخيرًا، '],
    [/Last but not least, /g, 'وفي النهاية، '],
    [/You are getting the hang of it\./g, 'أنت بدأت تتقن الفكرة.'],
    [/You are getting closer, /g, 'أنت تقترب أكثر، '],
    [/The next step is to /g, 'الخطوة التالية هي أن '],
    [/You just need to /g, 'كل ما عليك الآن هو أن '],
    [/To do that, /g, 'ولفعل ذلك، '],
    [/Double-check for spelling\./g, 'تأكد من صحة الكتابة.'],
    [/To improve the accessibility of the image you added, /g, 'لتحسين إمكانية الوصول للصورة التي أضفتها، '],
    [/When you need to add a paragraph to a webpage, you can use the p element like this:/g, 'عندما تحتاج إلى إضافة فقرة إلى صفحة ويب، يمكنك استخدام العنصر p بهذا الشكل:'],
    [/There are six heading elements in HTML: h1 through h6\./g, 'يوجد ستة عناصر للعناوين في HTML: من h1 إلى h6.'],
    [/They're used to show the importance of sections on your webpage, with h1 being the most important and h6 the least\./g, 'تُستخدم هذه العناصر لإظهار أهمية الأقسام في الصفحة، حيث يكون h1 الأعلى أهمية وh6 الأقل.'],
    [/The ([a-z0-9-]+) element is used to /gi, (_, elementName) => `يُستخدم العنصر ${elementName} من أجل `],
    [/The ([a-z0-9-]+) attribute /gi, (_, attributeName) => `الخاصية ${attributeName} `],
    [/The title element determines what browsers show in the title bar or tab for the page\./g, 'يحدد العنصر title ما الذي يعرضه المتصفح في شريط العنوان أو في تبويب الصفحة.'],
    [/All pages should begin with /g, 'يجب أن تبدأ كل الصفحات بـ '],
    [/This special string is known as a /g, 'ويُعرف هذا النص الخاص بأنه '],
    [/The html element is the root element of an HTML page and wraps all content on the page\./g, 'العنصر html هو العنصر الجذر في صفحة HTML ويحتوي كل محتوى الصفحة.'],
    [/You can set browser behavior by adding meta elements in the head\./g, 'يمكنك تحديد سلوك المتصفح بإضافة عناصر meta داخل head.'],
    [/Here'?s an example:/g, 'إليك مثالًا:'],
    [/Your ([^.\n]+?) element should have an opening tag\. Opening tags have this syntax: ([^.\n]+)\./g, (_, elementName, syntax) => `يجب أن يحتوي عنصر ${elementName} على وسم افتتاحي. صيغة الوسم الافتتاحي تكون هكذا: ${syntax}.`],
    [/Your ([^.\n]+?) element should have a closing tag\. Closing tags have this syntax: ([^.\n]+)\./g, (_, elementName, syntax) => `يجب أن يحتوي عنصر ${elementName} على وسم إغلاق. صيغة وسم الإغلاق تكون هكذا: ${syntax}.`],
    [/Your ([^.\n]+?) element should have an opening ([^.\n]+?) tag\./g, (_, elementName, tagName) => `يجب أن يحتوي عنصر ${elementName} على وسم افتتاحي ${tagName}.`],
    [/Your ([^.\n]+?) element should have a closing ([^.\n]+?) tag\./g, (_, elementName, tagName) => `يجب أن يحتوي عنصر ${elementName} على وسم إغلاق ${tagName}.`],
    [/Your ([^.\n]+?) element should look like this: ([^.\n]+)\./g, (_, elementName, example) => `يجب أن يبدو عنصر ${elementName} بهذا الشكل: ${example}.`],
    [/You should have the text (.+?) in your editor\.\s*Double-check for spelling\./g, (_, value) => `يجب أن يظهر النص ${value} في المحرر. تأكد من صحة الكتابة.`],
    [/You should have a (second|third|fourth|fifth|sixth) ([a-z0-9-]+) element\./gi, (_, ordinal, elementName) => `يجب أن يكون لديك عنصر ${elementName} ${translateOrdinal(ordinal)}.`],
    [/You should add a (second|third|fourth|fifth|sixth) ([a-z0-9-]+) element to the page\./gi, (_, ordinal, elementName) => `يجب أن تضيف عنصر ${elementName} ${translateOrdinal(ordinal)} إلى الصفحة.`],
    [/You should have a paragraph element with the text (.+?)\.\s*Here'?s an example: ([^.\n]+)\.?/g, (_, value, example) => `يجب أن يحتوي عنصر الفقرة على النص ${value}. مثال: ${example}`],
    [/You should have exactly ([^ ]+) total elements on the page\./g, (_, count) => `يجب أن يوجد بالضبط ${count} من العناصر في الصفحة.`],
    [/You should have exactly ([^ ]+) paragraph elements on the page\./g, (_, count) => `يجب أن يوجد بالضبط ${count} من عناصر الفقرة في الصفحة.`],
    [/You should have exactly ([^ ]+) ([^.\n]+?) on the page\./g, (_, count, subject) => `يجب أن يوجد بالضبط ${count} ${subject} في الصفحة.`],
    [/The text (.+?) should be present in the code\. You may want to check your spelling\./g, (_, value) => `يجب أن يكون النص ${value} موجودًا في الكود. قد تحتاج إلى مراجعة الكتابة.`],
    [/Your ([^.\n]+?) should have an opening tag\. Opening tags have the following syntax: ([^.\n]+)\./g, (_, subject, syntax) => `يجب أن يحتوي ${subject} على وسم افتتاحي. وصيغة الوسم الافتتاحي تكون هكذا: ${syntax}.`],
    [/Your ([^.\n]+?) should have a closing tag\. Closing tags have a \/ just after the < character\./g, (_, subject) => `يجب أن يحتوي ${subject} على وسم إغلاق. يبدأ وسم الإغلاق بعلامة / مباشرة بعد الحرف <.`],
    [/Your comment should start with <!--\.\s*You are missing one or more of the characters that define the start of a comment\./g, 'يجب أن يبدأ التعليق بـ <!--. أنت تفتقد واحدًا أو أكثر من الرموز التي تحدد بداية التعليق.'],
    [/Your comment should start with <!--\./g, 'يجب أن يبدأ التعليق بـ <!--.'],
    [/Your comment should end with -->\.\s*You are missing one or more of the characters that define the end of a comment\./g, 'يجب أن ينتهي التعليق بـ -->. أنت تفتقد واحدًا أو أكثر من الرموز التي تحدد نهاية التعليق.'],
    [/Your comment should end with -->\./g, 'يجب أن ينتهي التعليق بـ -->.'],
    [/Your code should not have extra opening\/closing comment characters\. You have an extra <!-- or --> displaying in the browser\./g, 'يجب ألا يحتوي الكود على رموز تعليق زائدة. لديك <!-- أو --> إضافية تظهر في المتصفح.'],
    [/Your comment should be above the ([^.\n]+?)\.\s*You have them in the wrong order\./g, (_, subject) => `يجب أن يكون التعليق أعلى ${subject}. الترتيب الحالي غير صحيح.`],
    [/Your ([^.\n]+?) element's text should be ([^.\n]+)\./g, (_, elementName, value) => `يجب أن يكون نص عنصر ${elementName} هو ${value}.`],
    [/Your ([^.\n]+?) element should have an? ([^.\n]+?) attribute with the value ([^.\n]+)\./g, (_, elementName, attributeName, value) => `يجب أن يحتوي عنصر ${elementName} على الخاصية ${attributeName} بالقيمة ${value}.`],
    [/Your ([^.\n]+?) element should be nested within the ([^.\n]+?) element\./g, (_, child, parent) => `يجب أن يكون عنصر ${child} متداخلاً داخل عنصر ${parent}.`],
    [/Your ([^.\n]+?) element should be inside the ([^.\n]+?) element\./g, (_, child, parent) => `يجب أن يكون عنصر ${child} داخل عنصر ${parent}.`],
    [/The text ([^.\n]+) should be within the ([^.\n]+?) element\./g, (_, value, elementName) => `يجب أن يكون النص ${value} داخل عنصر ${elementName}.`],
    [/The text ([^.\n]+) should be inside the ([^.\n]+?) element\./g, (_, value, elementName) => `يجب أن يكون النص ${value} داخل عنصر ${elementName}.`]
  ];

  result = applyTextReplacements(result, replacements);

  const glossary = [
    ['one', '1'],
    ['two', '2'],
    ['three', '3'],
    ['four', '4'],
    ['five', '5'],
    ['six', '6'],
    ['webpage', 'صفحة ويب'],
    ['web page', 'صفحة ويب'],
    ['code editor', 'محرر الكود'],
    ['preview', 'المعاينة'],
    ['editor', 'المحرر'],
    ['elements', 'العناصر'],
    ['element', 'العنصر'],
    ['attributes', 'الخصائص'],
    ['attribute', 'الخاصية'],
    ['heading', 'عنوان'],
    ['headings', 'عناوين'],
    ['subheading', 'عنوان فرعي'],
    ['paragraph', 'فقرة'],
    ['paragraphs', 'فقرات'],
    ['link', 'رابط'],
    ['links', 'روابط'],
    ['image', 'صورة'],
    ['images', 'صور'],
    ['button', 'زر'],
    ['buttons', 'أزرار'],
    ['browser', 'المتصفح'],
    ['page', 'الصفحة'],
    ['text', 'النص'],
    ['code', 'الكود']
  ];

  for (const [english, arabic] of glossary) {
    result = result.replace(new RegExp(`\\b${escapeRegExp(english)}\\b`, 'gi'), arabic);
  }

  result = applyTextReplacements(result, [
    [/You should have the النص (.+?) in your المحرر\. تأكد من صحة الكتابة\./g, (_, value) => `يجب أن يظهر النص ${value} في المحرر. تأكد من صحة الكتابة.`],
    [/You should have a فقرة العنصر with the النص (.+?)\. إليك مثالًا: ([^.\n]+)\.?/g, (_, value, example) => `يجب أن يحتوي عنصر الفقرة على النص ${value}. مثال: ${example}`],
    [/يتكوّن HTML من عناصر\.\s*The first 1 you will use is the عنصر ([a-z0-9-]+):\s*It starts with an opening tag \((<[^)]+>)\), ends with a closing tag \((<[^)]+>)\), and has the النص it will display in between the tags\.\s*Turn your (.+?) النص into an عنصر ([a-z0-9-]+) by adding an opening tag in front of it, and a closing tag after it\./gi, (_, elementName, openingTag, closingTag, value) => `يتكوّن HTML من عناصر. أول عنصر ستستخدمه هو ${elementName}: يبدأ بوسم افتتاحي ${openingTag}، وينتهي بوسم إغلاق ${closingTag}، وبينهما يظهر النص الذي سيعرضه العنصر. حوّل النص ${value} إلى عنصر ${elementName} بإضافة وسم افتتاحي قبله ووسم إغلاق بعده.`],
    [/لاحظ أن HTML الذي تكتبه في المحرر يظهر مباشرة في المعاينة\.\s*في هذا التمرين ستكتب HTML لجزء من صفحة منهج تدريبي\.\s*Below your عنصر ([a-z0-9-]+), type the following on the empty line:/gi, (_, elementName) => `لاحظ أن HTML الذي تكتبه في المحرر يظهر مباشرة في المعاينة. في هذا التمرين ستكتب HTML لجزء من صفحة منهج تدريبي. أسفل عنصر ${elementName}، اكتب ما يلي في السطر الفارغ:`],
    [/An عنصر ([a-z0-9-]+) is the main عنوان of a صفحة ويب and you should only use 1 per الصفحة\.\s*تمثل عناصر ([a-z0-9-]+) عناوين فرعية\.\s*يمكنك استخدام أكثر من عنصر واحد منها في الصفحة، ويكون شكلها هكذا:\s*Turn the (.+?) النص into an عنصر ([a-z0-9-]+) by surrounding it with opening and closing ([a-z0-9-]+) tags\./gi, (_, mainElement, subheadingElement, value, targetElement) => `العنصر ${mainElement} هو العنوان الرئيسي لصفحة الويب ويجب استخدامه مرة واحدة فقط في الصفحة. تمثل عناصر ${subheadingElement} العناوين الفرعية. يمكنك استخدام أكثر من عنصر واحد منها في الصفحة، ويكون شكلها هكذا: حوّل النص ${value} إلى عنصر ${targetElement} من خلال إحاطته بوسمي ${targetElement} الافتتاحي والإغلاق.`],
    [/HTML is made up of العناصر\./g, 'يتكوّن HTML من عناصر.'],
    [/The first 1 you will use is the عنصر ([a-z0-9-]+):/gi, (_, elementName) => `أول عنصر ستستخدمه هو ${elementName}:`],
    [/It starts with an opening tag \((<[^)]+>)\), ends with a closing tag \((<[^)]+>)\), and has the النص it will display in between the tags\./g, (_, openingTag, closingTag) => `يبدأ بوسم افتتاحي ${openingTag}، وينتهي بوسم إغلاق ${closingTag}، وبينهما يظهر النص الذي سيعرضه العنصر.`],
    [/Turn your (.+?) النص into an عنصر ([a-z0-9-]+) by adding an opening tag in front of it, and a closing tag after it\./gi, (_, value, elementName) => `حوّل النص ${value} إلى عنصر ${elementName} بإضافة وسم افتتاحي قبله ووسم إغلاق بعده.`],
    [/لاحظ أن the HTML you write in the المحرر shows up in the المعاينة\./g, 'لاحظ أن HTML الذي تكتبه في المحرر يظهر مباشرة في المعاينة.'],
    [/في هذا التمرين ستقوم بـwrite the HTML for a partial curriculum صفحة ويب\./g, 'في هذا التمرين ستكتب HTML لجزء من صفحة منهج تدريبي.'],
    [/Below your عنصر ([a-z0-9-]+), type the following on the empty line:/gi, (_, elementName) => `أسفل عنصر ${elementName}، اكتب ما يلي في السطر الفارغ:`],
    [/An عنصر ([a-z0-9-]+) is the main عنوان of a صفحة ويب and you should only use 1 per الصفحة\./gi, (_, elementName) => `العنصر ${elementName} هو العنوان الرئيسي لصفحة الويب ويجب استخدامه مرة واحدة فقط في الصفحة.`],
    [/([a-z0-9-]+) العناصر represent subheadings\./gi, (_, elementName) => `تمثل عناصر ${elementName} عناوين فرعية.`],
    [/You can have multiple per الصفحة and they look like this:/g, 'يمكنك استخدام أكثر من عنصر واحد منها في الصفحة، ويكون شكلها هكذا:'],
    [/Turn the (.+?) النص into an عنصر ([a-z0-9-]+) by surrounding it with opening and closing ([a-z0-9-]+) tags\./gi, (_, value, elementName) => `حوّل النص ${value} إلى عنصر ${elementName} من خلال إحاطته بوسمي ${elementName} الافتتاحي والإغلاق.`],
    [/You should have /g, 'يجب أن يكون لديك '],
    [/You should add /g, 'يجب أن تضيف '],
    [/in your المحرر/g, 'في المحرر'],
    [/with the النص /g, 'بالنص '],
    [/Your الكود should not have extra opening\/closing comment characters\.\s*You have an extra <!-- or --> displaying in the المتصفح\./g, 'يجب ألا يحتوي الكود على رموز تعليق زائدة. لديك <!-- أو --> إضافية تظهر في المتصفح.'],
    [/Your comment should contain the النص (.+?)\./g, (_, value) => `يجب أن يحتوي التعليق على النص ${value}.`],
    [/([a-z0-9-]+) العنصر/gi, (_, value) => `عنصر ${value}`],
    [/You have either omitted the النص or have a typo\./g, 'قد تكون حذفت النص أو كتبتَه بشكل غير صحيح.']
  ]);

  result = result
    .replace(/\s{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return finalizeArabicHtmlText(protectTextRestore(result, protectedText.restore));
}

function protectTextRestore(text, restore) {
  return restore(text);
}

function finalizeArabicHtmlText(text) {
  return applyTextReplacements(text, [
    [/يتكوّن HTML من عناصر\.\s*The first 1 you will use is the عنصر ([a-z0-9-]+):\s*It starts with an opening tag \((<[^)]+>)\), ends with a closing tag \((<[^)]+>)\), and has the النص it will display in between the tags\.\s*Turn your (.+?) النص into an عنصر ([a-z0-9-]+) by adding an opening tag in front of it, and a closing tag after it\./gi, (_, elementName, openingTag, closingTag, value) => `يتكوّن HTML من عناصر. أول عنصر ستستخدمه هو ${elementName}: يبدأ بوسم افتتاحي ${openingTag}، وينتهي بوسم إغلاق ${closingTag}، وبينهما يظهر النص الذي سيعرضه العنصر. حوّل النص ${value} إلى عنصر ${elementName} بإضافة وسم افتتاحي قبله ووسم إغلاق بعده.`],
    [/لاحظ أن HTML الذي تكتبه في المحرر يظهر مباشرة في المعاينة\.\s*في هذا التمرين ستكتب HTML لجزء من صفحة منهج تدريبي\.\s*Below your عنصر ([a-z0-9-]+), type the following on the empty line:/gi, (_, elementName) => `لاحظ أن HTML الذي تكتبه في المحرر يظهر مباشرة في المعاينة. في هذا التمرين ستكتب HTML لجزء من صفحة منهج تدريبي. أسفل عنصر ${elementName}، اكتب ما يلي في السطر الفارغ:`],
    [/An عنصر ([a-z0-9-]+) is the main عنوان of a صفحة ويب and you should only use 1 per الصفحة\.\s*تمثل عناصر ([a-z0-9-]+) عناوين فرعية\.\s*يمكنك استخدام أكثر من عنصر واحد منها في الصفحة، ويكون شكلها هكذا:\s*Turn the (.+?) النص into an عنصر ([a-z0-9-]+) by surrounding it with opening and closing ([a-z0-9-]+) tags\./gi, (_, mainElement, subheadingElement, value, targetElement) => `العنصر ${mainElement} هو العنوان الرئيسي لصفحة الويب ويجب استخدامه مرة واحدة فقط في الصفحة. تمثل عناصر ${subheadingElement} العناوين الفرعية. يمكنك استخدام أكثر من عنصر واحد منها في الصفحة، ويكون شكلها هكذا: حوّل النص ${value} إلى عنصر ${targetElement} من خلال إحاطته بوسمي ${targetElement} الافتتاحي والإغلاق.`]
  ]);
}

function translateCssText(text) {
  if (!text) {
    return '';
  }

  const protectedText = protectSegments(text);
  let result = protectedText.text;

  result = applyTextReplacements(result, [
    [/^Step (\d+)$/gim, (_, stepNumber) => `الخطوة ${stepNumber}`],
    [/Objective: Fulfill the user stories below and get all the tests to pass to complete the lab\./g, 'الهدف: نفّذ المتطلبات التالية ومرّر جميع الاختبارات لإكمال هذا المختبر.'],
    [/In this lab, you will practice /g, 'في هذا المختبر ستتدرّب على '],
    [/In this lab, you'll practice /g, 'في هذا المختبر ستتدرّب على '],
    [/In this lab you will practice /g, 'في هذا المختبر ستتدرّب على '],
    [/In this lab, you will create /g, 'في هذا المختبر ستقوم بإنشاء '],
    [/In this workshop, you will practice the basics of CSS \(Cascading Style Sheets\) by building a cafe menu\./g, 'في هذا التمرين ستتدرّب على أساسيات CSS (Cascading Style Sheets) من خلال بناء قائمة لمقهى.'],
    [/Let's start by adding some menu content\./g, 'لنبدأ بإضافة بعض محتوى القائمة.'],
    [/Add an? ([a-z0-9-]+) element within the existing ([a-z0-9-]+) element\./gi, (_, child, parent) => `أضف عنصر ${child} داخل عنصر ${parent} الموجود بالفعل.`],
    [/Add an? ([a-z0-9-]+) element within your ([a-z0-9-]+) element\./gi, (_, child, parent) => `أضف عنصر ${child} داخل عنصر ${parent}.`],
    [/It will eventually contain pricing information about coffee and desserts offered by the cafe\./g, 'وسيحتوي لاحقًا على معلومات الأسعار الخاصة بالقهوة والحلويات التي يقدمها المقهى.'],
    [/The name of the cafe is (.+?)\. So, add an? ([a-z0-9-]+) element within your ([a-z0-9-]+) element\./gi, (_, cafeName, child, parent) => `اسم المقهى هو ${cafeName}. لذلك أضف عنصر ${child} داخل عنصر ${parent}.`],
    [/Give it the name of the cafe in capitalized letters to make it stand out\./g, 'اكتب فيه اسم المقهى بحروف كبيرة ليظهر بشكل أوضح.'],
    [/To let visitors know (.+?), add a ([a-z0-9-]+) element below the ([a-z0-9-]+) element with the text (.+?)\./gi, (_, detail, elementName, parent, value) => `لإخبار الزوار بأن ${detail}، أضف عنصر ${elementName} أسفل عنصر ${parent} بالنص ${value}.`],
    [/There will be two sections on the menu, one for coffees and one for desserts\./g, 'سيكون في القائمة قسمان: واحد للقهوة وآخر للحلويات.'],
    [/Add a ([a-z0-9-]+) element within the ([a-z0-9-]+) element so you have a place to put all the coffees available\./gi, (_, child, parent) => `أضف عنصر ${child} داخل عنصر ${parent} حتى يكون لديك مكان لوضع جميع أنواع القهوة المتوفرة.`],
    [/Create an? ([a-z0-9-]+) element in the ([a-z0-9-]+) element and give it the text (.+?)\./gi, (_, child, parent, value) => `أنشئ عنصر ${child} داخل عنصر ${parent} واكتب فيه النص ${value}.`],
    [/Until now, you've had limited control over the presentation and appearance of your content\./g, 'حتى الآن كان تحكمك في شكل المحتوى ومظهره محدودًا.'],
    [/To change that, add a ([a-z0-9-]+) element within the ([a-z0-9-]+) element\./gi, (_, child, parent) => `ولتغيير ذلك، أضف عنصر ${child} داخل عنصر ${parent}.`],
    [/In previous lessons, you learned how to add CSS properties and values like this:/g, 'في الدروس السابقة تعلّمت كيف تضيف خصائص CSS وقيمها بهذا الشكل:'],
    [/In the previous step, you used a .* to style the ([a-z0-9-]+) element\./gi, (_, elementName) => `في الخطوة السابقة استخدمت محددًا لتنسيق عنصر ${elementName}.`],
    [/Center the content of the ([a-z0-9-]+) and the ([a-z0-9-]+) elements by adding a new type selector for each one to the existing style element\./gi, (_, first, second) => `وسّط محتوى عنصري ${first} و${second} بإضافة محدد نوع جديد لكل منهما داخل عنصر style الحالي.`],
    [/You now have three type selectors with the same styling\./g, 'لديك الآن ثلاثة محددات نوع بالتنسيق نفسه.'],
    [/You can add the same group of styles to many elements by creating a list of selectors\./g, 'يمكنك تطبيق المجموعة نفسها من الأنماط على عدة عناصر عبر إنشاء قائمة من المحددات.'],
    [/Each selector is separated with commas like this:/g, 'ويتم الفصل بين كل محدد والآخر بفاصلة بهذا الشكل:'],
    [/You have styled three elements by writing CSS inside the style tags\./g, 'لقد نسّقت ثلاثة عناصر بكتابة CSS داخل وسوم style.'],
    [/This works, but since there will be many more styles, it's best to put all the styles in a separate file and link to it\./g, 'وهذا يعمل، لكن بما أنه ستكون هناك أنماط أكثر لاحقًا فمن الأفضل وضعها في ملف منفصل ثم ربطه بالصفحة.'],
    [/Now that you have the CSS in the styles\.css file, go ahead and remove the style element and all its content\./g, 'الآن بعد أن أصبح CSS داخل ملف styles.css، احذف عنصر style وكل ما بداخله.'],
    [/Once it is removed, the text that was centered will shift back to the left\./g, 'وبعد حذفه سيعود النص المتمركز إلى اليسار من جديد.'],
    [/Now you need to link the styles\.css file, so the styles will be applied again\./g, 'الآن تحتاج إلى ربط ملف styles.css حتى يتم تطبيق التنسيقات مرة أخرى.'],
    [/Inside the ([a-z0-9-]+) element, add a ([a-z0-9-]+) element\./gi, (_, parent, child) => `داخل عنصر ${parent} أضف عنصر ${child}.`],
    [/Give it a ([a-z0-9-]+) attribute with the value of ("[^"]+"|'[^']+') and an ([a-z0-9-]+) attribute with the value of ("[^"]+"|'[^']+')\./gi, (_, firstAttr, firstValue, secondAttr, secondValue) => `أعطه الخاصية ${firstAttr} بالقيمة ${firstValue} والخاصية ${secondAttr} بالقيمة ${secondValue}.`],
    [/For the styling of the page to look similar on mobile as it does on a desktop or laptop, you need to add a meta element with a special content attribute\./g, 'لكي يبدو تنسيق الصفحة متقاربًا على الهاتف وعلى الحاسوب، تحتاج إلى إضافة عنصر meta بصفة content خاصة.'],
    [/The text is centered again so the link to the CSS file is working\./g, 'عاد النص إلى التوسيط، وهذا يعني أن ربط ملف CSS يعمل بشكل صحيح.'],
    [/Add another style to the file that changes the ([a-z-]+) property to ([a-zA-Z0-9#(). -]+) for the ([a-z0-9-]+) element\./gi, (_, propertyName, value, elementName) => `أضف تنسيقًا آخر إلى الملف يغيّر الخاصية ${propertyName} إلى ${value} لعنصر ${elementName}.`],
    [/That brown background makes it hard to read the text\./g, 'هذه الخلفية البنية تجعل قراءة النص أصعب.'],
    [/Change the ([a-z0-9-]+) element's background color to ([a-zA-Z0-9#(). -]+) so it has some color, but you are still able to read the text\./gi, (_, elementName, value) => `غيّر لون خلفية عنصر ${elementName} إلى ${value} حتى تضيف لونًا مع بقاء النص مقروءًا.`],
    [/The ([a-z0-9-]+) element is used mainly for design layout purposes, unlike the other content elements you have used so far\./gi, (_, elementName) => `يُستخدم عنصر ${elementName} غالبًا لأغراض التخطيط والتصميم، بخلاف عناصر المحتوى الأخرى التي استخدمتها حتى الآن.`],
    [/Add a ([a-z0-9-]+) element inside the ([a-z0-9-]+) element and then move all the other elements inside the new ([a-z0-9-]+)\./gi, (_, child, parent, target) => `أضف عنصر ${child} داخل عنصر ${parent} ثم انقل جميع العناصر الأخرى داخل عنصر ${target} الجديد.`],
    [/Your code should have an opening (<[^>]+>) tag\./g, (_, tagName) => `يجب أن يحتوي الكود على وسم افتتاحي ${tagName}.`],
    [/Your code should have a closing (<[^>]+>) tag\./g, (_, tagName) => `يجب أن يحتوي الكود على وسم إغلاق ${tagName}.`],
    [/You should have an opening (<[^>]+>) tag\./g, (_, tagName) => `يجب أن يحتوي الكود على وسم افتتاحي ${tagName}.`],
    [/You should have a closing (<[^>]+>) tag\./g, (_, tagName) => `يجب أن يحتوي الكود على وسم إغلاق ${tagName}.`],
    [/You should have the text (.+?)\./g, (_, value) => `يجب أن يظهر النص ${value}.`],
    [/Continue to the next step\./g, 'انتقل إلى الخطوة التالية.']
  ]);

  result = result
    .replace(/\s{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return finalizeArabicCssText(protectTextRestore(result, protectedText.restore));
}

function translateJavascriptText(text) {
  if (!text) {
    return '';
  }

  const protectedText = protectSegments(text);
  let result = protectedText.text;

  result = applyTextReplacements(result, [
    [/^Step (\d+)$/gim, (_, stepNumber) => `الخطوة ${stepNumber}`],
    [/Objective: Fulfill the user stories below and get all the tests to pass to complete the lab\./g, 'الهدف: نفّذ المتطلبات التالية ومرّر جميع الاختبارات لإكمال هذا المختبر.'],
    [/In this lab, you will /g, 'في هذا المختبر ستقوم بـ'],
    [/In this lab you will /g, 'في هذا المختبر ستقوم بـ'],
    [/In this workshop, you are going to /g, 'في هذا التمرين سوف تقوم بـ'],
    [/In this workshop, you will /g, 'في هذا التمرين ستقوم بـ'],
    [/In this workshop you will learn how to work with JavaScript fundamentals by building a greeting bot\./g, 'في هذا التمرين ستتعلم أساسيات JavaScript من خلال بناء روبوت ترحيب.'],
    [/In this first step, you will want to output a message to the console from the greeting bot\./g, 'في هذه الخطوة الأولى ستقوم بإظهار رسالة من روبوت الترحيب داخل الـ console.'],
    [/Remember that you learned about (__SOLOCODER_TOKEN_\d+__) and strings in previous lessons\./g, (_, token) => `تذكّر أنك تعلّمت في الدروس السابقة عن ${token} وعن strings.`],
    [/Here is a reminder of how to use (__SOLOCODER_TOKEN_\d+__) with strings:/g, (_, token) => `إليك تذكيرًا بطريقة استخدام ${token} مع strings:`],
    [/Add a (__SOLOCODER_TOKEN_\d+__) statement that outputs the string (__SOLOCODER_TOKEN_\d+__) to the console\. Don't forget your quotes around the message!/g, (_, statement, value) => `أضف تعليمة ${statement} تطبع النص ${value} في الـ console. لا تنسَ علامات الاقتباس حول الرسالة.`],
    [/Now you should see the first message from the bot in the console\./g, 'الآن يجب أن ترى الرسالة الأولى من الروبوت داخل الـ console.'],
    [/It is time to add a second message from the bot\./g, 'حان الوقت لإضافة رسالة ثانية من الروبوت.'],
    [/Add another console\.log statement to output the message (__SOLOCODER_TOKEN_\d+__) to the console\./g, (_, value) => `أضف تعليمة console.log أخرى لطباعة الرسالة ${value} في الـ console.`],
    [/In previous lessons, you learned about the let keyword and how to declare variables in JavaScript\./g, 'في الدروس السابقة تعلّمت عن الكلمة المفتاحية let وكيفية تعريف المتغيرات في JavaScript.'],
    [/Use the let keyword to declare a variable called ([a-zA-Z_$][\w$]*)\./g, (_, variableName) => `استخدم الكلمة المفتاحية let لتعريف متغير باسم ${variableName}.`],
    [/NOTE:\s*/g, 'ملاحظة: '],
    [/Now, it is time to assign a value to your ([a-zA-Z_$][\w$]*) variable\./g, (_, variableName) => `الآن حان الوقت لإسناد قيمة إلى المتغير ${variableName}.`],
    [/Remember that what is on the right side of the assignment operator = is the value that you are assigning to the variable on the left side\./g, 'تذكّر أن ما يوجد على يمين عامل الإسناد = هو القيمة التي تسندها إلى المتغير الموجود على اليسار.'],
    [/Assign the string (__SOLOCODER_TOKEN_\d+__) to the ([a-zA-Z_$][\w$]*) variable\./g, (_, value, variableName) => `أسند النص ${value} إلى المتغير ${variableName}.`],
    [/Now, it is time to initialize the ([a-zA-Z_$][\w$]*) variable\./g, (_, variableName) => `الآن حان الوقت لتهيئة المتغير ${variableName}.`],
    [/Now, it is time to add another message from the bot\./g, 'الآن حان الوقت لإضافة رسالة أخرى من الروبوت.'],
    [/Earlier, you created the ([a-zA-Z_$][\w$]*) and ([a-zA-Z_$][\w$]*) variables\. Now, you will use them to output new messages to the console\./g, (_, firstName, secondName) => `في وقت سابق أنشأت المتغيرين ${firstName} و${secondName}. والآن ستستخدمهما لطباعة رسائل جديدة في الـ console.`],
    [/The next message from the bot will concern the bot's location\./g, 'الرسالة التالية من الروبوت ستكون عن موقعه.'],
    [/In previous lessons, you learned how to reassign values to variables like this:/g, 'في الدروس السابقة تعلّمت كيف تعيد إسناد القيم إلى المتغيرات بهذا الشكل:'],
    [/Now it is time to see the new bot value\./g, 'الآن حان وقت رؤية القيمة الجديدة للروبوت.'],
    [/Now it looks like the bot wants to change their nickname\./g, 'يبدو الآن أن الروبوت يريد تغيير لقبه.'],
    [/To see the bot's new nickname, you will need to log a new message to the console\./g, 'ولرؤية لقب الروبوت الجديد ستحتاج إلى طباعة رسالة جديدة في الـ console.'],
    [/The last few messages from the bot will focus on the bot's favorite subject\./g, 'ستركز الرسائل الأخيرة من الروبوت على مادته المفضلة.'],
    [/Next, create a variable called ([a-zA-Z_$][\w$]*)\./g, (_, variableName) => `بعد ذلك أنشئ متغيرًا باسم ${variableName}.`],
    [/For the final step, you will log the bot's message of (__SOLOCODER_TOKEN_\d+__) to the console\./g, (_, value) => `في الخطوة الأخيرة ستطبع رسالة الروبوت ${value} في الـ console.`],
    [/Objective: Fulfill the user stories below and get all the tests to pass to complete the lab\./g, 'الهدف: نفّذ المتطلبات التالية ومرّر جميع الاختبارات لإكمال هذا المختبر.'],
    [/You should have an? (first|second|third|fourth) (__SOLOCODER_TOKEN_\d+__) statement in your code\./g, (_, order, token) => `يجب أن يكون لديك ${translateOrdinal(order)} ${token} في الكود.`],
    [/You should have an? (__SOLOCODER_TOKEN_\d+__) statement in your code\./g, (_, token) => `يجب أن يكون لديك ${token} في الكود.`],
    [/Your console statement should have the message (__SOLOCODER_TOKEN_\d+__)\. Don't forget the quotes\./g, (_, value) => `يجب أن تحتوي تعليمة console على الرسالة ${value}. لا تنسَ علامات الاقتباس.`],
    [/You should have the let keyword in your code\./g, 'يجب أن تكون الكلمة المفتاحية let موجودة في الكود.'],
    [/You should declare a variable called ([a-zA-Z_$][\w$]*)\./g, (_, variableName) => `يجب أن تعرّف متغيرًا باسم ${variableName}.`],
    [/You should use the let keyword to declare the variable\./g, 'يجب أن تستخدم الكلمة المفتاحية let لتعريف المتغير.'],
    [/Use the let keyword to declare a variable\./g, 'استخدم الكلمة المفتاحية let لتعريف متغير.'],
    [/Your variable should be named ([a-zA-Z_$][\w$]*)\./g, (_, variableName) => `يجب أن يكون اسم المتغير ${variableName}.`],
    [/You should assign a string to your ([a-zA-Z_$][\w$]*) variable\./g, (_, variableName) => `يجب أن تسند نصًا إلى المتغير ${variableName}.`],
    [/Your ([a-zA-Z_$][\w$]*) variable should be assigned the string (__SOLOCODER_TOKEN_\d+__)\./g, (_, variableName, value) => `يجب أن تُسند إلى المتغير ${variableName} القيمة النصية ${value}.`],
    [/You should have a variable called ([a-zA-Z_$][\w$]*)\./g, (_, variableName) => `يجب أن يكون لديك متغير باسم ${variableName}.`],
    [/Continue to the next step\./g, 'انتقل إلى الخطوة التالية.']
  ]);

  result = result
    .replace(/\s{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return finalizeArabicJavascriptText(protectTextRestore(result, protectedText.restore));
}

function translateCategoryTitle(category, title) {
  if (category === 'html') {
    return translateHtmlTitle(title);
  }

  return translateGenericTitle(title);
}

function translateCategoryText(category, text) {
  if (category === 'html') {
    return translateHtmlText(text);
  }

  if (category === 'css') {
    return translateCssText(text);
  }

  if (category === 'javascript') {
    return translateJavascriptText(text);
  }

  return '';
}

function finalizeArabicCssText(text) {
  return applyTextReplacements(text, [
    [/Objective: Fulfill the user stories below and get all the tests to pass to complete the lab\.?/g, 'الهدف: نفّذ المتطلبات التالية ومرّر جميع الاختبارات لإكمال هذا المختبر.'],
    [/في هذا المختبر ستتدرّب على the different styles that can be applied to links when they are hovered over, focused, clicked, and visited\./g, 'في هذا المختبر ستتدرّب على الأنماط المختلفة التي يمكن تطبيقها على الروابط عند تمرير المؤشر فوقها أو التركيز عليها أو النقر عليها أو بعد زيارتها.'],
    [/في هذا المختبر ستتدرّب على how to style backgrounds and borders by creating a blog post card\./g, 'في هذا المختبر ستتدرّب على تنسيق الخلفيات والحدود من خلال إنشاء بطاقة تدوينة.'],
    [/في هذا المختبر ستتدرّب على using CSS colors by designing boxes\./g, 'في هذا المختبر ستتدرّب على استخدام ألوان CSS من خلال تصميم صناديق.'],
    [/In this lab, you will practice the different styles that can be applied to links when they are hovered over, focused, clicked, and visited\./g, 'في هذا المختبر ستتدرّب على الأنماط المختلفة التي يمكن تطبيقها على الروابط عند تمرير المؤشر فوقها أو التركيز عليها أو النقر عليها أو بعد زيارتها.'],
    [/In this lab, you will practice how to style backgrounds and borders by creating a blog post card\./g, 'في هذا المختبر ستتدرّب على تنسيق الخلفيات والحدود من خلال إنشاء بطاقة تدوينة.'],
    [/In this lab, you will practice using CSS colors by designing boxes\./g, 'في هذا المختبر ستتدرّب على استخدام ألوان CSS من خلال تصميم صناديق.'],
    [/In this workshop, you will practice working with different pseudo-classes and pseudo-elements by designing a greeting card\. The HTML boilerplate has been provided for you\./g, 'في هذا التمرين ستتدرّب على استخدام pseudo-classes وpseudo-elements المختلفة من خلال تصميم بطاقة ترحيب. تم توفير قالب HTML الأساسي لك.'],
    [/In this workshop, you will practice how to add custom styles to radio buttons by building a parent teacher conference form\. The HTML boilerplate has been provided for you\./g, 'في هذا التمرين ستتدرّب على إضافة تنسيقات مخصّصة لأزرار الاختيار radio من خلال بناء نموذج اجتماع أولياء الأمور والمعلمين. تم توفير قالب HTML الأساسي لك.'],
    [/Within the body, nest an h1 element with the text CSS Color Markers\./g, 'داخل عنصر body، ضع عنصر h1 يحتوي على النص CSS Color Markers.'],
    [/The name of the cafe is (.+?)\. So, /g, (_, cafeName) => `اسم المقهى هو ${cafeName}. لذلك `],
    [/the cafe was founded in 2020/g, 'المقهى تأسس عام 2020'],
    [/Start the workshop by linking the styles\.css file\./g, 'ابدأ هذا التمرين بربط ملف styles.css.'],
    [/Create a div element that has an id of ([a-z0-9_-]+) and a class of ([a-z0-9_-]+)\./gi, (_, idValue, className) => `أنشئ عنصر div بمعرّف id قيمته ${idValue} وبـ class قيمتها ${className}.`],
    [/Inside the div element, add an h1 with the text (.+?)\./g, (_, value) => `داخل عنصر div، أضف عنصر h1 بالنص ${value}.`],
    [/Then add a paragraph element with a class called ([a-z0-9_-]+) and the text (.+?)\./gi, (_, className, value) => `ثم أضف عنصر فقرة class الخاص به ${className} ويحتوي على النص ${value}.`],
    [/Now it is time to style your greeting card\./g, 'الآن حان وقت تنسيق بطاقة الترحيب الخاصة بك.'],
    [/Add a selector for the ([a-z0-9._#-]+) element, then:/gi, (_, elementName) => `أضف محددًا للعنصر ${elementName}، ثم:`],
    [/change the font-family to be Arial followed by the generic sans-serif,/g, 'غيّر قيمة font-family إلى Arial ثم generic sans-serif،'],
    [/give a padding on all sides of 40px,/g, 'اجعل قيمة padding من جميع الجهات 40px،'],
    [/set the text-align property to center\./g, 'اضبط الخاصية text-align على center.'],
    [/Now it's time for some color\./g, 'الآن حان وقت إضافة بعض الألوان.'],
    [/Give the body a background-color of ([^.\n]+) and also give the ([#.a-z0-9_-]+) a background-color of ([^.\n]+)\./gi, (_, firstValue, selector, secondValue) => `اجعل قيمة background-color للعنصر body هي ${firstValue}، واجعل قيمة background-color للمحدد ${selector} هي ${secondValue}.`],
    [/Next, inside your ([a-z0-9._#-]+) element, add an ([a-z0-9._#-]+) element with the text (.+?) and the classes (.+?)\./gi, (_, parent, child, value, classes) => `بعد ذلك، داخل عنصر ${parent} أضف عنصر ${child} بالنص ${value} وبالـ classes التالية: ${classes}.`],
    [/Next, add a paragraph element with the text (.+?)\. Your paragraph element should also have the classes (.+?)\./g, (_, value, classes) => `بعد ذلك أضف عنصر فقرة بالنص ${value}. ويجب أن يحتوي عنصر الفقرة أيضًا على الـ classes التالية: ${classes}.`],
    [/Now it is time to add the form and input elements, which will represent the parent and student information\. Start by adding a form element below the p element\./g, 'الآن حان وقت إضافة عناصر form وinput التي ستمثل بيانات ولي الأمر والطالب. ابدأ بإضافة عنصر form أسفل عنصر p.'],
    [/The name of the cafe is (.+?)\. So, add an? ([a-z0-9-]+) element within your ([a-z0-9-]+) element\./gi, (_, cafeName, child, parent) => `اسم المقهى هو ${cafeName}. لذلك أضف عنصر ${child} داخل عنصر ${parent}.`],
    [/To let visitors know (.+?), add a ([a-z0-9-]+) element below the ([a-z0-9-]+) element with the text (.+?)\./gi, (_, detail, elementName, parent, value) => `لإخبار الزوار بأن ${detail}، أضف عنصر ${elementName} أسفل عنصر ${parent} بالنص ${value}.`],
    [/You should not change your existing ([a-z0-9#._-]+) element\. Make sure you did not delete the closing tag\./gi, (_, elementName) => `يجب ألا تغيّر عنصر ${elementName} الموجود بالفعل. تأكد من أنك لم تحذف وسم الإغلاق.`],
    [/You should not change your existing ([a-z0-9#._-]+) element\. Make sure you didn't delete the closing tag\./gi, (_, elementName) => `يجب ألا تغيّر عنصر ${elementName} الموجود بالفعل. تأكد من أنك لم تحذف وسم الإغلاق.`],
    [/You should not change your existing ([a-z0-9#._-]+) element\./gi, (_, elementName) => `يجب ألا تغيّر عنصر ${elementName} الموجود بالفعل.`],
    [/You should not change your ([a-z0-9#._-]+) element\. Make sure you don't accidentally delete your closing tag\./gi, (_, elementName) => `يجب ألا تغيّر عنصر ${elementName}. تأكد من أنك لم تحذف وسم الإغلاق عن طريق الخطأ.`],
    [/Your ([a-z0-9#._-]+) element should be below your ([a-z0-9#._-]+) element\./gi, (_, child, parent) => `يجب أن يكون عنصر ${child} أسفل عنصر ${parent}.`],
    [/Your ([a-z0-9#._-]+) element should be within your ([a-z0-9#._-]+) element\./gi, (_, child, parent) => `يجب أن يكون عنصر ${child} داخل عنصر ${parent}.`],
    [/Your ([a-z0-9#._-]+) tag should be within your ([a-z0-9#._-]+) tag\./gi, (_, child, parent) => `يجب أن يكون وسم ${child} داخل وسم ${parent}.`],
    [/Your ([a-z0-9#._-]+) element should be nested in your ([a-z0-9#._-]+) element\./gi, (_, child, parent) => `يجب أن يكون عنصر ${child} متداخلًا داخل عنصر ${parent}.`],
    [/Your ([a-z0-9#._-]+) element should have the text (.+?)\./gi, (_, elementName, value) => `يجب أن يحتوي عنصر ${elementName} على النص ${value}.`],
    [/Start by adding a ([a-z0-9#._-]+) element with a class called ([a-z0-9#._ -]+)\./gi, (_, elementName, className) => `ابدأ بإضافة عنصر ${elementName} يحتوي على class باسم ${className}.`],
    [/You should have an? ([a-z0-9#._-]+) element\./gi, (_, elementName) => `يجب أن يكون لديك عنصر ${elementName}.`],
    [/The ([a-z0-9#._-]+) element should have an id of ([a-z0-9#._-]+)\./gi, (_, elementName, value) => `يجب أن يحتوي عنصر ${elementName} على id قيمته ${value}.`],
    [/The ([a-z0-9#._-]+) element should have a class of ([a-z0-9#._ -]+)\./gi, (_, elementName, value) => `يجب أن يحتوي عنصر ${elementName} على class قيمتها ${value}.`],
    [/Your ([a-z0-9#._-]+) element should have a class called ([a-z0-9#._ -]+)\./gi, (_, elementName, value) => `يجب أن يحتوي عنصر ${elementName} على class باسم ${value}.`],
    [/Your ([a-z0-9#._-]+) element should have the classes (.+?)\./gi, (_, elementName, value) => `يجب أن يحتوي عنصر ${elementName} على الـ classes التالية: ${value}.`],
    [/Your ([a-z0-9#._-]+) element should have an? ([a-z0-9_-]+) attribute with the value ([^.\n]+)\./gi, (_, elementName, attr, value) => `يجب أن يحتوي عنصر ${elementName} على الخاصية ${attr} بالقيمة ${value}.`],
    [/The ([a-z0-9#._-]+) element should be below the ([a-z0-9#._-]+) element\./gi, (_, child, parent) => `يجب أن يكون عنصر ${child} أسفل عنصر ${parent}.`],
    [/The ([a-z0-9#._-]+) element should have a background-color of ([^.\n]+)\./gi, (_, elementName, value) => `يجب أن تكون قيمة background-color للعنصر ${elementName} هي ${value}.`],
    [/You should have a ([#.a-z0-9_-]+) selector\./gi, (_, selector) => `يجب أن يكون لديك المحدد ${selector}.`],
    [/You should set ([a-z-]+) to ([^.\n]+) in the ([#.a-z0-9_-]+) selector\./gi, (_, propertyName, value, selector) => `يجب أن تضبط الخاصية ${propertyName} على القيمة ${value} داخل المحدد ${selector}.`],
    [/You should set the ([a-z-]+) property to ([^.\n]+)\./gi, (_, propertyName, value) => `يجب أن تضبط الخاصية ${propertyName} على القيمة ${value}.`],
    [/Your ([a-z-]+) property should have a value of ([^.\n]+)\./gi, (_, propertyName, value) => `يجب أن تكون قيمة الخاصية ${propertyName} هي ${value}.`],
    [/Your selector should set the ([a-z-]+) property to ([^.\n]+)\./gi, (_, propertyName, value) => `يجب أن يضبط المحدد الخاصية ${propertyName} على القيمة ${value}.`],
    [/Your ([#.a-z0-9_-]+) selector should have a ([^.\n]+) background\./gi, (_, selector, value) => `يجب أن تكون خلفية المحدد ${selector} بالقيمة ${value}.`],
    [/Your ([#.a-z0-9_-]+) selector should have a background-color of ([^.\n]+)\./gi, (_, selector, value) => `يجب أن تكون قيمة background-color للمحدد ${selector} هي ${value}.`],
    [/Your code should have an opening (<[^>]+>) tag\./g, (_, tagName) => `يجب أن يحتوي الكود على وسم افتتاحي ${tagName}.`],
    [/Your code should have a closing (<[^>]+>) tag\./g, (_, tagName) => `يجب أن يحتوي الكود على وسم إغلاق ${tagName}.`],
    [/You should have an opening (<[^>]+>) tag\./g, (_, tagName) => `يجب أن يحتوي الكود على وسم افتتاحي ${tagName}.`],
    [/You should have a closing (<[^>]+>) tag\./g, (_, tagName) => `يجب أن يحتوي الكود على وسم إغلاق ${tagName}.`],
    [/You should have the text (.+?)\./g, (_, value) => `يجب أن يظهر النص ${value}.`]
  ]);
}

function finalizeArabicJavascriptText(text) {
  return applyTextReplacements(text, [
    [/Objective: Fulfill the user stories below and get all the tests to pass to complete the lab\.?/g, 'الهدف: نفّذ المتطلبات التالية ومرّر جميع الاختبارات لإكمال هذا المختبر.'],
    [/في هذا المختبر ستقوم بـcreate two different stories using a sentence template\. You will use variables to store different parts of the story and then output the stories to the console\./g, 'في هذا المختبر ستنشئ قصتين مختلفتين باستخدام قالب جملة. وستستخدم المتغيرات لتخزين الأجزاء المختلفة من القصة ثم تطبع القصتين في الـ console.'],
    [/في هذا التمرين سوف تقوم بـcontinue learning about strings by building a Teacher Chatbot\./g, 'في هذا التمرين ستواصل تعلم strings من خلال بناء روبوت معلم للدردشة.'],
    [/في هذا التمرين ستقوم بـpractice working with the includes\(\) and slice\(\) methods\./g, 'في هذا التمرين ستتدرّب على استخدام الدالتين includes() وslice().'],
    [/في هذا التمرين ستقوم بـpractice working with various string methods used for formatting strings\./g, 'في هذا التمرين ستتدرّب على استخدام عدة دوال خاصة بالنصوص تُستخدم لتنسيق strings.'],
    [/في هذا التمرين ستقوم بـpractice working with the replace\(\), replaceAll\(\) and repeat\(\) methods by building a string transformer app\./g, 'في هذا التمرين ستتدرّب على استخدام الدوال replace() وreplaceAll() وrepeat() من خلال بناء تطبيق لتحويل النصوص.'],
    [/In this lab, you will create two different stories using a sentence template\. You will use variables to store different parts of the story and then output the stories to the console\./g, 'في هذا المختبر ستنشئ قصتين مختلفتين باستخدام قالب جملة. وستستخدم المتغيرات لتخزين الأجزاء المختلفة من القصة ثم تطبع القصتين في الـ console.'],
    [/In this workshop, you are going to continue learning about strings by building a Teacher Chatbot\./g, 'في هذا التمرين ستواصل تعلم strings من خلال بناء روبوت معلم للدردشة.'],
    [/In this workshop, you will practice working with the includes\(\) and slice\(\) methods\./g, 'في هذا التمرين ستتدرّب على استخدام الدالتين includes() وslice().'],
    [/In this workshop, you will practice working with various string methods used for formatting strings\./g, 'في هذا التمرين ستتدرّب على استخدام عدة دوال خاصة بالنصوص تُستخدم لتنسيق strings.'],
    [/In this workshop, you will practice working with the replace\(\), replaceAll\(\) and repeat\(\) methods by building a string transformer app\./g, 'في هذا التمرين ستتدرّب على استخدام الدوال replace() وreplaceAll() وrepeat() من خلال بناء تطبيق لتحويل النصوص.'],
    [/You've just joined a local web development shop, and your first assignment is to clean up some buggy code left behind by the previous developers\./g, 'لقد انضممت للتو إلى فريق محلي لتطوير الويب، وكانت مهمتك الأولى هي تنظيف بعض الأكواد المعطوبة التي تركها المطورون السابقون.'],
    [/Your friend has asked you to help them debug their code\. They are practicing increment and decrement operators but are getting unexpected results in the console\./g, 'طلب منك صديقك مساعدته في تصحيح الكود. فهو يتدرّب على معاملي الزيادة والنقصان لكنه يحصل على نتائج غير متوقعة في الـ console.'],
    [/In this workshop, you'll learn how to work with conditional statements and comparison operators\./g, 'في هذا التمرين ستتعلم كيفية التعامل مع الجمل الشرطية ومعاملات المقارنة.'],
    [/Here is a reminder of how to use console\.log\(\) with strings:/g, 'إليك تذكيرًا بطريقة استخدام console.log() مع strings:'],
    [/Add a console\.log\(\) statement that outputs the string ("[^"]+") to the console\. Don't forget your quotes around the message!/g, (_, value) => `أضف تعليمة console.log() تطبع النص ${value} في الـ console. لا تنسَ علامات الاقتباس حول الرسالة.`],
    [/Add another console\.log statement to output the message ("[^"]+") to the console\./g, (_, value) => `أضف تعليمة console.log أخرى لطباعة الرسالة ${value} في الـ console.`],
    [/Add another console statement to the code that logs the message ("[^"]+")\./g, (_, value) => `أضف تعليمة console أخرى إلى الكود تطبع الرسالة ${value}.`],
    [/Here is a reminder of how to declare a variable using the let keyword:/g, 'إليك تذكيرًا بطريقة تعريف متغير باستخدام الكلمة المفتاحية let:'],
    [/Use the let keyword to declare a variable called ([a-zA-Z_$][\w$]*)\./g, (_, variableName) => `استخدم الكلمة المفتاحية let لتعريف متغير باسم ${variableName}.`],
    [/NOTE: You are using let here because later on in the workshop, you will be changing the value of the ([a-zA-Z_$][\w$]*) variable\./g, (_, variableName) => `ملاحظة: نستخدم let هنا لأنك ستقوم لاحقًا في هذا التمرين بتغيير قيمة المتغير ${variableName}.`],
    [/Now it is time to set the bot's name\./g, 'الآن حان وقت تحديد اسم الروبوت.'],
    [/Now it is time to create a greeting using the ([a-zA-Z_$][\w$]*) variable\./g, (_, variableName) => `الآن حان وقت إنشاء رسالة ترحيب باستخدام المتغير ${variableName}.`],
    [/In previous lessons, you learned how to assign values to variables like this:/g, 'في الدروس السابقة تعلّمت كيف تُسند القيم إلى المتغيرات بهذا الشكل:'],
    [/In previous lessons, you learned how to concatenate strings using template literals like this:/g, 'في الدروس السابقة تعلّمت كيف تربط النصوص باستخدام template literals بهذا الشكل:'],
    [/In previous lessons, you learned how to work with string concatenation using the \+ operator to concatenate strings together\./g, 'في الدروس السابقة تعلّمت كيف تستخدم ربط النصوص بواسطة العامل + لضم النصوص معًا.'],
    [/Remember that what is on the right side of the assignment operator = is the value that you are assigning to the variable on the left side\./g, 'تذكّر أن ما يوجد على يمين عامل الإسناد = هو القيمة التي تسندها إلى المتغير الموجود على اليسار.'],
    [/Using reassignment, assign the string ("[^"]+") to the ([a-zA-Z_$][\w$]*) variable\./g, (_, value, variableName) => `باستخدام إعادة الإسناد، أسند النص ${value} إلى المتغير ${variableName}.`],
    [/When you need to declare variables with multiple words, you can use the <dfn>camelCase<\/dfn> naming convention\./g, 'عندما تحتاج إلى تعريف متغيرات تتكون من أكثر من كلمة، يمكنك استخدام أسلوب التسمية camelCase.'],
    [/When using camelCase, the first word is all lowercase and the first letter of each subsequent word is capitalized\./g, 'عند استخدام camelCase تكون الكلمة الأولى كلها بحروف صغيرة، ويكون أول حرف من كل كلمة تالية كبيرًا.'],
    [/Here is an example:/g, 'إليك مثالًا:'],
    [/Declare and assign the string ("[^"]+") to the ([a-zA-Z_$][\w$]*) variable on the same line using the let keyword\./g, (_, value, variableName) => `عرّف المتغير ${variableName} وأسند له النص ${value} في السطر نفسه باستخدام الكلمة المفتاحية let.`],
    [/Create a variable called ([a-zA-Z_$][\w$]*) and assign it the string value of ("[^"]+")\./g, (_, variableName, value) => `أنشئ متغيرًا باسم ${variableName} وأسند له القيمة النصية ${value}.`],
    [/Create a variable called ([a-zA-Z_$][\w$]*) and assign it the string value ("[^"]+")\./g, (_, variableName, value) => `أنشئ متغيرًا باسم ${variableName} وأسند له القيمة النصية ${value}.`],
    [/Create a variable named ([a-zA-Z_$][\w$]*) and assign it the string ("[^"]+")\./g, (_, variableName, value) => `أنشئ متغيرًا باسم ${variableName} وأسند له النص ${value}.`],
    [/To begin, create a variable named ([a-zA-Z_$][\w$]*) and assign it the string ("[^"]+")\./g, (_, variableName, value) => `للبداية، أنشئ متغيرًا باسم ${variableName} وأسند له النص ${value}.`],
    [/To begin, add a console statement, with the message of ("[^"]+")\./g, (_, value) => `للبداية، أضف تعليمة console تحتوي على الرسالة ${value}.`],
    [/Create a variable named ([a-zA-Z_$][\w$]*)\./g, (_, variableName) => `أنشئ متغيرًا باسم ${variableName}.`],
    [/Start by creating a variable called ([a-zA-Z_$][\w$]*)\./g, (_, variableName) => `ابدأ بإنشاء متغير باسم ${variableName}.`],
    [/Next, using template literal syntax, assign a string that says ([^.]+), followed by the ([a-zA-Z_$][\w$]*) variable, and ending with a period \(\.\)\./g, (_, textPrefix, variableName) => `بعد ذلك، وباستخدام صيغة template literal، أسند نصًا يقول ${textPrefix} ثم يضيف قيمة المتغير ${variableName} وينتهي بنقطة (.).`],
    [/Finally, log the ([a-zA-Z_$][\w$]*) variable to the console\./g, (_, variableName) => `وأخيرًا، اطبع المتغير ${variableName} في الـ console.`],
    [/The next step is to create a few more variables that will be used in future bot messages\./g, 'الخطوة التالية هي إنشاء بعض المتغيرات الإضافية التي ستُستخدم في رسائل الروبوت القادمة.'],
    [/Then create a variable called ([a-zA-Z_$][\w$]*) and assign it the string value ("[^"]+")\./g, (_, variableName, value) => `ثم أنشئ متغيرًا باسم ${variableName} وأسند له القيمة النصية ${value}.`],
    [/As you recall from the prior lessons, the includes\(\) method checks if a string contains a specific substring and returns true or false\./g, 'كما تتذكر من الدروس السابقة، تتحقق الدالة includes() مما إذا كان النص يحتوي على جزء نصي محدد وتعيد true أو false.'],
    [/Here is an example using the includes\(\) method:/g, 'إليك مثالًا على استخدام includes():'],
    [/Then assign it the result of using the includes\(\) method on ([a-zA-Z_$][\w$]*) to check if it contains ("[^"]+")\./g, (_, variableName, value) => `ثم أسند إليه نتيجة استخدام includes() على المتغير ${variableName} للتحقق مما إذا كان يحتوي على ${value}.`],
    [/Now use either a template literal or string concatenation to log the message (.+?) to the console\./g, (_, message) => `استخدم الآن إما template literal أو ربط النصوص لطباعة الرسالة التالية في الـ console: ${message}.`],
    [/Replace <([a-zA-Z_$][\w$]*)> with the actual value of the variable\./g, (_, variableName) => `استبدل <${variableName}> بالقيمة الفعلية للمتغير.`],
    [/Use console\.log\(\) to log ("[^"]+") to the console\./g, (_, value) => `استخدم console.log() لطباعة ${value} في الـ console.`],
    [/You should have a console statement\./g, 'يجب أن يكون لديك تعليمة console.'],
    [/Your console statement should output the message ("[^"]+")\./g, (_, value) => `يجب أن تطبع تعليمة console الرسالة ${value}.`],
    [/You should have a (first|second|third|fourth) console\.log\(\) statement in your code\./g, (_, order) => `يجب أن يكون لديك تعليمة console.log() ${translateOrdinalFeminine(order)} في الكود.`],
    [/You should have a console\.log\(\) statement in your code\./g, 'يجب أن يكون لديك تعليمة console.log() في الكود.'],
    [/Your console statement should have the message ("[^"]+")\. Don't forget the quotes\./g, (_, value) => `يجب أن تحتوي تعليمة console على الرسالة ${value}. لا تنسَ علامات الاقتباس.`],
    [/يجب أن يكون لديك (الأولى|الثانية|الثالثة|الرابعة) console\.log\(\) في الكود\./g, (_, order) => `يجب أن يكون لديك تعليمة console.log() ${order} في الكود.`],
    [/يجب أن يكون لديك (الأول|الثاني|الثالث|الرابع) console\.log\(\) في الكود\./g, (_, order) => {
      const ordinalMap = {
        الأول: 'الأولى',
        الثاني: 'الثانية',
        الثالث: 'الثالثة',
        الرابع: 'الرابعة'
      };
      return `يجب أن يكون لديك تعليمة console.log() ${ordinalMap[order] ?? order} في الكود.`;
    }],
    [/You should have a ([a-zA-Z_$][\w$]*) variable\./g, (_, variableName) => `يجب أن يكون لديك متغير باسم ${variableName}.`],
    [/You should declare a variable named ([a-zA-Z_$][\w$]*)\./g, (_, variableName) => `يجب أن تعرّف متغيرًا باسم ${variableName}.`],
    [/Your ([a-zA-Z_$][\w$]*) variable should be a string\./g, (_, variableName) => `يجب أن تكون قيمة المتغير ${variableName} نصًا.`],
    [/Your ([a-zA-Z_$][\w$]*) variable should hold the value of a string\./g, (_, variableName) => `يجب أن يحمل المتغير ${variableName} قيمة نصية.`],
    [/Your ([a-zA-Z_$][\w$]*) variable should have the value of ("[^"]+")\./g, (_, variableName, value) => `يجب أن تكون قيمة المتغير ${variableName} هي ${value}.`],
    [/You should assign the string ("[^"]+") to the ([a-zA-Z_$][\w$]*) variable\./g, (_, value, variableName) => `يجب أن تسند النص ${value} إلى المتغير ${variableName}.`],
    [/You should assign the string ("[^"]+") to your ([a-zA-Z_$][\w$]*) variable\./g, (_, value, variableName) => `يجب أن تسند النص ${value} إلى المتغير ${variableName}.`],
    [/You should use string concatenation with the \+ operator to join the string ("[^"]+") with the ([a-zA-Z_$][\w$]*) variable followed by a period \(\.\)\. Be mindful of spaces\./g, (_, value, variableName) => `يجب أن تستخدم ربط النصوص بواسطة العامل + لضم النص ${value} مع المتغير ${variableName} ثم تضيف نقطة (.). وانتبه للمسافات.`],
    [/You should use string concatenation to join the string ("[^"]+") with the ([a-zA-Z_$][\w$]*) variable followed by a period \(\.\)\. Be mindful of the spaces\./g, (_, value, variableName) => `يجب أن تستخدم ربط النصوص لضم النص ${value} مع المتغير ${variableName} ثم تضيف نقطة (.). وانتبه للمسافات.`],
    [/Assign this concatenated string to the ([a-zA-Z_$][\w$]*) variable\./g, (_, variableName) => `أسند هذا النص الناتج عن الربط إلى المتغير ${variableName}.`],
    [/You should use template literals to concatenate the string (.+?) with the ([a-zA-Z_$][\w$]*) variable followed by a period \(\.\)\./g, (_, value, variableName) => `يجب أن تستخدم template literals لدمج النص ${value} مع المتغير ${variableName} ثم تضيف نقطة (.).`],
    [/You should use ([a-zA-Z_$][\w$]*)\.includes\((".*?")\)\./g, (_, variableName, value) => `يجب أن تستخدم ${variableName}.includes(${value}).`],
    [/You should assign the result of ([a-zA-Z_$][\w$]*\.includes\(".*?"\)) to your ([a-zA-Z_$][\w$]*) variable\./g, (_, expression, variableName) => `يجب أن تسند ناتج ${expression} إلى المتغير ${variableName}.`],
    [/You should log ("[^"]+") to the console\./g, (_, value) => `يجب أن تطبع ${value} في الـ console.`],
    [/You should log the message (.+?), where <([a-zA-Z_$][\w$]*)> should be replaced with the actual value of the variable\./g, (_, message, variableName) => `يجب أن تطبع الرسالة ${message}، مع استبدال <${variableName}> بالقيمة الفعلية للمتغير.`]
  ]);
}

function getLocalizedProjectCopy(category, title, description) {
  return {
    titleAr: translateCategoryTitle(category, title),
    descriptionAr: translateCategoryText(category, description)
  };
}

function getLocalizedStepCopy(category, step) {
  return {
    titleAr: translateCategoryTitle(category, step.title),
    descriptionAr: translateCategoryText(category, step.description),
    instructionsAr: translateCategoryText(category, step.instructions)
  };
}

function extractCodeBlocks(markdown) {
  if (!markdown) {
    return [];
  }

  const blocks = [];
  const regex = /```([^\n`]*)\r?\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(markdown)) !== null) {
    blocks.push({
      language: normalizeLanguage(match[1]),
      rawLanguage: match[1].trim(),
      code: match[2]
    });
  }

  return blocks;
}

function replaceEditableRegion(code, replacement) {
  if (!code.includes(EDITABLE_REGION_MARKER)) {
    return code;
  }

  const segments = code.split(EDITABLE_REGION_MARKER);

  if (segments.length < 3) {
    return code.replaceAll(EDITABLE_REGION_MARKER, replacement);
  }

  return `${segments[0]}${replacement}${segments.slice(2).join(EDITABLE_REGION_MARKER)}`;
}

function extractEditableRegion(code) {
  if (!code.includes(EDITABLE_REGION_MARKER)) {
    return code.trim();
  }

  const segments = code.split(EDITABLE_REGION_MARKER);

  if (segments.length < 3) {
    return '';
  }

  return segments[1].replace(/^\n+|\n+$/g, '');
}

function injectStyleTag(html, cssContent) {
  const linkRegex = /<link[^>]*href=["']\.\/styles\.css["'][^>]*>/i;

  if (linkRegex.test(html)) {
    return html.replace(linkRegex, `<style>\n${cssContent}\n</style>`);
  }

  if (html.includes('</head>')) {
    return html.replace('</head>', `<style>\n${cssContent}\n</style>\n</head>`);
  }

  return `<style>\n${cssContent}\n</style>\n${html}`;
}

function injectScriptTag(html, jsContent) {
  const scriptSrcRegex = /<script[^>]*src=["']\.\/script\.js["'][^>]*>\s*<\/script>/i;

  if (scriptSrcRegex.test(html)) {
    return html.replace(scriptSrcRegex, `<script>\n${jsContent}\n</script>`);
  }

  if (html.includes('</body>')) {
    return html.replace('</body>', `<script>\n${jsContent}\n</script>\n</body>`);
  }

  return `${html}\n<script>\n${jsContent}\n</script>`;
}

function buildPreviewTemplate(codeBlocks, editableBlock) {
  const htmlBlock = codeBlocks.find(block => block.language === 'html');
  const cssBlock = codeBlocks.find(block => block.language === 'css');
  const jsBlock = codeBlocks.find(block => block.language === 'javascript');
  const editableLanguage = editableBlock.language;

  if (editableLanguage === 'html') {
    let html = replaceEditableRegion(htmlBlock?.code ?? editableBlock.code, PREVIEW_PLACEHOLDER);

    if (cssBlock) {
      html = injectStyleTag(html, cssBlock.code);
    }

    if (jsBlock) {
      html = injectScriptTag(html, jsBlock.code);
    }

    return html;
  }

  let html = htmlBlock?.code ?? '<!DOCTYPE html><html><head></head><body></body></html>';
  const cssContent = editableLanguage === 'css' ? replaceEditableRegion(editableBlock.code, PREVIEW_PLACEHOLDER) : cssBlock?.code ?? '';
  const jsContent = editableLanguage === 'javascript' ? replaceEditableRegion(editableBlock.code, PREVIEW_PLACEHOLDER) : jsBlock?.code ?? '';

  if (cssContent) {
    html = injectStyleTag(html, cssContent);
  }

  if (jsContent) {
    html = injectScriptTag(html, jsContent);
  }

  return html;
}

function extractExpectedOutput(challenge, editorLanguage) {
  const sources = [
    challenge.sections?.solutions?.content,
    challenge.sections?.solution?.content,
    challenge.sections?.answer?.content
  ];

  for (const source of sources) {
    const blocks = extractCodeBlocks(source);

    if (blocks.length === 0) {
      continue;
    }

    const matchingBlock = blocks.find(block => block.language === editorLanguage);
    return (matchingBlock ?? blocks[0]).code.trim();
  }

  return '';
}

function normalizeHintDescription(hint, index) {
  const textParts = [hint?.text, hint?.trailingText].filter(Boolean).map(stripMarkdown);
  const text = textParts.join('\n').trim();

  if (text) {
    return text;
  }

  return `Pass imported freeCodeCamp check ${index + 1}.`;
}

function toTestCases(challenge, category) {
  if (!Array.isArray(challenge.hints) || challenge.hints.length === 0) {
    return [
      {
        id: `${challenge.id}-autopass`,
        description: 'Continue to the next step.',
        descriptionAr: translateCategoryText(category, 'Continue to the next step.'),
        testLogic: 'return true;'
      }
    ];
  }

  const cases = challenge.hints.map((hint, index) => {
    const description = normalizeHintDescription(hint, index);

    return {
      id: `${challenge.id}-hint-${index + 1}`,
      description,
      descriptionAr: translateCategoryText(category, description),
      testLogic: hint?.assertion?.trim() ? hint.assertion.trim() : 'return true;'
    };
  });

  if (cases.length === 0) {
    return [
      {
        id: `${challenge.id}-autopass`,
        description: 'Continue to the next step.',
        descriptionAr: translateCategoryText(category, 'Continue to the next step.'),
        testLogic: 'return true;'
      }
    ];
  }

  return cases;
}

function detectCategoryFromChapter(superblockSlug, chapterSlug) {
  const chapter = (chapterSlug ?? '').toLowerCase();
  const superblock = (superblockSlug ?? '').toLowerCase();

  if (superblock === 'responsive-web-design-v9') {
    if (chapter === 'html') {
      return 'html';
    }

    if (chapter === 'css') {
      return 'css';
    }

    return null;
  }

  if (superblock === 'javascript-v9') {
    return 'javascript';
  }

  return null;
}

function inferCategoryFromSlug(slug) {
  const value = slug.toLowerCase();

  if (value.includes('javascript')) {
    return 'javascript';
  }

  if (value.includes('css')) {
    return 'css';
  }

  if (value.includes('html')) {
    return 'html';
  }

  return null;
}

function toStep(challenge, stepNumber, blockLabel, category) {
  const seedMarkdown =
    challenge.sections?.seed?.subsections?.['seed-contents'] ??
    challenge.sections?.seed?.content ??
    '';

  const codeBlocks = extractCodeBlocks(seedMarkdown);
  const editableBlock =
    codeBlocks.find(block => block.code.includes(EDITABLE_REGION_MARKER)) ??
    codeBlocks[0] ??
    null;

  if (!editableBlock) {
    return null;
  }

  const editorLanguage = editableBlock.language;
  const stepDescription = stripMarkdown(
    challenge.description ??
      challenge.sections?.description?.content ??
      challenge.sections?.interactive?.content ??
      ''
  );
  const instructions = stripMarkdown(challenge.instructions ?? stepDescription);
  const previewTemplate = buildPreviewTemplate(codeBlocks, editableBlock);
  const expectedOutput = extractExpectedOutput(challenge, editorLanguage);
  const testSetupBlocks = extractCodeBlocks(challenge.sections?.['before-each']?.content ?? '');
  const testSetup = testSetupBlocks[0]?.code?.trim() ?? '';

  const step = {
    id: challenge.id,
    stepNumber,
    title: challenge.title,
    description: stepDescription,
    instructions,
    seedCode: extractEditableRegion(editableBlock.code),
    expectedOutput,
    editorLanguage,
    editorFileName: languageToFilename(editorLanguage),
    previewTemplate,
    validationMode: 'freecodecamp',
    testSetup,
    testCases: toTestCases(challenge, category),
    blockLabel
  };

  return {
    ...step,
    ...getLocalizedStepCopy(category, step)
  };
}

function buildPreviewHtml(step) {
  if (!step.previewTemplate) {
    return '';
  }

  const previewCode = step.expectedOutput || step.seedCode || '';
  return step.previewTemplate.replaceAll(PREVIEW_PLACEHOLDER, previewCode);
}

function blockXpReward(blockLabel, totalSteps) {
  if (blockLabel === 'lab') {
    return Math.max(180, totalSteps * 40);
  }

  if (blockLabel === 'lecture') {
    return Math.max(100, totalSteps * 18);
  }

  return Math.max(120, totalSteps * 28);
}

function blockEstimatedTime(blockLabel, totalSteps) {
  const minutesPerStep = blockLabel === 'lab' ? 5 : 3;
  const minutes = Math.max(10, totalSteps * minutesPerStep);
  return `${minutes} دقيقة`;
}

function createProjectDescription(block, steps) {
  const primaryText =
    firstParagraph(block.challenges?.[0]?.description) ||
    firstParagraph(steps[0]?.description) ||
    `Practice ${humanizeSlug(block.slug)}.`;

  return primaryText.slice(0, 260);
}

function createProjectTitle(block) {
  const singleChallengeTitle = block.challenges?.[0]?.title ?? '';

  if (block.challengeCount === 1 && singleChallengeTitle && !/^Step \d+$/i.test(singleChallengeTitle)) {
    return singleChallengeTitle;
  }

  return humanizeSlug(block.slug);
}

function convertBlockToProject(block, category, projectNumber) {
  if (block.blockLabel === 'review' || block.blockLabel === 'quiz') {
    return null;
  }

  const steps = block.challenges
    .map((challenge, index) => toStep(challenge, index + 1, block.blockLabel, category))
    .filter(Boolean);

  if (steps.length === 0) {
    return null;
  }

  const projectId = `${category}-${String(projectNumber).padStart(3, '0')}-${block.slug}`;
  const previewHtml = buildPreviewHtml(steps[steps.length - 1]);

  const projectTitle = createProjectTitle(block);
  const projectDescription = createProjectDescription(block, steps);

  return {
    project: {
      id: projectId,
      number: projectNumber,
      title: projectTitle,
      description: projectDescription,
      status: category === 'html' && projectNumber === 1 ? 'in-progress' : 'locked',
      completedSteps: 0,
      totalSteps: steps.length,
      xpReward: blockXpReward(block.blockLabel, steps.length),
      estimatedTime: blockEstimatedTime(block.blockLabel, steps.length),
      editorLanguage: steps[0].editorLanguage,
      previewHtml,
      ...getLocalizedProjectCopy(category, projectTitle, projectDescription)
    },
    steps: steps.map(step => ({
      ...step,
      id: `${projectId}-step-${step.stepNumber}`
    }))
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const inputPath = path.resolve(process.cwd(), options.input);
  const projectsDir = path.resolve(process.cwd(), options.projectsDir);
  const curriculumDir = path.resolve(process.cwd(), options.curriculumDir);
  const raw = await readFile(inputPath, 'utf8');
  const imported = JSON.parse(raw);

  const projectBuckets = {
    html: [],
    css: [],
    javascript: []
  };
  const lessonBuckets = {
    html: {},
    css: {},
    javascript: {}
  };
  const counters = {
    html: 1,
    css: 1,
    javascript: 1
  };

  const selectedCategories = new Set(options.categories);

  for (const superblock of imported.superblocks ?? []) {
    const blockMap = new Map((superblock.blocks ?? []).map(block => [block.slug, block]));

    if (Array.isArray(superblock.chapters)) {
      for (const chapter of superblock.chapters) {
        const category = detectCategoryFromChapter(superblock.slug, chapter.dashedName);

        if (!category || !selectedCategories.has(category)) {
          continue;
        }

        for (const curriculumModule of chapter.modules ?? []) {
          for (const blockSlug of curriculumModule.blocks ?? []) {
            const block = blockMap.get(blockSlug);

            if (!block) {
              continue;
            }

            const converted = convertBlockToProject(block, category, counters[category]);

            if (!converted) {
              continue;
            }

            counters[category] += 1;
            projectBuckets[category].push(converted.project);
            lessonBuckets[category][converted.project.id] = converted.steps;
          }
        }
      }

      continue;
    }

    const fallbackCategory = inferCategoryFromSlug(superblock.slug);

    if (!fallbackCategory || !selectedCategories.has(fallbackCategory)) {
      continue;
    }

    for (const block of superblock.blocks ?? []) {
      const converted = convertBlockToProject(block, fallbackCategory, counters[fallbackCategory]);

      if (!converted) {
        continue;
      }

      counters[fallbackCategory] += 1;
      projectBuckets[fallbackCategory].push(converted.project);
      lessonBuckets[fallbackCategory][converted.project.id] = converted.steps;
    }
  }

  await mkdir(projectsDir, { recursive: true });
  await mkdir(curriculumDir, { recursive: true });

  for (const category of options.categories) {
    const projectPath = path.join(projectsDir, `${category}.json`);
    const curriculumPath = path.join(curriculumDir, `${category}.json`);

    await writeFile(projectPath, `${JSON.stringify(projectBuckets[category], null, 2)}\n`, 'utf8');
    await writeFile(curriculumPath, `${JSON.stringify(lessonBuckets[category], null, 2)}\n`, 'utf8');
  }

  console.log(
    JSON.stringify(
      {
        input: inputPath,
        categories: options.categories,
        projects: Object.fromEntries(options.categories.map(category => [category, projectBuckets[category].length])),
        curriculumCategories: Object.fromEntries(
          options.categories.map(category => [category, Object.keys(lessonBuckets[category]).length])
        )
      },
      null,
      2
    )
  );
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
