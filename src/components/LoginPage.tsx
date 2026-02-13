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
      if (error.response && error.response.data && error.response.data.message) {
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
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-[var(--primary)]/5 blur-3xl"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-[var(--secondary)]/5 blur-3xl"></div>
      </div>

      {/* Language Toggle */}
      <button
        onClick={onToggleLanguage}
        className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-[var(--bg-primary)] rounded-md border border-[var(--secondary)] hover:border-[var(--accent)] transition-all text-[var(--text-primary)] z-10 shadow-sm"
      >
        <Globe className="w-4 h-4" />
        <span className="font-medium text-sm">{language === 'ar' ? 'English' : 'العربية'}</span>
      </button>

      {/* Login Card */}
      <div className="relative w-full max-w-md z-10">
        <div className="bg-[var(--bg-primary)] rounded-lg border border-[var(--secondary)] shadow-xl p-8 md:p-10">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl mb-4">
              <Anchor className="w-8 h-8" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-2">
              {t.title}
            </h1>
            <p className="text-[var(--text-secondary)] text-sm">
              {t.subtitle}
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-[var(--text-primary)] text-sm font-medium mb-2">
                {t.email}
              </label>
              <div className="relative">
                <div className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-[var(--text-secondary)]`}>
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full ${language === 'ar' ? 'pr-11 text-right' : 'pl-11'} py-3 bg-[var(--bg-primary)] border ${errors.email ? 'border-red-500' : 'border-[var(--secondary)]'} rounded-md text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all`}
                  placeholder={t.emailPlaceholder}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[var(--text-primary)] text-sm font-medium mb-2">
                {t.password}
              </label>
              <div className="relative">
                <div className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-[var(--text-secondary)]`}>
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full ${language === 'ar' ? 'pr-11 pl-11 text-right' : 'pl-11 pr-11'} py-3 bg-[var(--bg-primary)] border ${errors.password ? 'border-red-500' : 'border-[var(--secondary)]'} rounded-md text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all`}
                  placeholder={t.passwordPlaceholder}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute ${language === 'ar' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--secondary)] bg-[var(--bg-primary)] text-[var(--primary)] focus:ring-[var(--accent)] focus:ring-offset-0"
                />
                <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] text-sm transition-colors">{t.rememberMe}</span>
              </label>
              <button
                type="button"
                className="text-[var(--accent)] hover:text-[var(--primary)] text-sm transition-colors hover:underline"
              >
                {t.forgotPassword}
              </button>
            </div>

            {/* Error Message */}
            {errors.general && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 text-red-500 text-sm">
                {errors.general}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="w-full py-3.5 bg-[var(--primary)] hover:bg-[var(--accent)] disabled:bg-[var(--secondary)] disabled:cursor-not-allowed text-white font-semibold rounded-md shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>{t.loggingIn}</span>
                </>
              ) : (
                t.loginButton
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-[var(--text-secondary)] text-sm">
              {t.noAccount}{' '}
              <button
                onClick={onNavigateToRegister}
                className="text-[var(--primary)] font-semibold hover:text-[var(--accent)] hover:underline transition-colors"
              >
                {t.createAccount}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-[var(--text-secondary)]/70 text-xs">
            {t.footer}
          </p>
        </div>
      </div>
    </div>
  );
}
