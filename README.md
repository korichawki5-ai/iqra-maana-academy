# اقرأ معنا — موقع دروس الدعم

موقع عربي جاهز للنشر على Netlify، مع Supabase لقاعدة البيانات، تسجيل دخول الإدارة، وطلبات التسجيل الآمنة.

## إعداد المشروع (مرة واحدة)
1. أنشئ مشروعاً في **Supabase**.
2. من SQL Editor الصق وشغّل محتوى `supabase/schema.sql`.
3. من **Authentication > Users** أنشئ مستخدم الإدارة (بريد + كلمة مرور قوية).
4. في SQL Editor نفّذ سطر `insert into public.profiles...` الموجود في نهاية ملف SQL، مع وضع بريد المدير.
5. انسخ Project URL و`anon public key` من Supabase > Settings > API إلى `config.js`.
6. ارفع المشروع إلى GitHub ثم اربطه بـ **Netlify**.
7. في Netlify > Site configuration > Environment variables أضف:
   - `SUPABASE_URL`: رابط مشروع Supabase
   - `SUPABASE_SERVICE_ROLE_KEY`: مفتاح service_role من Supabase (سري جداً؛ لا تضعه في config.js أو GitHub).

## روابط الموقع
- الواجهة العامة: `/`
- الإدارة: `/admin`

## ملاحظات أمان أساسية
- لا تشارك `SUPABASE_SERVICE_ROLE_KEY` إطلاقاً ولا تضعه في أي ملف ظاهر للموقع.
- `config.js` يحتوي فقط public anon key ويحتاج RLS الموجود في SQL للحماية.
- طلب التسجيل يمر عبر Netlify Function، لذلك لا يستطيع الزائر قراءة طلبات الآخرين.
- عدّل رقم الهاتف ورابط واتساب الوهميين في `index.html` قبل النشر.
- يفضّل تفعيل حماية CAPTCHA/Turnstile بعد أول نشر لتقليل الرسائل المزعجة.

## تعديل الشكل أو المحتوى
- بيانات المركز ورقم الهاتف: `index.html`
- الألوان والتصميم: `style.css`
- بيانات الدروس الحقيقية: من لوحة الإدارة بعد الإعداد.
