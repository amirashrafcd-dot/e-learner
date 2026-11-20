/*
  e-Learner — ملف إدارة المحتوى
  لإضافة مصدر: انسخ عنصراً داخل resources للمادة المناسبة وعدّل بياناته.
  type: book | summary | exam | worksheet
  driveUrl: رابط مشاركة Google Drive مضبوط على "أي شخص لديه الرابط — مشاهد"
*/
window.EL_CONFIG = {
  platformName: "e-Learner",
  country: "فلسطين",
  supervisor: "Gaza Galaxy",
  founder: "أمير الرياشي",
  contactEmail: "gaza.galaxy.edu@gmail.com",
  teacherMessage: "مرحباً، أرغب بالمساهمة بمحتوى تعليمي في منصة e-Learner التابعة لـ Gaza Galaxy.",
  branches: {
    scientific: {
      name: "العلمي", title: "الفرع العلمي", description: "مصادرك في الرياضيات والعلوم والمواد الأساسية، منظمة لتصل إليها بسهولة.", symbol: "∑",
      subjects: {
        "اللغة العربية": [], "اللغة الإنجليزية": [], "التربية الإسلامية": [], "الرياضيات": [],
        "الفيزياء": [], "الكيمياء": [], "الأحياء": [], "تكنولوجيا المعلومات": []
      }
    },
    literary: {
      name: "الأدبي", title: "الفرع الأدبي", description: "مكتبة متكاملة لمواد الفرع الأدبي من الكتب والملازم إلى الاختبارات وأوراق العمل.", symbol: "文",
      subjects: {
        "اللغة العربية": [], "اللغة الإنجليزية": [], "التربية الإسلامية": [], "التاريخ": [],
        "الجغرافيا": [], "الثقافة العلمية": [], "تكنولوجيا المعلومات": []
      }
    }
  }
};

/*
مثال إضافة ملف داخل مصفوفة المادة:
"الرياضيات": [
  {
    id: "math-book-001",
    title: "كتاب الرياضيات — الجزء الأول",
    type: "book",
    teacher: "وزارة التربية والتعليم",
    term: "الأول",
    year: "2026",
    description: "الكتاب المدرسي للجزء الأول.",
    driveUrl: "https://drive.google.com/file/d/FILE_ID/view"
  },
  {
    id: "math-exam-001",
    title: "اختبار تجريبي — الوحدة الأولى",
    type: "exam",
    teacher: "اسم المعلم",
    term: "الأول",
    year: "2026",
    description: "اختبار تدريبي مع أسئلة متنوعة.",
    driveUrl: "https://drive.google.com/file/d/FILE_ID/view"
  }
]
*/