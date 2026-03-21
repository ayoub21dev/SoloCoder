export interface TestCase {
  id: string;
  description: string;
  testLogic: string;
}

export interface Step {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  instructions: string;
  seedCode: string;
  expectedOutput: string;
  testCases: TestCase[];
}

export const lessons: Record<string, Step[]> = {
  "html-1": [
    {
      id: "html-1-step-1",
      stepNumber: 1,
      title: "الخطوة الأولى: كتابة نص بسيط",
      description: "مرحبًا بك في عالم البرمجة! كل صفحات الويب التي تراها مبنية باستخدام لغة تسمى HTML اختصاراً لـ (HyperText Markup Language). تخيل أن HTML هي الهيكل العظمي لصفحة الويب.\n\nدعنا نبدأ بكتابة أول كود لنا. شاشة المحرر التي تراها في المنتصف هي المكان الذي سنكتب فيه الكود.",
      instructions: "في محرر الكود، اكتب فقط النص `Hello World`.",
      seedCode: "",
      expectedOutput: "Hello World",
      testCases: [
        {
          id: "tc-1-1",
          description: "يجب أن يحتوي المحرر على النص 'Hello World'.",
          testLogic: "return /Hello\\s*World/gi.test(code);"
        }
      ]
    },
    {
      id: "html-1-step-2",
      stepNumber: 2,
      title: "الخطوة الثانية: وسوم HTML",
      description: "رائع! الآن النص العادي غير كافٍ. لكي يفهم المتصفح نوع المحتوى الذي نعرضه، نستخدم ما يسمى بـ 'الوسوم' (Tags).\n\nالوسوم تتكون من أقواس زاوية كالتالي `<name>`.\nوسم العنوان الرئيسي يُكتب كالتالي المعبر `<h1>` (يُسمى فتاحة) ويُغلق باستخدام `</h1>` (يُسمى غلاقة).\n\nيُستخدم الوسم `h1` للعناوين الأكثر أهمية في الصفحة.",
      instructions: "ضع النص الذي كتبته `Hello World` داخل وسم `<h1>` لتجعله عنواناً رئيسياً.",
      seedCode: "Hello World",
      expectedOutput: "<h1>Hello World</h1>",
      testCases: [
        {
          id: "tc-2-1",
          description: "يجب أن يبدأ الكود بوسم الفتح `<h1>` ولينتهي بوسم الإغلاق `</h1>`.",
          testLogic: "return /<h1.*?>.*?<\\/h1>/gi.test(code);"
        },
        {
           id: "tc-2-2",
           description: "يجب أن يكون النص 'Hello World' داخل وسم `<h1>`.",
           testLogic: "return /<h1.*?>\\s*Hello World\\s*<\\/h1>/gi.test(code);"
        }
      ]
    },
    {
      id: "html-1-step-3",
      stepNumber: 3,
      title: "الخطوة الثالثة: العناوين الفرعية",
      description: "العناوين في HTML تأتي بستة أحجام مختلفة، تبدأ من `<h1>` وصولاً إلى `<h6>`.\n\nفي هذه الخطوة، سنتعلم استخدام وسم `<h2>` وهو عنوان مستوى ثاني.",
      instructions: "أضف وسم `<h2>` أسفل وسم `<h1>` مباشرة، واكتب بداخله الكلمة `My Profile`.",
      seedCode: "<h1>Hello World</h1>\n",
      expectedOutput: "<h1>Hello World</h1>\n<h2>My Profile</h2>",
      testCases: [
        {
          id: "tc-3-1",
          description: "يجب بإنشاء وسم الفتح `<h2>` ووسم الإغلاق `</h2>`.",
          testLogic: "return /<h2.*?>.*?<\\/h2>/gi.test(code);"
        },
        {
          id: "tc-3-2",
          description: "يجب أن يحتوي وسم `<h2>` على النص 'My Profile'.",
          testLogic: "return /<h2.*?>\\s*My Profile\\s*<\\/h2>/gi.test(code);"
        }
      ]
    },
    {
      id: "html-1-step-4",
      stepNumber: 4,
      title: "الخطوة الرابعة: الفقرات النصية",
      description: "تُستخدم وسوم الفقرات `p` لإنشاء فقرات من النصوص على صفحات الويب.",
      instructions: "أضف وسم `<p>` أسفل وسم `<h2>` واكتب بداخله `Welcome to my first webpage`.",
      seedCode: "<h1>Hello World</h1>\n<h2>My Profile</h2>\n",
      expectedOutput: "<h1>Hello World</h1>\n<h2>My Profile</h2>\n<p>Welcome to my first webpage</p>",
      testCases: [
        {
          id: "tc-4-1",
          description: "يجب إنشاء وسم فقرة `<p>`.",
          testLogic: "return /<p.*?>.*?<\\/p>/gi.test(code);"
        }
      ]
    },
    {
       id: "html-1-step-5",
       stepNumber: 5,
       title: "الخطوة الخامسة: الهيكل الرئيسي للويب",
       description: "في HTML5، لدينا وسوم تُساعد في تنظيم المحتوى لمتصفحات الويب وأدوات البحث. من أهمها وسم `main` الذي يحدد الجزء الأهم في الصفحة.",
       instructions: "أحط الوسمين المكونين من `<h2>` و `<p>` بوسم `<main>`. بمعنى أن يبدأ الـ `<main>` قبل الـ `<h2>` وينتهي بعد الـ `<p>`.",
       seedCode: "<h1>Hello World</h1>\n<h2>My Profile</h2>\n<p>Welcome to my first webpage</p>",
       expectedOutput: "<h1>Hello World</h1>\n<main>\n  <h2>My Profile</h2>\n  <p>Welcome to my first webpage</p>\n</main>",
       testCases: [
         {
           id: "tc-5-1",
           description: "يجب توفر وسم `<main>` في الكود.",
           testLogic: "return /<main.*?>.*?<\\/main>/gs.test(code);"
         }
       ]
    }
  ],
  "html-2": [
    {
      id: "html-2-step-1",
      stepNumber: 1,
      title: "الخطوة الأولى: القوائم غير المرتبة",
      description: "في هذا المشروع، سنقوم ببناء قائمة طعام لمقهى. في HTML يمكننا تجميع العناصر في قوائم. القائمة غير المرتبة (Unordered List) تُستخدم حين لا يكون ترتيب العناصر مهماً وتُكتب بعبارة `<ul>`.",
      instructions: "قم بإنشاء وسم `<ul>` تحت عنوان المقهى.",
      seedCode: "<h1>Cafe Menu</h1>\n<h2>Drinks</h2>\n",
      expectedOutput: "<h1>Cafe Menu</h1>\n<h2>Drinks</h2>\n<ul>\n</ul>",
      testCases: [
        {
          id: "tc-1-1",
          description: "يجب إضافة وسم `<ul>` و إغلاقه `</ul>`.",
          testLogic: "return /<ul.*?>.*?<\\/ul>/gs.test(code);"
        }
      ]
    },
    {
      id: "html-2-step-2",
      stepNumber: 2,
      title: "الخطوة الثانية: عناصر القائمة",
      description: "لكي نضع عناصر داخل القائمة التي أنشأناها `<ul>`، نستخدم وسم عنصر القائمة (List Item) والذي يُكتب `<li>`.",
      instructions: "أضف عنصرين `<li>` داخل وسم `<ul>`. اكتب في الأول `Coffee` وفي الثاني `Tea`.",
      seedCode: "<h1>Cafe Menu</h1>\n<h2>Drinks</h2>\n<ul>\n\n</ul>",
      expectedOutput: "<h1>Cafe Menu</h1>\n<h2>Drinks</h2>\n<ul>\n  <li>Coffee</li>\n  <li>Tea</li>\n</ul>",
      testCases: [
        {
          id: "tc-2-1",
          description: "يجب إضافة وسوم `<li>` داخل الـ `<ul>`.",
          testLogic: "return /<ul.*?>[\\s\\S]*?<li.*?>.*?<\\/li>[\\s\\S]*?<\\/ul>/gi.test(code);"
        },
        {
          id: "tc-2-2",
          description: "يجب أن تحتوي العناصر على 'Coffee' و 'Tea'.",
          testLogic: "return /<li.*?>\\s*Coffee\\s*<\\/li>/gi.test(code) && /<li.*?>\\s*Tea\\s*<\\/li>/gi.test(code);"
        }
      ]
    },
    {
       id: "html-2-step-3",
       stepNumber: 3,
       title: "الخطوة الثالثة: إضافة الصور",
       description: "لكي يبدو المقهى جميلاً، نحتاج إلى صور! يُستخدم وسم `img` لعرض صورة. هذا الوسم ذاتي الإغلاق ويحتاج لسمة تسمى `src` ليعرف المتصفح رابط الصورة.",
       instructions: "أضف وسم `img` أسفل عنوان الـ `<h1>` واستخدم السمة `src` لتشير إلى `cat.jpg`.",
       seedCode: "<h1>Cafe Menu</h1>\n<h2>Drinks</h2>\n<ul>\n  <li>Coffee</li>\n  <li>Tea</li>\n</ul>",
       expectedOutput: "<h1>Cafe Menu</h1>\n<img src=\"cat.jpg\">\n<h2>Drinks</h2>\n<ul>\n  <li>Coffee</li>\n  <li>Tea</li>\n</ul>",
       testCases: [
         {
           id: "tc-3-1",
           description: "يجب إضافة صورة `img` برابط `src` الصحيح.",
           testLogic: "return /<img\\s+[^>]*src\\s*=\\s*['\"]cat\\.jpg['\"][^>]*>/gi.test(code);"
         }
       ]
    },
    {
       id: "html-2-step-4",
       stepNumber: 4,
       title: "الخطوة الرابعة: النصوص البديلة للصور",
       description: "لجعل مواقعنا متاحة لذوي الاحتياجات الخاصة (كالمكفوفين)، ولأغراض محركات البحث، نستخدم سمة `alt` في الصورة لوصف ما تحتويه.",
       instructions: "قم بإضافة السمة `alt` داخل وسم الصورة `img` واجعل قيمتها `A picture of a cat`.",
       seedCode: "<h1>Cafe Menu</h1>\n<img src=\"cat.jpg\">\n<h2>Drinks</h2>\n<ul>\n  <li>Coffee</li>\n  <li>Tea</li>\n</ul>",
       expectedOutput: "<h1>Cafe Menu</h1>\n<img src=\"cat.jpg\" alt=\"A picture of a cat\">\n<h2>Drinks</h2>\n<ul>\n  <li>Coffee</li>\n  <li>Tea</li>\n</ul>",
       testCases: [
         {
           id: "tc-4-1",
           description: "يجب إضافة السمة `alt` بقيمة صحيحة.",
           testLogic: "return /<img\\s+[^>]*alt\\s*=\\s*['\"]A picture of a cat['\"][^>]*>/gi.test(code);"
         }
       ]
    },
    {
      id: "html-2-step-5",
      stepNumber: 5,
      title: "الخطوة الخامسة: الروابط الحية",
      description: "الإنترنت مبني على تنقلنا بين الصفحات بواسطة \"الروابط\" (Links). يُستخدم وسم `a` (Anchor) لإنشاء هذه الروابط مع سمة `href`.",
      instructions: "أضف وسم `a` تحت القائمة واجعل `href` يشير لـ `https://freecatphotoapp.com` واكتب النص `Visit our website`.",
      seedCode: "<h1>Cafe Menu</h1>\n<img src=\"cat.jpg\" alt=\"A picture of a cat\">\n<h2>Drinks</h2>\n<ul>\n  <li>Coffee</li>\n  <li>Tea</li>\n</ul>\n",
      expectedOutput: "<h1>Cafe Menu</h1>\n<img src=\"cat.jpg\" alt=\"A picture of a cat\">\n<h2>Drinks</h2>\n<ul>\n  <li>Coffee</li>\n  <li>Tea</li>\n</ul>\n<a href=\"https://freecatphotoapp.com\">Visit our website</a>",
      testCases: [
        {
          id: "tc-5-1",
          description: "يجب إضافة وسم الرابط مع السمة href والنص.",
          testLogic: "return /<a\\s+[^>]*href\\s*=\\s*['\"]https:\\/\\/freecatphotoapp\\.com['\"][^>]*>\\s*Visit our website\\s*<\\/a>/gi.test(code);"
        }
      ]
    },
    {
       id: "html-2-step-6",
       stepNumber: 6,
       title: "الخطوة السادسة: أمان الروابط الخارجية",
       description: "حين نجعل رابطاً يفتح في نافذة جديدة، من الممارسات الآمنة والجيدة أن نخبر المتصفح بذلك باستخدام سمة `target=\"_blank\"`.",
       instructions: "أضف السمة `target` بالقيمة `_blank` لوسم الـ `a` الخاص بك.",
       seedCode: "<h1>Cafe Menu</h1>\n<img src=\"cat.jpg\" alt=\"A picture of a cat\">\n<h2>Drinks</h2>\n<ul>\n  <li>Coffee</li>\n  <li>Tea</li>\n</ul>\n<a href=\"https://freecatphotoapp.com\">Visit our website</a>",
       expectedOutput: "<h1>Cafe Menu</h1>\n<img src=\"cat.jpg\" alt=\"A picture of a cat\">\n<h2>Drinks</h2>\n<ul>\n  <li>Coffee</li>\n  <li>Tea</li>\n</ul>\n<a href=\"https://freecatphotoapp.com\" target=\"_blank\">Visit our website</a>",
       testCases: [
         {
           id: "tc-6-1",
           description: "يجب أن يحتوي الرابط على target=\"_blank\".",
           testLogic: "return /<a\\s+[^>]*target\\s*=\\s*['\"]_blank['\"][^>]*>/gi.test(code);"
         }
       ]
    }
  ],
  "html-3": [
     {
        id: "html-3-step-1",
        stepNumber: 1,
        title: "نماذج التفاعل",
        description: "سنبدأ بإنشاء نموذج تسجيل لتجميع بيانات زوار الموقع. يُستخدم وسم `<form>` لاحتواء كل حقول الإدخال المتعلقة بالتسجيل.",
        instructions: "أضف وسم `<form>` أسفل الـ `<h2>`.",
        seedCode: "<h2>Registration Form</h2>\n",
        expectedOutput: "<h2>Registration Form</h2>\n<form>\n</form>",
        testCases: [
          {
            id: "tc-3-1",
            description: "يجب أن تضيف وسم `<form>` صالح.",
            testLogic: "return /<form.*?>[\\s\\S]*?<\\/form>/gi.test(code);"
          }
        ]
     },
     {
       id: "html-3-step-2",
       stepNumber: 2,
       title: "نموذج التسجيل مكتمل",
       description: "لنختصر الطريق قليلاً هنا في هذا المثال، ستحتاج إلى إضافة مجموعة من المدخلات.",
       instructions: "الرجاء تجاوز هذه الخطوة. المشروع الثالث، الرابع، والخامس ستتم إضافتهم لاحقاً بشكل مفصّل. أضف الكود `<input type=\"text\">` للنجاح.",
       seedCode: "<h2>Registration Form</h2>\n<form>\n  \n</form>",
       expectedOutput: "<h2>Registration Form</h2>\n<form>\n  <input type=\"text\">\n</form>",
       testCases: [
          {
            id: "tc-3-2",
            description: "إضافة input",
            testLogic: "return /<input.*?>/gi.test(code);"
          }
       ]
     }
  ],
  "html-4": [
     {
        id: "html-4-step-1",
        stepNumber: 1,
        title: "قريباً",
        description: "هذا المشروع سيتم فتحه لاحقاً.",
        instructions: "اضغط على التحقق من الكود مباشرة.",
        seedCode: "<!-- قريبًا -->",
        expectedOutput: "<!-- قريبًا -->",
        testCases: [ { id: "tc-4", description: "نجاح 자동", testLogic: "return true;" } ]
     }
  ],
  "html-5": [
     {
        id: "html-5-step-1",
        stepNumber: 1,
        title: "قريباً",
        description: "هذا المشروع سيتم فتحه لاحقاً.",
        instructions: "اضغط على التحقق من الكود مباشرة.",
        seedCode: "<!-- قريبًا -->",
        expectedOutput: "<!-- قريبًا -->",
        testCases: [ { id: "tc-5", description: "نجاح 자동", testLogic: "return true;" } ]
     }
  ]
};
