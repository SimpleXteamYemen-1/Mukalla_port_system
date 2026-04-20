<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>استعادة كلمة المرور - MUKALLA PORT</title>
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
    <script src="https://cdn.tailwindcss.com"></script>
    {{-- @vite(['resources/css/app.css', 'resources/js/app.js']) --}}
</head>
<body class="bg-[#0f172a] text-[#ededec] flex items-center justify-center min-h-screen p-6 overflow-hidden">

    <div class="absolute top-6 right-6 z-50">
        <button id="langSwitcher" class="flex items-center gap-2 bg-[#1e293b]/50 backdrop-blur-md text-white px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10 transition-all shadow-xl">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
            <span id="langText" class="text-sm font-medium">English</span>
        </button>
    </div>

    <main class="flex max-w-5xl w-full shadow-2xl rounded-2xl overflow-hidden border border-[#1e293b] min-h-[550px]">
        
        <div class="hidden lg:flex flex-1 bg-[#1e293b]/40 backdrop-blur-lg p-12 flex-col items-center justify-center text-center border-l border-[#1e293b]">
    
         <div class="p-6 bg-white/5 backdrop-blur-xl rounded-2xl mb-8 border border-white/10 shadow-2xl transition-all duration-500">
               <img src="{{ asset('logo (2).png') }}" class="w-28 h-28 object-contain" alt="Logo">
         </div>
            <h2 class="text-4xl font-black tracking-tighter mb-4 text-white">MUKALLA PORT</h2>
          <div class="h-[2px] w-12 bg-white mb-6 mx-auto opacity-80 shadow-[0_0_8px_rgba(255,255,255,0.5)]"></div>
            <p id="portDesc" class="text-xl text-gray-400 leading-relaxed max-w-xs font-medium">نظام إدارة الموانئ البحرية الذكي والمتكامل</p>
        </div>

        <div class="flex-1 bg-[#161d31] p-10 lg:p-16 flex flex-col justify-center relative">
            <div class="mb-10">
                <h1 id="formTitle" class="text-3xl font-bold mb-3 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">نسيت كلمة المرور؟</h1>
                <p id="formSubtitle" class="text-gray-400 text-sm leading-relaxed">لا تقلق، أدخل بريدك وسنرسل لك رابط الاستعادة.</p>
            </div>

            @if (session('status'))
                <div class="p-4 mb-6 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl text-xs flex items-center gap-2">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                    {{ session('status') }}
                </div>
            @endif

            <form method="POST" action="{{ route('password.email') }}" class="space-y-6">
                @csrf
                <div class="space-y-2">
                    <label id="labelEmail" class="block text-[11px] font-bold text-gray-500 uppercase tracking-[2px] ml-1">البريد الإلكتروني</label>
                    <div class="flex items-center border border-[#334155] rounded-xl bg-[#0f172a]/50 p-1 focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all duration-300">
                        <div class="p-3 text-gray-500">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L22 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        </div>
                        <input type="email" name="email" required class="bg-transparent border-none text-white w-full focus:ring-0 text-sm py-3" placeholder="example@port.com">
                    </div>
                    @error('email')
                        <p class="text-red-400 text-[11px] font-bold mt-2 flex items-center gap-1 italic"><span class="not-italic">⚠️</span> {{ $message }}</p>
                    @enderror
                </div>

                <button type="submit" id="submitBtn" class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-xl font-bold shadow-2xl shadow-blue-900/20 transition-all transform hover:-translate-y-1 active:scale-[0.98]">
                    إرسال الرابط ←
                </button>
            </form>

            <div class="mt-12 text-center">
                <a id="backBtn" href="http://localhost:3000" class="text-gray-500 hover:text-white text-xs font-bold transition-colors underline underline-offset-8 decoration-gray-700 hover:decoration-blue-500">العودة لتسجيل الدخول</a>
            </div>
        </div>
    </main>

    <script>
        const langBtn = document.getElementById('langSwitcher');
        const langText = document.getElementById('langText');
        let currentLang = 'ar';

        const translations = {
            ar: {
                title: "نسيت كلمة المرور؟",
                subtitle: "لا تقلق، أدخل بريدك وسنرسل لك رابط الاستعادة.",
                desc: "نظام إدارة الموانئ البحرية الذكي والمتكامل",
                labelEmail: "البريد الإلكتروني",
                button: "إرسال الرابط ←",
                back: "العودة لتسجيل الدخول",
                btnText: "English",
                dir: "rtl"
            },
            en: {
                title: "Forgot Password?",
                subtitle: "Don't worry, enter your email and we'll send a reset link.",
                desc: "Smart and Integrated Maritime Port Management System",
                labelEmail: "EMAIL ADDRESS",
                button: "Send Reset Link ←",
                back: "Back to Login",
                btnText: "العربية",
                dir: "ltr"
            }
        };

        langBtn.addEventListener('click', () => {
            currentLang = currentLang === 'ar' ? 'en' : 'ar';
            const t = translations[currentLang];
            
            document.documentElement.dir = t.dir;
            document.documentElement.lang = currentLang;
            langText.innerText = t.btnText;
            
            // تحديث نصوص الجانبين
            document.getElementById('formTitle').innerText = t.title;
            document.getElementById('formSubtitle').innerText = t.subtitle;
            document.getElementById('portDesc').innerText = t.desc;
            document.getElementById('labelEmail').innerText = t.labelEmail;
            document.getElementById('submitBtn').innerText = t.button;
            document.getElementById('backBtn').innerText = t.back;
        });
    </script>
</body>
</html>