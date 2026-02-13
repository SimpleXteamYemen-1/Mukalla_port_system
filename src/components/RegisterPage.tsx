
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
        organization: formData.organization, // Backend might need to accept this or we add it to user meta
      });

      const { access_token, user } = response.data;

      // We can either auto-login or show success. The existing flow shows success then navigates.
      // We will perform the navigation after delay as before, but auto-login context?
      // "onRegister" in App.tsx maps to "handleRegister" which sets user and page=dashboard.
      // So if we call onRegister(user), it logs them in.

      // Store token
      localStorage.setItem('token', access_token);

      setIsLoading(false);
      setShowSuccess(true);

      // Navigate to dashboard after 2 seconds
      setTimeout(() => {
        onRegister(user);
      }, 2000);

    } catch (error: any) {
      console.error('Register error:', error);
      setIsLoading(false);
      if (error.response && error.response.data && error.response.data.message) {
        setErrors({ ...errors, general: error.response.data.message });
      } else if (error.response && error.response.data && error.response.data.errors) {
        // Flatten errors
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

  if (showSuccess) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-[var(--bg-primary)]">
        {/* Background Decor */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-[var(--primary)]/5 blur-3xl"></div>
          <div className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-[var(--secondary)]/5 blur-3xl"></div>
        </div>

        {/* Success Card */}
        <div className="relative w-full max-w-md z-10">
          <div className="bg-[var(--bg-primary)] rounded-lg border border-[var(--secondary)] shadow-xl p-8 md:p-10 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 text-green-500 rounded-full mb-6 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">{t.success.title}</h2>
            <p className="text-[var(--text-secondary)] mb-6">{t.success.message}</p>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-4 mb-6">
              <p className="text-amber-500 text-sm">{t.success.verificationNote}</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-[var(--primary)] rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-[var(--primary)] rounded-full animate-pulse delay-150"></div>
              <div className="w-2 h-2 bg-[var(--primary)] rounded-full animate-pulse delay-300"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 py-12 bg-[var(--bg-primary)]">
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

      {/* Register Card */}
      <div className="relative w-full max-w-2xl z-10">
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

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              {/* Full Name Field */}
              <div className="md:col-span-2">
                <label className="block text-[var(--text-primary)] text-sm font-medium mb-2">
                  {t.fullName}
                </label>
                <div className="relative">
                  <div className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-[var(--text-secondary)]`}>
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className={`w-full ${language === 'ar' ? 'pr-11 text-right' : 'pl-11'} py-3 bg-[var(--bg-primary)] border ${errors.fullName ? 'border-red-500' : 'border-[var(--secondary)]'} rounded-md text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all`}
                    placeholder={t.fullNamePlaceholder}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* Email Field */}
              <div className="md:col-span-2">
                <label className="block text-[var(--text-primary)] text-sm font-medium mb-2">
                  {t.email}
                </label>
                <div className="relative">
                  <div className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-[var(--text-secondary)]`}>
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                {/* Password Strength Indicator */}
                {formData.password && passwordStrength && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full ${i < passwordStrength.strength ? passwordStrength.color : 'bg-[var(--secondary)]/30'
                            } transition-all`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">{passwordStrength.label}</p>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-[var(--text-primary)] text-sm font-medium mb-2">
                  {t.confirmPassword}
                </label>
                <div className="relative">
                  <div className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-[var(--text-secondary)]`}>
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={`w-full ${language === 'ar' ? 'pr-11 pl-11 text-right' : 'pl-11 pr-11'} py-3 bg-[var(--bg-primary)] border ${errors.confirmPassword ? 'border-red-500' : 'border-[var(--secondary)]'} rounded-md text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all`}
                    placeholder={t.confirmPasswordPlaceholder}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute ${language === 'ar' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors`}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Role Selection */}
              <div className="md:col-span-2">
                <label className="block text-[var(--text-primary)] text-sm font-medium mb-3">
                  {t.role}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'agent' })}
                    className={`p-4 rounded-md border transition-all ${formData.role === 'agent'
                      ? 'bg-[var(--primary)]/10 border-[var(--primary)] shadow-sm'
                      : 'bg-[var(--bg-primary)] border-[var(--secondary)] hover:border-[var(--accent)]'
                      }`}
                  >
                    <div className={`font-medium ${formData.role === 'agent' ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]'}`}>{t.roles.agent}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'trader' })}
                    className={`p-4 rounded-md border transition-all ${formData.role === 'trader'
                      ? 'bg-[var(--primary)]/10 border-[var(--primary)] shadow-sm'
                      : 'bg-[var(--bg-primary)] border-[var(--secondary)] hover:border-[var(--accent)]'
                      }`}
                  >
                    <div className={`font-medium ${formData.role === 'trader' ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]'}`}>{t.roles.trader}</div>
                  </button>
                </div>
                {errors.role && (
                  <p className="text-red-500 text-xs mt-1">{errors.role}</p>
                )}
                <p className="text-[var(--text-secondary)]/70 text-xs mt-2">{t.roleNote}</p>
              </div>

              {/* Organization Field (conditionally shown) */}
              {formData.role === 'agent' && (
                <div className="md:col-span-2">
                  <label className="block text-[var(--text-primary)] text-sm font-medium mb-2">
                    {t.organization}
                  </label>
                  <div className="relative">
                    <div className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-[var(--text-secondary)]`}>
                      <Building className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      className={`w-full ${language === 'ar' ? 'pr-11 text-right' : 'pl-11'} py-3 bg-[var(--bg-primary)] border ${errors.organization ? 'border-red-500' : 'border-[var(--secondary)]'} rounded-md text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all`}
                      placeholder={t.organizationPlaceholder}
                    />
                  </div>
                  {errors.organization && (
                    <p className="text-red-500 text-xs mt-1">{errors.organization}</p>
                  )}
                </div>
              )}
            </div>

            {/* Terms & Conditions */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                  className="w-5 h-5 mt-0.5 rounded border-[var(--secondary)] bg-[var(--bg-primary)] text-[var(--primary)] focus:ring-[var(--accent)] focus:ring-offset-0"
                />
                <span className="text-[var(--text-secondary)] text-sm group-hover:text-[var(--text-primary)] transition-colors">
                  {t.agreeToTerms}{' '}
                  <button type="button" className="text-[var(--accent)] hover:text-[var(--primary)] underline">
                    {t.termsLink}
                  </button>
                </span>
              </label>
              {errors.terms && (
                <p className="text-red-500 text-xs mt-1">{errors.terms}</p>
              )}
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="w-full py-3.5 bg-[var(--primary)] hover:bg-[var(--accent)] disabled:bg-[var(--secondary)] disabled:cursor-not-allowed text-white font-semibold rounded-md shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>{t.creating}</span>
                </>
              ) : (
                t.createButton
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-[var(--text-secondary)] text-sm">
              {t.haveAccount}{' '}
              <button
                onClick={onNavigateToLogin}
                className="text-[var(--primary)] font-semibold hover:text-[var(--accent)] hover:underline transition-colors"
              >
                {t.loginLink}
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
