# تفعيل «ربط Gmail بضغطة» في واصل (15 دقيقة)

الإيميلات تطلع من إيميل الباحث نفسه عبر Gmail API (HTTPS)، وهذا يشتغل على Render المجاني.

## 1) إنشاء المشروع
1. افتح https://console.cloud.google.com وسجّل دخول بحسابك.
2. من الأعلى: Select project ← New Project ← الاسم: `Wasel` ← Create.

## 2) تفعيل Gmail API
- APIs & Services ← Library ← ابحث `Gmail API` ← Enable.

## 3) شاشة الموافقة (OAuth consent screen / Google Auth Platform)
1. User type: **External** ← Create.
2. App name: `واصل Wasel`، وUser support email وDeveloper contact: إيميلك.
3. App domain (اختياري الحين):
   - Home: `https://wasel-jobs.onrender.com`
   - Privacy: `https://wasel-jobs.onrender.com/privacy.html`
   - Terms: `https://wasel-jobs.onrender.com/terms.html`
4. Scopes (Data Access) ← Add: `openid`، `.../auth/userinfo.email`، `https://www.googleapis.com/auth/gmail.send`.
5. **Test users (Audience) ← Add users**: أضف إيميلات Gmail اللي بتجرب (إيميلك وأصحابك، لين 100 شخص). هذول يقدرون يربطون فوراً بدون مراجعة قوقل.
   - تطلع لهم شاشة «Google hasn't verified this app» ← Continue. هذا طبيعي.
   - في وضع Testing صلاحية الربط تنتهي بعد 7 أيام، ويعيد المستخدم الربط.

## 4) إنشاء المفاتيح
1. APIs & Services ← Credentials ← Create credentials ← OAuth client ID.
2. Application type: **Web application**.
3. Authorized redirect URIs: `https://wasel-jobs.onrender.com/api/mail/google/callback` (لازم تكون مطابقة حرفياً).
4. Create ← انسخ Client ID و Client secret.

## 5) حطها في Render (لا ترسلها بالشات)
- Render ← خدمة `wasel-jobs` ← Environment ← أضف `GOOGLE_CLIENT_ID` و `GOOGLE_CLIENT_SECRET` ← Save (يعيد النشر تلقائياً).
- بعدها يظهر زر «ربط Gmail بضغطة» في الإعدادات.

## 6) للإطلاق للعامة (بعدين)
- `gmail.send` صلاحية حساسة (sensitive). اضغط Publish app ← Prepare for verification.
- قوقل تطلب: دومين موثّق باسمك، صفحة خصوصية على نفس الدومين، وفيديو يوضح استخدام الصلاحية.
- مدة المراجعة تقريباً من أيام إلى أسابيع. قبلها أضف المستخدمين كـ Test users.

---

# اختياري: ربط Outlook / Hotmail
1. https://entra.microsoft.com ← App registrations ← New registration.
2. Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**.
3. Redirect URI (Web): `https://wasel-jobs.onrender.com/api/mail/microsoft/callback`.
4. API permissions ← Microsoft Graph ← Delegated: `Mail.Send`، `User.Read`، `offline_access`، `openid`، `email`.
5. Certificates & secrets ← New client secret ← انسخ **Value**.
6. في Render أضف `MS_CLIENT_ID` (Application ID) و `MS_CLIENT_SECRET`.
- يشتغل فوراً لأي حساب Hotmail/Outlook (يوافق المستخدم بنفسه). حسابات بعض الشركات قد تحتاج موافقة الأدمن عندهم.
