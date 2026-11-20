# e-Learner Content API — Cloudflare Worker

تحدّث هذه الخدمة ملف `data.json` الموجود في جذر مستودع GitHub من خلال لوحة `control/`. يحتفظ Cloudflare Worker برمز GitHub وكلمة مرور الإدارة كـ Secrets؛ لا تضعهما في ملفات الواجهة.

## اسم الخدمة وملف الإعداد

اسم Worker المعتمد في `wrangler.toml` هو `e-learner`، لذلك يجب أن يطابق اسم الخدمة المنشورة. عنوان الخدمة الحالي المعرّف في `control/config.js` هو `https://e-learner.amir-ashraf-cd.workers.dev`.

- ملف الدخول: `src/index.js`
- مسار البيانات في GitHub: `data.json` في جذر المستودع
- مسار API: `/api/config`
- إصدار GitHub API: `2022-11-28`

## الإعداد

1. أنشئ Fine-grained Personal Access Token خاصاً بمستودع `amirashrafcd-dot/e-learner` مع صلاحية **Contents: Read and write** فقط.
2. انشر Worker من مجلد `worker/` باستخدام Wrangler أو إعدادات Cloudflare التي تستخدم `src/index.js` كملف دخول.
3. أضف القيم التالية في إعدادات Worker:
   - Secrets: `ADMIN_PASSWORD` كلمة مرور قوية وفريدة، و`GITHUB_TOKEN` الرمز.
   - Variables: `GITHUB_OWNER=amirashrafcd-dot`، `GITHUB_REPO=e-learner`، `GITHUB_BRANCH=main`، `ALLOWED_ORIGIN=https://amirashrafcd-dot.github.io`.
4. تأكد أن عنوان Worker المنشور هو العنوان الموجود في `control/config.js`. لا تضف كلمة المرور أو GitHub token إلى هذا الملف.
5. افتح `https://amirashrafcd-dot.github.io/e-learner/control/` وسجّل الدخول.

تستخدم الخدمة مقارنة ثابتة الطول عبر SHA-256 لكلمة المرور، وتتحقق من Origin، وتتحقق من أن البيانات JSON صالحة وأقل من 900KB وأن روابط المصادر HTTP أو HTTPS فقط.

## Rate Limiting — مهم

قواعد **WAF Custom Rules / Rate Limiting Rules** المرتبطة بالـ Zone تتطلب نطاقاً (Domain/Zone) مضافاً إلى حساب Cloudflare وتكون موجهة إلى ذلك النطاق. هذه القواعد لا تنطبق تلقائياً على عنوان `workers.dev` الافتراضي؛ لذلك لا تعتمد على إنشاء WAF rule على `workers.dev` لحماية هذا الـ API.

لديك خياران:

1. **نطاق خاص:** اربط Worker بنطاق أو نطاق فرعي تملكه ومضاف إلى Cloudflare، ثم أنشئ Rate Limiting Rule في منطقة ذلك النطاق لاستهداف المسار `/api/*`، واضبط الحد والفترة والإجراء بما يناسب استخدام لوحة الإدارة.
2. **Rate Limiting داخل Worker:** استخدم Cloudflare Workers Rate Limiting API/binding من داخل الكود، مع تعريف الـ binding في إعدادات Wrangler ثم استدعائه قبل تنفيذ عمليات API. راجع الوثائق الرسمية: [Workers Rate Limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).

**تنبيه دقة:** الخيار الثاني مدعوم كآلية على مستوى Workers، لكن لم أتحقق هنا من صياغة TOML الدقيقة المتوافقة مع كل إصدار Wrangler؛ اتبع مثال الإعداد الحالي في وثائق Cloudflare قبل إضافة binding. لا أريد إعطاءك مقطع إعداد قديم أو غير صالح.

## ملاحظات تشغيلية

- اللوحة تحفظ بيانات المصدر وروابط الملفات فقط، ولا ترفع ملفات PDF إلى Google Drive.
- إذا حدث تعديل متزامن على `data.json`، سيرفض Worker الحفظ المتعارض؛ أعد تحميل اللوحة ثم أعد المحاولة.
- إخفاء رابط `control/` ليس حماية. الحماية الأساسية هي كلمة المرور والتحقق داخل Worker، مع Rate Limiting كطبقة إضافية.
- لا تضع أي سر في ملفات JavaScript العامة.
