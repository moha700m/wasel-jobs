# توثيق واصل عند قوقل (صلاحية gmail.send)

الهدف: نشيل حد الـ100 مستخدم تجريبي، ويصير أي أحد يقدر يربط Gmail بضغطة.

## ١) لازم دومين خاص (أهم شي)
- قوقل ما يقبل `onrender.com` لأنه مو ملكك. اشترِ دومين (مثلاً `wasel.sa` أو `waseljobs.com`، تقريباً ٣٠-٦٠ ريال بالسنة).
- اربطه بخدمة واصل في Render (Settings ← Custom Domains).
- وثّق ملكيته في [Google Search Console](https://search.google.com/search-console) بنفس حساب قوقل اللي فيه المشروع (سجل TXT في DNS).
- بعدها حدّث في Google Cloud رابط الـ redirect إلى `https://الدومين/api/mail/google/callback` والـ JavaScript origin للدومين الجديد.

## ٢) Branding (Google Auth Platform ← Branding)
| الحقل | القيمة |
|---|---|
| App name | واصل - Wasel |
| User support email | moha702m@gmail.com |
| App logo | شعار مربع 120×120 PNG (حرف «و» على خلفية خضراء) |
| Application home page | `https://الدومين/` |
| Privacy policy | `https://الدومين/privacy` |
| Terms of service | `https://الدومين/terms` |
| Authorized domains | الدومين الخاص |
| Developer contact | moha702m@gmail.com |

الصفحات موجودة الحين على: https://wasel-jobs.onrender.com/privacy و https://wasel-jobs.onrender.com/terms

## ٣) Data Access ← Add scope
أضف بس: `https://www.googleapis.com/auth/gmail.send` (وشيل أي صلاحية ثانية ما تحتاجها).

### نص التبرير (انسخه والصقه)
> Wasel is a job application assistant for job seekers in Saudi Arabia. Most Saudi employers receive applications by email. After the user uploads their CV and reviews each matched job, Wasel sends the application email (cover letter + CV attachment) from the user's own Gmail address to the employer's address, only for applications the user has explicitly approved. Sending from the user's own address is essential so employers can reply directly to the candidate. We use only the gmail.send scope; Wasel never reads, modifies or deletes the user's emails and does not access contacts. A narrower scope is not possible because sending on the user's behalf is the core feature. Users can disconnect at any time in Settings and delete all their data. Our use of Google user data complies with the Google API Services User Data Policy, including the Limited Use requirements.

## ٤) سكربت فيديو العرض (٢-٣ دقائق، يرفع على يوتيوب «غير مدرج» Unlisted)
الفيديو يكون بالإنجليزي أو فيه ترجمة إنجليزية، والمتصفح يبين شريط العنوان فيه الدومين.
1. (0:00) افتح الصفحة الرئيسية على الدومين، وقل: "This is Wasel, a job application assistant for Saudi Arabia."
2. (0:15) سجّل حساب جديد، واختر شاب/بنت، وارفع سيرة ذاتية.
3. (0:40) ادخل الإعدادات واضغط «ربط Gmail بضغطة». **لازم تبين شاشة موافقة قوقل كاملة** وفيها اسم التطبيق وصلاحية "Send email on your behalf"، وبعدها وافق.
4. (1:10) افتح وظيفة مطابقة، وبيّن رسالة التقديم، واضغط إرسال بنفسك (وضّح إن ما ينرسل شي بدون موافقة).
5. (1:40) افتح Gmail وبيّن الرسالة في «المرسل» (Sent)، وقل: "Wasel only sends; it never reads the inbox."
6. (2:00) بيّن زر قطع الربط وحذف الحساب، وافتح صفحة /privacy.

## ٥) Audience
- بعد ما تخلص كل شي اضغط **Publish app** (من Testing إلى In production)، وبعدها **Prepare for verification** وأرسل.

## ٦) المدة المتوقعة
- gmail.send تُعتبر صلاحية **حساسة (Sensitive)** مو مقيّدة، يعني **ما تحتاج تدقيق أمني CASA** المدفوع.
- مراجعة الـ Branding: ٢-٣ أيام عمل تقريباً.
- مراجعة الصلاحية: غالباً من أسبوع إلى ٤ أسابيع، وقد يرسلون إيميل يطلبون تعديل (رد عليهم بسرعة).
- خلال المراجعة يبقى الربط شغال للـ Test users فقط، و«كلمة مرور التطبيق» تشتغل للكل.
