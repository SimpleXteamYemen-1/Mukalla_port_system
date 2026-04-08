import { useState, FormEvent } from 'react';
import { Eye, EyeOff, Mail, Lock, Globe, Anchor } from 'lucide-react';
import { Language, User } from '../App';
import { translations } from '../utils/translations';
import api from '../services/api';

interface LoginPageProps {
  language: Language;
  onToggleLanguage: () => void;
  onLogin: (user: User) => void;
  onNavigateToRegister: () => void;
}

export function LoginPage({ language, onToggleLanguage, onLogin, onNavigateToRegister }: LoginPageProps) {
  const t = translations[language].login;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; general?: string } = {};

    if (!email) {
      newErrors.email = t.errors.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t.errors.emailInvalid;
    }

    if (!password) {
      newErrors.password = t.errors.passwordRequired;
    } else if (password.length < 6) {
      newErrors.password = t.errors.passwordTooShort;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await api.post('/login', {
        email,
        password,
      });

      const { access_token, user } = response.data;

      // Save token
      localStorage.setItem('token', access_token);

      // Update app state
      onLogin(user);
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.response && error.response.status === 403) {
        const { status, rejection_reason, message } = error.response.data;
        
        if (status === 'pending') {
          setErrors({ general: t.errors.pending || 'Your account is still under review.' });
        } else if (status === 'rejected') {
          const reason = rejection_reason ? ` ${rejection_reason}` : '';
          setErrors({ general: (t.errors.rejected || 'Account rejected:') + reason });
        } else {
          setErrors({ general: message || t.errors.general });
        }
      } else if (error.response && error.response.data && error.response.data.message) {
        setErrors({ general: error.response.data.message });
      } else if (error.response && error.response.data && error.response.data.errors) {
        // Handle validation errors if any
        setErrors({ general: Object.values(error.response.data.errors).flat().join(', ') });
      } else {
        setErrors({ general: t.errors.general || 'An error occurred during login.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = email && password && password.length >= 6;

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-[var(--bg-primary)]">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[var(--primary)]/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[var(--accent)]/20 rounded-full blur-[100px] animate-pulse delay-700"></div>
      </div>

      {/* Language Toggle */}
      <button
        onClick={onToggleLanguage}
        className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-[var(--surface)] hover:bg-[var(--secondary)]/10 backdrop-blur-md border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-primary)] rounded-xl transition-all shadow-lg z-20 group"
      >
        <Globe className="w-4 h-4 group-hover:text-[var(--primary)] transition-colors" />
        <span className="font-bold text-sm">{language === 'ar' ? 'English' : 'العربية'}</span>
      </button>

      {/* Login Card */}
      <div className="relative w-full max-w-md z-10 animate-in fade-in zoom-in duration-500">
        <div className="glass-panel p-8 md:p-10 relative overflow-hidden">

          {/* Decorative Corner Glow */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-[var(--primary)]/30 blur-2xl rounded-full"></div>

          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-[var(--primary)] blur-xl opacity-20 rounded-full"></div>
              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white rounded-2xl shadow-lg transform rotate-3 hover:rotate-6 transition-transform duration-300">
                <Anchor className="w-10 h-10" />
              </div>
            </div>

            <h1 className="text-3xl font-black text-[var(--text-primary)] mb-2 tracking-tight">
              {t.title}
            </h1>
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="h-1 w-12 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent rounded-full"></div>
            </div>
            <p className="text-[var(--text-secondary)] font-medium">
              {t.subtitle}
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="group">
              <label className="block text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                {t.email}
              </label>
              <div className="relative transition-all duration-300 transform group-focus-within:-translate-y-1">
                <div className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors`}>
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full ${language === 'ar' ? 'pr-12 text-right' : 'pl-12'} py-4 bg-[var(--bg-primary)]/50 border ${errors.email ? 'border-red-500' : 'border-[var(--border)]'} rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)]/30 focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 transition-all font-medium shadow-inner`}
                  placeholder={t.emailPlaceholder}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs font-bold mt-1 ml-1 animate-in slide-in-from-top-1">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="group">
              <label className="block text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                {t.password}
              </label>
              <div className="relative transition-all duration-300 transform group-focus-within:-translate-y-1">
                <div className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors`}>
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full ${language === 'ar' ? 'pr-12 pl-12 text-right' : 'pl-12 pr-12'} py-4 bg-[var(--bg-primary)]/50 border ${errors.password ? 'border-red-500' : 'border-[var(--border)]'} rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)]/30 focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 transition-all font-medium shadow-inner`}
                  placeholder={t.passwordPlaceholder}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute ${language === 'ar' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs font-bold mt-1 ml-1 animate-in slide-in-from-top-1">{errors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 rounded border-2 border-[var(--secondary)] peer-checked:bg-[var(--primary)] peer-checked:border-[var(--primary)] transition-all"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                </div>
                <span className="text-[var(--text-secondary)] font-medium text-sm group-hover:text-[var(--text-primary)] transition-colors">{t.rememberMe}</span>
              </label>
              <button
                type="button"
                className="text-[var(--primary)] hover:text-[var(--accent)] text-sm font-bold transition-colors hover:underline"
              >
                {t.forgotPassword}
              </button>
            </div>

            {/* Error Message */}
            {errors.general && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 animate-in shake">
                <div className="p-1 bg-red-500/20 rounded-full">
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <p className="text-red-500 text-sm font-medium">{errors.general}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="w-full py-4 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] hover:from-[var(--accent)] hover:to-[var(--primary)] disabled:from-[var(--secondary)] disabled:to-[var(--secondary)] disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>{t.loggingIn}</span>
                </>
              ) : (
                <>
                  {t.loginButton}
                  <svg className={`w-5 h-5 transition-transform duration-300 ${isFormValid ? 'translate-x-1 group-hover:translate-x-2' : ''} ${language === 'ar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-8 text-center pt-6 border-t border-[var(--border)]">
            <p className="text-[var(--text-secondary)] text-sm font-medium">
              {t.noAccount}{' '}
              <button
                onClick={onNavigateToRegister}
                className="text-[var(--primary)] font-bold hover:text-[var(--accent)] ml-1 transition-colors relative group"
              >
                {t.createAccount}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--primary)] transition-all group-hover:w-full"></span>
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[var(--text-secondary)]/50 text-xs font-bold uppercase tracking-widest">
            {t.footer}
          </p>
        </div>
      </div>
    </div>
  );
}
