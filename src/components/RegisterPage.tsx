import { useState, FormEvent } from 'react';
import { Eye, EyeOff, Mail, Lock, User as UserIcon, Globe, Anchor, Building, CheckCircle2 } from 'lucide-react';
import { Language, User, UserRole } from '../App';
import { translations } from '../utils/translations';
import api from '../services/api';

interface RegisterPageProps {
  language: Language;
  onToggleLanguage: () => void;
  onRegister: (user: User) => void;
  onNavigateToLogin: () => void;
}

export function RegisterPage({ language, onToggleLanguage, onRegister, onNavigateToLogin }: RegisterPageProps) {
  const t = translations[language].register;
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '' as UserRole | '',
    organization: '',
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    const labels = [t.passwordStrength.weak, t.passwordStrength.fair, t.passwordStrength.good, t.passwordStrength.strong];
    const colors = ['bg-red-500', 'bg-amber-500', 'bg-yellow-500', 'bg-green-500'];

    return {
      strength,
      label: labels[strength] || labels[0],
      color: colors[strength] || colors[0],
    };
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = t.errors.nameRequired;
    }

    if (!formData.email) {
      newErrors.email = t.errors.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t.errors.emailInvalid;
    }

    if (!formData.password) {
      newErrors.password = t.errors.passwordRequired;
    } else if (formData.password.length < 8) {
      newErrors.password = t.errors.passwordTooShort;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t.errors.passwordMismatch;
    }

    if (!formData.role) {
      newErrors.role = t.errors.roleRequired;
    }

    if (formData.role === 'agent' && !formData.organization.trim()) {
      newErrors.organization = t.errors.organizationRequired;
    }

    if (!formData.agreeToTerms) {
      newErrors.terms = t.errors.termsRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await api.post('/register', {
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.confirmPassword,
        role: formData.role,
        organization: formData.organization,
      });

      const { access_token, user } = response.data;

      localStorage.setItem('token', access_token);

      setIsLoading(false);
      setShowSuccess(true);

      setTimeout(() => {
        onRegister(user);
      }, 2000);

    } catch (error: any) {
      console.error('Register error:', error);
      setIsLoading(false);
      if (error.response && error.response.data && error.response.data.message) {
        setErrors({ ...errors, general: error.response.data.message });
      } else if (error.response && error.response.data && error.response.data.errors) {
        const apiErrors = error.response.data.errors;
        const mappedErrors: Record<string, string> = {};
        if (apiErrors.name) mappedErrors.fullName = apiErrors.name[0];
        if (apiErrors.email) mappedErrors.email = apiErrors.email[0];
        if (apiErrors.password) mappedErrors.password = apiErrors.password[0];
        if (apiErrors.role) mappedErrors.role = apiErrors.role[0];

        setErrors({ ...errors, ...mappedErrors, general: 'Please check the form for errors.' });
      } else {
        setErrors({ ...errors, general: 'Registration failed. Please try again.' });
      }
    }
  };

  const passwordStrength = formData.password ? getPasswordStrength(formData.password) : null;
  const isFormValid = formData.fullName && formData.email && formData.password &&
    formData.confirmPassword && formData.role && formData.agreeToTerms &&
    (formData.role !== 'agent' || formData.organization);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 py-12 bg-[var(--bg-primary)]">
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

      {/* Register Card */}
      <div className="relative w-full max-w-2xl z-10 animate-in fade-in zoom-in duration-500">
        <div className="glass-panel p-8 md:p-10 relative overflow-hidden">

          {/* Decorative Corner Glow */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-[var(--accent)]/30 blur-2xl rounded-full"></div>

          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-[var(--primary)] blur-xl opacity-20 rounded-full"></div>
              <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white rounded-2xl shadow-lg transform rotate-3 hover:rotate-6 transition-transform duration-300">
                <Anchor className="w-8 h-8" />
              </div>
            </div>

            <h1 className="text-3xl font-black text-[var(--text-primary)] mb-2 tracking-tight">
              {t.title}
            </h1>
            <p className="text-[var(--text-secondary)] font-medium">
              {t.subtitle}
            </p>
          </div>

          {/* Success State */}
          {showSuccess ? (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500/10 text-green-500 rounded-full mb-6 animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">{t.success.title}</h2>
              <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">{t.success.message}</p>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-8 max-w-md mx-auto">
                <p className="text-amber-500 text-sm font-bold">{t.success.verificationNote}</p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-[var(--primary)] rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-[var(--primary)] rounded-full animate-pulse delay-150"></div>
                <div className="w-2 h-2 bg-[var(--primary)] rounded-full animate-pulse delay-300"></div>
              </div>
            </div>
          ) : (
            /* Register Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-5">
                {/* Full Name Field */}
                <div className="md:col-span-2 group">
                  <label className="block text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                    {t.fullName}
                  </label>
                  <div className="relative transition-all duration-300 transform group-focus-within:-translate-y-1">
                    <div className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors`}>
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className={`w-full ${language === 'ar' ? 'pr-12 text-right' : 'pl-12'} py-4 bg-[var(--bg-primary)]/50 border ${errors.fullName ? 'border-red-500' : 'border-[var(--border)]'} rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)]/30 focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 transition-all font-medium shadow-inner`}
                      placeholder={t.fullNamePlaceholder}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-red-500 text-xs font-bold mt-1 ml-1 animate-in slide-in-from-top-1">{errors.fullName}</p>
                  )}
                </div>

                {/* Email Field */}
                <div className="md:col-span-2 group">
                  <label className="block text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                    {t.email}
                  </label>
                  <div className="relative transition-all duration-300 transform group-focus-within:-translate-y-1">
                    <div className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors`}>
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                  {/* Password Strength Indicator */}
                  {formData.password && passwordStrength && (
                    <div className="mt-2 ml-1">
                      <div className="flex gap-1 mb-1">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full ${i < passwordStrength.strength ? passwordStrength.color : 'bg-[var(--secondary)]/30'
                              } transition-all duration-500`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] font-bold">{passwordStrength.label}</p>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="group">
                  <label className="block text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                    {t.confirmPassword}
                  </label>
                  <div className="relative transition-all duration-300 transform group-focus-within:-translate-y-1">
                    <div className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors`}>
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className={`w-full ${language === 'ar' ? 'pr-12 pl-12 text-right' : 'pl-12 pr-12'} py-4 bg-[var(--bg-primary)]/50 border ${errors.confirmPassword ? 'border-red-500' : 'border-[var(--border)]'} rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)]/30 focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 transition-all font-medium shadow-inner`}
                      placeholder={t.confirmPasswordPlaceholder}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={`absolute ${language === 'ar' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors`}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs font-bold mt-1 ml-1 animate-in slide-in-from-top-1">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Role Selection */}
                <div className="md:col-span-2">
                  <label className="block text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider mb-3 ml-1">
                    {t.role}
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'agent' })}
                      className={`p-4 rounded-xl border-2 transition-all relative overflow-hidden group ${formData.role === 'agent'
                        ? 'bg-[var(--primary)]/10 border-[var(--primary)] shadow-lg shadow-[var(--primary)]/10'
                        : 'bg-[var(--bg-primary)]/50 border-[var(--border)] hover:border-[var(--primary)]'
                        }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                      <div className={`font-bold text-center relative z-10 ${formData.role === 'agent' ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]'}`}>{t.roles.agent}</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'trader' })}
                      className={`p-4 rounded-xl border-2 transition-all relative overflow-hidden group ${formData.role === 'trader'
                        ? 'bg-[var(--primary)]/10 border-[var(--primary)] shadow-lg shadow-[var(--primary)]/10'
                        : 'bg-[var(--bg-primary)]/50 border-[var(--border)] hover:border-[var(--primary)]'
                        }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                      <div className={`font-bold text-center relative z-10 ${formData.role === 'trader' ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]'}`}>{t.roles.trader}</div>
                    </button>
                  </div>
                  {errors.role && (
                    <p className="text-red-500 text-xs font-bold mt-1 ml-1 animate-in slide-in-from-top-1">{errors.role}</p>
                  )}
                  <p className="text-[var(--text-secondary)]/70 text-xs mt-2 ml-1 font-medium italic">{t.roleNote}</p>
                </div>

                {/* Organization Field (conditionally shown) */}
                {formData.role === 'agent' && (
                  <div className="md:col-span-2 group animate-in slide-in-from-top-2">
                    <label className="block text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                      {t.organization}
                    </label>
                    <div className="relative transition-all duration-300 transform group-focus-within:-translate-y-1">
                      <div className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors`}>
                        <Building className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        value={formData.organization}
                        onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                        className={`w-full ${language === 'ar' ? 'pr-12 text-right' : 'pl-12'} py-4 bg-[var(--bg-primary)]/50 border ${errors.organization ? 'border-red-500' : 'border-[var(--border)]'} rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)]/30 focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 transition-all font-medium shadow-inner`}
                        placeholder={t.organizationPlaceholder}
                      />
                    </div>
                    {errors.organization && (
                      <p className="text-red-500 text-xs font-bold mt-1 ml-1 animate-in slide-in-from-top-1">{errors.organization}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Terms & Conditions */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-1">
                    <input
                      type="checkbox"
                      checked={formData.agreeToTerms}
                      onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 rounded border-2 border-[var(--secondary)] peer-checked:bg-[var(--primary)] peer-checked:border-[var(--primary)] transition-all"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                  </div>
                  <span className="text-[var(--text-secondary)] text-sm font-medium group-hover:text-[var(--text-primary)] transition-colors">
                    {t.agreeToTerms}{' '}
                    <button type="button" className="text-[var(--primary)] hover:text-[var(--accent)] underline font-bold">
                      {t.termsLink}
                    </button>
                  </span>
                </label>
                {errors.terms && (
                  <p className="text-red-500 text-xs font-bold mt-1 ml-1 animate-in slide-in-from-top-1">{errors.terms}</p>
                )}
              </div>

              {/* General Error */}
              {errors.general && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 animate-in shake">
                  <div className="p-1 bg-red-500/20 rounded-full">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  </div>
                  <p className="text-red-500 text-sm font-medium">{errors.general}</p>
                </div>
              )}

              {/* Register Button */}
              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="w-full py-4 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] hover:from-[var(--accent)] hover:to-[var(--primary)] disabled:from-[var(--secondary)] disabled:to-[var(--secondary)] disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>{t.creating}</span>
                  </>
                ) : (
                  <>
                    {t.createButton}
                    <svg className={`w-5 h-5 transition-transform duration-300 ${isFormValid ? 'translate-x-1 group-hover:translate-x-2' : ''} ${language === 'ar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Login Link */}
          {!showSuccess && (
            <div className="mt-8 text-center pt-6 border-t border-[var(--border)]">
              <p className="text-[var(--text-secondary)] text-sm font-medium">
                {t.haveAccount}{' '}
                <button
                  onClick={onNavigateToLogin}
                  className="text-[var(--primary)] font-bold hover:text-[var(--accent)] ml-1 transition-colors relative group"
                >
                  {t.loginLink}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--primary)] transition-all group-hover:w-full"></span>
                </button>
              </p>
            </div>
          )}
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
