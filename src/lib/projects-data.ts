export type Category = 'html' | 'css' | 'javascript';

export interface Project {
  id: string;
  number: number;
  title: string;
  description: string;
  status: 'locked' | 'completed' | 'in-progress';
  completedSteps: number;
  totalSteps: number;
  xpReward: number;
  estimatedTime: string;
}

export const allProjects: Record<Category, Project[]> = {
  html: [
    {
      id: "html-1",
      number: 1,
      title: "الصفحة الترحيبية",
      description: "تعلم أساسيات هيكل الويب والعناوين لإنشاء صفحتك الأولى.",
      status: "in-progress",
      completedSteps: 0,
      totalSteps: 5,
      xpReward: 100,
      estimatedTime: "15 دقيقة"
    },
    {
      id: "html-2",
      number: 2,
      title: "قائمة طعام المقهى",
      description: "تعلم كيفية هيكلة القوائم وإضافة الصور والروابط.",
      status: "locked",
      completedSteps: 0,
      totalSteps: 6,
      xpReward: 150,
      estimatedTime: "25 دقيقة"
    },
    {
      id: "html-3",
      number: 3,
      title: "نموذج التسجيل",
      description: "الموقع التفاعلي يبدأ من هنا! تفاعل مع المستخدمين باستخدام حقول الإدخال.",
      status: "locked",
      completedSteps: 0,
      totalSteps: 8,
      xpReward: 200,
      estimatedTime: "40 دقيقة"
    },
    {
      id: "html-4",
      number: 4,
      title: "الوسائط المتعددة وجداول البيانات",
      description: "أضف أبعاداً أخرى لصفحتك بالصوت، الفيديو وجداول البيانات.",
      status: "locked",
      completedSteps: 0,
      totalSteps: 5,
      xpReward: 250,
      estimatedTime: "30 دقيقة"
    },
    {
      id: "html-5",
      number: 5,
      title: "صفحة هبوط احترافية",
      description: "اجمع كل ما تعلمته لبناء هيكل صفحة هبوط شامل بنظافة وترتيب لتكون جاهزة للتصميم.",
      status: "locked",
      completedSteps: 0,
      totalSteps: 7,
      xpReward: 500,
      estimatedTime: "45 دقيقة"
    }
  ],
  css: [
    {
      id: "css-1",
      number: 1,
      title: "أساسيات الألوان والخطوط",
      description: "إضافة الروح والجمال لهياكل الـ HTML",
      status: "locked",
      completedSteps: 0,
      totalSteps: 15,
      xpReward: 800,
      estimatedTime: "90 دقيقة"
    }
  ],
  javascript: [
    {
      id: "js-1",
      number: 1,
      title: "مقدمة في البرمجة التفاعلية",
      description: "تحويل الصفحات الجامدة إلى واجهات حية",
      status: "locked",
      completedSteps: 0,
      totalSteps: 20,
      xpReward: 1200,
      estimatedTime: "120 دقيقة"
    }
  ]
};

export function getCategoryProgress(category: Category) {
  const projects = allProjects[category];
  const total = projects.length;
  const completed = projects.filter(p => p.status === 'completed').length;
  const xpEarned = projects.reduce((acc, p) => p.status === 'completed' ? acc + p.xpReward : acc, 0);
  const totalXp = projects.reduce((acc, p) => acc + p.xpReward, 0);
  const percentage = total > 0 ? ((completed) / total) * 100 : 0;

  return {
    total,
    completed,
    xpEarned,
    totalXp,
    percentage
  };
}
