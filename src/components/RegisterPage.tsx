
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
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
        {/* Maritime Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A1628] via-[#153B5E] to-[#1A4D6F]">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-20 w-96 h-96 bg-blue-400 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-400 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
        </div>

        {/* Success Card */}
        <div className="relative w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 md:p-10 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-6 shadow-lg animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">{t.success.title}</h2>
            <p className="text-blue-200 mb-6">{t.success.message}</p>
            <div className="bg-amber-500/20 border border-amber-400/30 rounded-xl p-4 mb-6">
              <p className="text-amber-200 text-sm">{t.success.verificationNote}</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-150"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-300"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 py-12">
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

      {/* Register Card */}
      <div className="relative w-full max-w-2xl">
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

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              {/* Full Name Field */}
              <div className="md:col-span-2">
                <label className="block text-white text-sm font-medium mb-2">
                  {t.fullName}
                </label>
                <div className="relative">
                  <div className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-blue-200`}>
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className={`w-full ${language === 'ar' ? 'pr-11 text-right' : 'pl-11'} py-3 bg-white/10 border ${errors.fullName ? 'border-red-400' : 'border-white/20'} rounded-xl text-white placeholder-blue-200/50 focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all backdrop-blur-sm`}
                    placeholder={t.fullNamePlaceholder}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-red-300 text-xs mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* Email Field */}
              <div className="md:col-span-2">
                <label className="block text-white text-sm font-medium mb-2">
                  {t.email}
                </label>
                <div className="relative">
                  <div className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-blue-200`}>
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                {/* Password Strength Indicator */}
                {formData.password && passwordStrength && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full ${i < passwordStrength.strength ? passwordStrength.color : 'bg-white/20'
                            } transition-all`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-blue-200">{passwordStrength.label}</p>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  {t.confirmPassword}
                </label>
                <div className="relative">
                  <div className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-blue-200`}>
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={`w-full ${language === 'ar' ? 'pr-11 pl-11 text-right' : 'pl-11 pr-11'} py-3 bg-white/10 border ${errors.confirmPassword ? 'border-red-400' : 'border-white/20'} rounded-xl text-white placeholder-blue-200/50 focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all backdrop-blur-sm`}
                    placeholder={t.confirmPasswordPlaceholder}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute ${language === 'ar' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-blue-200 hover:text-white transition-colors`}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-300 text-xs mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Role Selection */}
              <div className="md:col-span-2">
                <label className="block text-white text-sm font-medium mb-3">
                  {t.role}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'agent' })}
                    className={`p-4 rounded-xl border-2 transition-all ${formData.role === 'agent'
                      ? 'bg-blue-500/30 border-blue-400 shadow-lg'
                      : 'bg-white/5 border-white/20 hover:border-white/40'
                      }`}
                  >
                    <div className="text-white font-medium">{t.roles.agent}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'trader' })}
                    className={`p-4 rounded-xl border-2 transition-all ${formData.role === 'trader'
                      ? 'bg-blue-500/30 border-blue-400 shadow-lg'
                      : 'bg-white/5 border-white/20 hover:border-white/40'
                      }`}
                  >
                    <div className="text-white font-medium">{t.roles.trader}</div>
                  </button>
                </div>
                {errors.role && (
                  <p className="text-red-300 text-xs mt-1">{errors.role}</p>
                )}
                <p className="text-blue-200/70 text-xs mt-2">{t.roleNote}</p>
              </div>

              {/* Organization Field (conditionally shown) */}
              {formData.role === 'agent' && (
                <div className="md:col-span-2">
                  <label className="block text-white text-sm font-medium mb-2">
                    {t.organization}
                  </label>
                  <div className="relative">
                    <div className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-blue-200`}>
                      <Building className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      className={`w-full ${language === 'ar' ? 'pr-11 text-right' : 'pl-11'} py-3 bg-white/10 border ${errors.organization ? 'border-red-400' : 'border-white/20'} rounded-xl text-white placeholder-blue-200/50 focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all backdrop-blur-sm`}
                      placeholder={t.organizationPlaceholder}
                    />
                  </div>
                  {errors.organization && (
                    <p className="text-red-300 text-xs mt-1">{errors.organization}</p>
                  )}
                </div>
              )}
            </div>

            {/* Terms & Conditions */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                  className="w-5 h-5 mt-0.5 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-2 focus:ring-blue-400 focus:ring-offset-0"
                />
                <span className="text-blue-100 text-sm">
                  {t.agreeToTerms}{' '}
                  <button type="button" className="text-blue-300 hover:text-white underline">
                    {t.termsLink}
                  </button>
                </span>
              </label>
              {errors.terms && (
                <p className="text-red-300 text-xs mt-1">{errors.terms}</p>
              )}
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>{t.creating}</span>
                </div>
              ) : (
                t.createButton
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-blue-200 text-sm">
              {t.haveAccount}{' '}
              <button
                onClick={onNavigateToLogin}
                className="text-white font-semibold hover:text-cyan-300 transition-colors"
              >
                {t.loginLink}
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
