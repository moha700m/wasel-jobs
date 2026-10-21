# تفعيل «ربط Gmail بضغطة» في واصل

الكود جاهز ويحتاج بس مفتاحين من Google: `GOOGLE_CLIENT_ID` و`GOOGLE_CLIENT_SECRET`. الخطوات تاخذ قرابة ١٠ دقائق.

## ١) أنشئ مشروع
1. افتح https://console.cloud.google.com وسجّل دخول بحسابك.
2. من أعلى الصفحة اضغط اختيار المشروع ← **New Project**، وسمّه `Wasel` ← **Create**.

## ٢) فعّل Gmail API
1. القائمة ← **APIs & Services ← Library**.
2. ابحث عن **Gmail API** ← **Enable**.

## ٣) شاشة الموافقة (OAuth consent screen / Google Auth Platform)
1. **APIs & Services ← OAuth consent screen** (أو **Google Auth Platform ← Branding**) ← **Get started**.
2. App name: `واصل Wasel`، والـ User support email إيميلك.
3. Audience: **External**.
4. Contact email: إيميلك ← وافق ← **Create**.
5. في **Branding** حط:
   - Home page: `https://wasel-jobs.onrender.com`
   - Privacy policy: `https://wasel-jobs.onrender.com/privacy`
   - Terms: `https://wasel-jobs.onrender.com/terms`
   - Authorized domains: `onrender.com` (أو دومينك إذا ربطت دومين).
6. **Data Access ← Add or remove scopes**: أضف `https://www.googleapis.com/auth/gmail.send` و`openid` و`email` ← **Update ← Save**.
7. **Audience ← Test users ← Add users**: أضف إيميلات Gmail اللي بتجرب فيها، بحد أقصى ١٠٠ وأنت في وضع Testing.

## ٤) أنشئ مفاتيح OAuth
1. **APIs & Services ← Credentials ← Create Credentials ← OAuth client ID** (أو **Google Auth Platform ← Clients ← Create client**).
2. Application type: **Web application**، والاسم `Wasel Web`.
3. **Authorized redirect URIs ← Add URI** والصق هذا حرفياً:
   ```
   https://wasel-jobs.onrender.com/api/mail/google/callback
   ```
4. **Create**، وانسخ الـ Client ID والـ Client secret. لا ترسلها في أي محادثة.

## ٥) حطها في Render
1. https://dashboard.render.com ← خدمة **wasel-jobs** ← **Environment**.
2. أضف `GOOGLE_CLIENT_ID` و`GOOGLE_CLIENT_SECRET` ← **Save, rebuild and deploy**.
3. بعد دقيقتين يصير زر «ربط Gmail بضغطة» شغّال.

## ٦) جرّب
سجّل بإيميل من الـ Test users ← الإعدادات ← «ربط Gmail بضغطة» ← وافق. إذا طلعت لك «Google hasn't verified this app» اضغط **Continue**، وهذا طبيعي في وضع Testing.

## ٧) للإطلاق العام
- صلاحية `gmail.send` حساسة (sensitive). عشان يستخدمها أي أحد بدون قائمة Test users، لازم **Publish app** ثم طلب **Verification** من Google. يطلبون فيديو يشرح الاستخدام، وصفحة خصوصية، ودومين موثّق في Search Console، والمراجعة تاخذ من أيام إلى أسابيع.
- ينصح بدومين خاص بدل onrender.com. إذا غيرته حدّث الـ redirect URI ومتغير `BASE_URL`.

## أمان
- التطبيق يطلب صلاحية الإرسال فقط، وما يقرأ الإيميلات.
- الـ refresh token يتخزن مشفر بـ AES-256-GCM، وما ينطبع في أي سجل.
- المستخدم يقدر يفصل الربط من الإعدادات، أو من https://myaccount.google.com/permissions
