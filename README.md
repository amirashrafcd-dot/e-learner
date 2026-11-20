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


## الصفحات المؤسسية والقانونية

أضيفت الصفحات الثابتة التالية:
- `about.html`: تعريف المنصة والجهة المشرفة.
- `copyright.html`: آلية استقبال طلبات حقوق النشر وإزالة الروابط.
- `privacy.html`: توضيح التخزين المحلي وأداة الإحصاءات عند تفعيلها.
- `terms.html`: شروط الاستخدام العامة.

هذه نصوص تشغيلية عامة وليست استشارة قانونية؛ ينبغي مراجعتها واعتمادها قانونياً قبل اعتبارها سياسة نهائية.

## إحصاءات الزيارات الاختيارية (Cloudflare Web Analytics)

الإحصاءات معطّلة افتراضياً. في `data.json` ستجد:

```json
"analytics": {
  "provider": "",
  "enabled": false,
  "siteToken": ""
}
```

للتفعيل:
1. افتح Cloudflare Dashboard ثم Web Analytics وأضف موقعك/اسم المضيف.
2. افتح Manage site وانسخ Site Token من المقتطف الذي توفره Cloudflare.
3. عدّل الحقول داخل `site.analytics` في `data.json` إلى `provider: "cloudflare"` و`enabled: true` وضع الرمز في `siteToken`.
4. ارفع `data.json` إلى GitHub وانتظر نشر الموقع. لا تضف المقتطف يدوياً إلى HTML؛ يقوم `assets/app.js` بتحميله فقط عند اكتمال هذه الشروط.

لإيقاف الإحصاءات، اجعل `enabled` تساوي `false` أو أفرغ `siteToken`. الرمز المخصص لوسم Web Analytics ليس كلمة مرور أو GitHub token؛ استخدم الرمز الذي أنشأته للمضيف الصحيح فقط. توضح وثائق Cloudflare أن المقتطف اليدوي يحمّل beacon من `static.cloudflareinsights.com` ويرسل بيانات القياس إلى Cloudflare. راجع [خطوات التفعيل الرسمية](https://developers.cloudflare.com/web-analytics/get-started/) و[شرح مصدر البيانات وجمعها](https://developers.cloudflare.com/web-analytics/data-metrics/data-origin-and-collection/).

## المرحلة الرابعة: PWA والعمل دون اتصال

- أضيف `manifest.webmanifest` و`service-worker.js` و`offline.html` وأيقونات SVG قابلة للتكبير.
- يسجّل الموقع Service Worker بمسار نسبي ونطاق `./` حتى يعمل تحت مسار GitHub Pages الفرعي `/e-learner/`.
- تُخزّن ملفات الواجهة الثابتة في Cache، ويُستخدم أسلوب stale-while-revalidate لملف `data.json`.
- لا يخزّن Service Worker أي طلبات لمسار `/api/` أو أي صفحة داخل `control/`.
- عند عدم توفر الشبكة، تظهر `offline.html` عند تعذّر فتح صفحة غير مخزنة.
- قد يحتاج المتصفح إلى زيارة الموقع مرة واحدة مع اتصال إنترنت قبل إمكان استخدام النسخة المخزنة دون اتصال. تحديثات الموقع تظهر بعد تحديث ذاكرة Service Worker.

## حاسبة معدل التوجيهي

أزيلت حاسبة المعدل الموزون واستُبدلت بحاسبة بحسب الفرع:
- العلمي: الرياضيات من 200، وبقية المواد المدرجة في `data.json` من 100.
- الأدبي: اللغة العربية واللغة الإنجليزية من 150 لكل منهما، وبقية المواد المدرجة من 100.
- تجمع الحاسبة علامات جميع مواد الفرع الموجودة في `data.json`، وتحسب النسبة من مجموع العلامات القصوى، وتعرض إن كانت علامة كل مادة تبلغ نصف علامتها القصوى.
- هذه حاسبة تقديرية وفق الأوزان المحددة في الواجهة، وليست احتساباً رسمياً من وزارة التربية والتعليم. إذا تغيرت مواد احتساب المعدل أو أوزانها رسمياً، يجب تحديث دالة `maxFor` في `assets/app.js`.

## SEO وملفات الموقع

- أضيفت وسوم وصف وOpen Graph وTwitter وcanonical للصفحات العامة.
- `sitemap.xml` يحتوي الصفحات العامة المعروفة، و`robots.txt` يمنع فهرسة `control/`.
- `404.html` صفحة خطأ متناسقة مع التصميم.
- أضيف JSON-LD من نوع `WebSite` و`EducationalOrganization` للصفحة الرئيسية.
- راجع عنوان الموقع في `sitemap.xml` ووسوم canonical إذا تغير اسم المستودع أو نطاق النشر.
