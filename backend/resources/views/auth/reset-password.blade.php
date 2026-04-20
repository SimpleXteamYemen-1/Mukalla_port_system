<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تعيين كلمة المرور - MUKALLA PORT</title>
    <script src="https://cdn.tailwindcss.com"></script>
    {{-- @vite(['resources/css/app.css', 'resources/js/app.js']) --}}
</head>
<body class="bg-[#0f172a] text-[#ededec] flex items-center justify-center min-h-screen p-6">

    <div class="absolute top-6 right-6 z-50">
        <button id="langSwitcher" class="bg-[#1e293b]/50 backdrop-blur-md text-white px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10 transition-all shadow-xl">
            <span id="langText" class="text-sm font-medium">English</span>
        </button>
    </div>

    <main class="flex max-w-5xl w-full shadow-2xl rounded-2xl overflow-hidden border border-[#1e293b] min-h-[600px]">
        <div class="hidden lg:flex flex-1 bg-[#1e293b]/40 backdrop-blur-lg p-12 flex-col items-center justify-center text-center border-l border-[#1e293b]">
            <div class="p-6 bg-white/5 backdrop-blur-xl rounded-2xl mb-8 border border-white/10">
                 <img src="{{ asset('logo (2).png') }}" class="w-28 h-28 object-contain" alt="Logo">
            </div>
            <h2 class="text-4xl font-black text-white mb-4">MUKALLA PORT</h2>
            <div class="h-[2px] w-12 bg-white mb-6 mx-auto opacity-80 shadow-[0_0_8px_rgba(255,255,255,0.5)]"></div>
            <p id="portDesc" class="text-xl text-gray-400 max-w-xs font-medium">نظام إدارة الموانئ البحرية الذكي والمتكامل</p>
        </div>

        <div class="flex-1 bg-[#161d31] p-10 lg:p-16 flex flex-col justify-center">
            <h1 id="resetTitle" class="text-3xl font-bold mb-3 text-white">تعيين كلمة مرور جديدة</h1>
            <p id="resetSubtitle" class="text-gray-400 text-sm mb-10">يرجى إدخال كلمة المرور الجديدة الخاصة بك لتأمين حسابك.</p>

            <form action="{{ route('password.update') }}" method="POST" class="space-y-5">
                @csrf
                <input type="hidden" name="token" value="{{ $token }}">

                <div class="space-y-2">
                    <label id="labelEmail" class="block text-xs font-bold text-gray-500 uppercase tracking-widest">البريد الإلكتروني</label>
                    <input type="email" name="email" required class="w-full bg-[#0f172a]/50 border border-[#334155] rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm text-white">
                </div>

                <div class="space-y-2">
                    <label id="labelPass" class="block text-xs font-bold text-gray-500 uppercase tracking-widest">كلمة المرور الجديدة</label>
                    <input type="password" name="password" required class="w-full bg-[#0f172a]/50 border border-[#334155] rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm text-white">
                </div>

                <div class="space-y-2">
                    <label id="labelConfirm" class="block text-xs font-bold text-gray-500 uppercase tracking-widest">تأكيد كلمة المرور</label>
                    <input type="password" name="password_confirmation" required class="w-full bg-[#0f172a]/50 border border-[#334155] rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm text-white">
                </div>

                <button id="updateBtn" type="submit" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-blue-900/30 transform hover:-translate-y-1">
                    تحديث كلمة المرور
                </button>
            </form>
        </div>
    </main>

    <script>
        const langBtn = document.getElementById('langSwitcher');
        const langText = document.getElementById('langText');
        let currentLang = 'ar';

        const translations = {
            ar: {
                title: "تعيين كلمة مرور جديدة",
                subtitle: "يرجى إدخال كلمة المرور الجديدة الخاصة بك لتأمين حسابك.",
                desc: "نظام إدارة الموانئ البحرية الذكي والمتكامل",
                email: "البريد الإلكتروني",
                pass: "كلمة المرور الجديدة",
                confirm: "تأكيد كلمة المرور",
                btn: "تحديث كلمة المرور",
                btnText: "English",
                dir: "rtl"
            },
            en: {
                title: "Reset Password",
                subtitle: "Please enter your new password to secure your account.",
                desc: "Smart and Integrated Maritime Port Management System",
                email: "Email Address",
                pass: "New Password",
                confirm: "Confirm Password",
                btn: "Update Password",
                btnText: "العربية",
                dir: "ltr"
            }
        };

        langBtn.addEventListener('click', () => {
            currentLang = currentLang === 'ar' ? 'en' : 'ar';
            const t = translations[currentLang];
            document.documentElement.dir = t.dir;
            langText.innerText = t.btnText;
            
            document.getElementById('resetTitle').innerText = t.title;
            document.getElementById('resetSubtitle').innerText = t.subtitle;
            document.getElementById('portDesc').innerText = t.desc;
            document.getElementById('labelEmail').innerText = t.email;
            document.getElementById('labelPass').innerText = t.pass;
            document.getElementById('labelConfirm').innerText = t.confirm;
            document.getElementById('updateBtn').innerText = t.btn;
        });
    </script>
</body>
</html>