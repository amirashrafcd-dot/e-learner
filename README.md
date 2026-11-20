# e-Learner — منصة التوجيهي الفلسطيني

منصة عربية RTL لتنظيم مصادر التوجيهي الفلسطيني حسب الفرع والمادة. تعمل الواجهة كملفات ثابتة على GitHub Pages، وتحفظ لوحة الإدارة التعديلات في `data.json` عبر Cloudflare Worker.

## بنية الملفات

```text
index.html
branch.html
data.json
favicon.svg
assets/
  style.css
  app.js
  library.js
control/
  index.html
  config.js
  admin.js
  admin.css
worker/
  src/index.js
  wrangler.toml
  README.md
```

## البيانات

يُحمّل الموقع `data.json` باستخدام `fetch` ثم يحلله كـ JSON. البنية العليا:

- `site`: إعدادات المنصة، البريد، رقم واتساب، قناة تيليغرام، موعد الامتحان ورسالة المعلمين.
- `branches.scientific` و`branches.literary`: بيانات الفرعين.
- `branches.*.subjects[اسم المادة]`: مصفوفة مصادر مباشرة، وليست كائناً داخله مفتاح `resources`.

حقول المصدر المعتمدة: `id`، `title`، `type`، `grade`، `unit`، `teacher`، `term`، `year`، `description`، `url`، `mirrorUrl`، `added`، و`updated` عند التعديل. يدعم قارئ المكتبة `driveUrl` القديم كخيار احتياطي للرابط.

الأنواع: `book`، `summary`، `exam`، `worksheet`، `solution`، `pastExam`، `video`.

المواد الحالية محفوظة كما هي: العلمي (8 مواد) والأدبي (7 مواد). لا توجد مصادر مضافة في ملف البيانات الحالي؛ أضف روابط الملفات التي تملك حق مشاركتها من لوحة الإدارة.

## النشر على GitHub Pages

ارفع محتويات المشروع إلى جذر المستودع `e-learner`، واجعل مصدر GitHub Pages هو الفرع `main` والمجلد الجذر. استخدمت الملفات روابط نسبية حتى تعمل تحت مسار المستودع الفرعي.

الموقع: https://amirashrafcd-dot.github.io/e-learner/

## لوحة الإدارة والحفظ المباشر

- لوحة الإدارة: `control/index.html`.
- إعداد عنوان Worker: `control/config.js`، ولا يوضع فيه أي سر.
- Worker: `worker/src/index.js`.
- اسم Worker المعتمد في `worker/wrangler.toml` هو `e-learner` (لا تغيّره دون تحديث عنوان الخدمة في `control/config.js`).
- أسرار `ADMIN_PASSWORD` و`GITHUB_TOKEN` تُضاف في Cloudflare Worker Secrets فقط.

راجع [worker/README.md](worker/README.md) لإعداد الربط وحدود WAF وRate Limiting.

## الترحيل من data.js إلى data.json

تم إنشاء `data.json` ببنية JSON المطلوبة مع المحافظة على أسماء المواد. كانت مصفوفات المصادر في ملف `data.js` القديم فارغة؛ لذلك لم تُفقد مصادر موجودة أثناء النقل.

إذا احتجت ترحيل نسخة قديمة تحتوي مصادر، انقل خصائص الإعدادات العامة إلى `site`، وانقل كائن `branches` كما هو، ثم لكل مصدر:
- انسخ `driveUrl` إلى `url` (يمكن ترك القديم مؤقتاً لأن القارئ يدعمه كـ fallback).
- أضف `grade` و`unit` و`mirrorUrl` عند توفر قيم فعلية، وإلا استخدم نصاً فارغاً.
- أضف `added` كتاريخ ISO حقيقي إن كان معروفاً؛ لا تخترع تاريخ إضافة للمصادر القديمة.

## ملاحظات

- المصادر روابط خارجية أو Google Drive؛ المنصة لا تستضيف ملفات PDF.
- اضبط مشاركة Drive على «أي شخص لديه الرابط — مشاهد» فقط للملفات المسموح بمشاركتها.
- لا تضع GitHub token أو كلمة مرور الإدارة في ملفات الواجهة.
- لم يتم إجراء اختبار شامل عبر كل المتصفحات بعد تحديث المستودع؛ اختبر تحميل البيانات وتسجيل الدخول والحفظ قبل مشاركة رابط الإدارة.


## الخط المحلي (Tajawal)

الواجهة تستخدم Tajawal محلياً ولا تعتمد على Google Fonts. ملفات WOFF2 لا تُحمّل من خادم خارجي؛ أضف الملفين التاليين يدوياً إلى مجلد `assets/fonts/`:

1. [تنزيل Tajawal Arabic 400 WOFF2](https://cdn.jsdelivr.net/npm/@fontsource/tajawal@5.3.0/files/tajawal-arabic-400-normal.woff2) واحفظه باسم `tajawal-arabic-400-normal.woff2`.
2. [تنزيل Tajawal Arabic 700 WOFF2](https://cdn.jsdelivr.net/npm/@fontsource/tajawal@5.3.0/files/tajawal-arabic-700-normal.woff2) واحفظه باسم `tajawal-arabic-700-normal.woff2`.

المسار النهائي للملفين:
- `assets/fonts/tajawal-arabic-400-normal.woff2`
- `assets/fonts/tajawal-arabic-700-normal.woff2`

بعد تنزيلهما، ارفع مجلد `assets/fonts/` إلى جذر المستودع مع بقية الملفات. ملف CSS يشير إليهما بمسارات نسبية. الخط مرخّص بموجب SIL Open Font License 1.1؛ احتفظ بنص الترخيص المرفق مع حزمة Fontsource عند إعادة التوزيع.
