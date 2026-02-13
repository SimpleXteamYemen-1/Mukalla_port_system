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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Maritime Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A1628] via-[#153B5E] to-[#1A4D6F]">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-96 h-96 bg-blue-400 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-400 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
      </div>

      {/* Language Toggle */}
      <button
        onClick={onToggleLanguage}
        className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 hover:bg-white/20 transition-all text-white z-10"
      >
        <Globe className="w-5 h-5" />
        <span className="font-medium">{language === 'ar' ? 'English' : 'العربية'}</span>
      </button>

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        {/* Glassmorphic Container */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 md:p-10">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl mb-4 shadow-lg">
              <Anchor className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {t.title}
            </h1>
            <p className="text-blue-200 text-sm">
              {t.subtitle}
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                {t.email}
              </label>
              <div className="relative">
                <div className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-blue-200`}>
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full ${language === 'ar' ? 'pr-11 text-right' : 'pl-11'} py-3 bg-white/10 border ${errors.email ? 'border-red-400' : 'border-white/20'} rounded-xl text-white placeholder-blue-200/50 focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all backdrop-blur-sm`}
                  placeholder={t.emailPlaceholder}
                />
              </div>
              {errors.email && (
                <p className="text-red-300 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                {t.password}
              </label>
              <div className="relative">
                <div className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-blue-200`}>
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full ${language === 'ar' ? 'pr-11 pl-11 text-right' : 'pl-11 pr-11'} py-3 bg-white/10 border ${errors.password ? 'border-red-400' : 'border-white/20'} rounded-xl text-white placeholder-blue-200/50 focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all backdrop-blur-sm`}
                  placeholder={t.passwordPlaceholder}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute ${language === 'ar' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-blue-200 hover:text-white transition-colors`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-300 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-2 focus:ring-blue-400 focus:ring-offset-0"
                />
                <span className="text-blue-100 text-sm">{t.rememberMe}</span>
              </label>
              <button
                type="button"
                className="text-blue-300 hover:text-white text-sm transition-colors"
              >
                {t.forgotPassword}
              </button>
            </div>

            {/* Error Message */}
            {errors.general && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3 text-red-200 text-sm">
                {errors.general}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>{t.loggingIn}</span>
                </div>
              ) : (
                t.loginButton
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-blue-200 text-sm">
              {t.noAccount}{' '}
              <button
                onClick={onNavigateToRegister}
                className="text-white font-semibold hover:text-cyan-300 transition-colors"
              >
                {t.createAccount}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-blue-200/70 text-xs">
            {t.footer}
          </p>
        </div>
      </div>
    </div>
  );
}
