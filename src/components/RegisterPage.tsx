import { useState, FormEvent } from 'react';
import { Eye, EyeOff, Mail, Lock, User as UserIcon, Globe, Anchor, Building, CheckCircle2 } from 'lucide-react';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';
import { Language, User, UserRole } from '../App';
import { translations } from '../utils/translations';
import api from '../services/api';
import { cn } from "@/components/ui/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

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
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    const labels = [t.passwordStrength.weak, t.passwordStrength.fair, t.passwordStrength.good, t.passwordStrength.strong];
    const colors = ['bg-destructive', 'bg-amber-500', 'bg-yellow-500', 'bg-green-500'];

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

      const { user } = response.data || {};

      setShowSuccess(true);
      
      if (response.status === 202) {
        setIsPendingApproval(true);
        setIsLoading(false);
      } else {
        setTimeout(() => {
          onRegister(user);
        }, 2000);
      }
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
    <div className="min-h-screen relative flex items-center justify-center p-6 md:p-10 bg-gradient-to-br from-primary/20 via-background to-secondary/30 transition-colors duration-500 overflow-hidden">
      {/* Background Micro-animations */}
      <div className="absolute inset-0 pointer-events-none opacity-50">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 blur-[120px] rounded-full animate-pulse delay-700"></div>
      </div>

       {/* Language Toggle */}
      <button
        onClick={onToggleLanguage}
        className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-background/50 hover:bg-primary/10 backdrop-blur-md border border-border hover:border-primary text-foreground rounded-xl transition-all shadow-lg z-20 group"
      >
        <Globe className="w-4 h-4 group-hover:text-primary transition-colors" />
        <span className="font-bold text-sm tracking-wide">{language === 'ar' ? 'English' : 'العربية'}</span>
      </button>

      <div className="w-full max-w-4xl z-10">
        <Card className="overflow-hidden p-0 border-none shadow-2xl glass-panel animate-in fade-in zoom-in duration-700">
           <CardContent className="p-8 md:p-12">
            {showSuccess ? (
              <div className="text-center py-12 animate-in fade-in zoom-in duration-700">
                <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h2 className="text-4xl font-black text-foreground mb-4">
                  {isPendingApproval ? t.success.pendingTitle : t.success.title}
                </h2>
                <p className="text-muted-foreground font-medium mb-10 text-lg max-w-xl mx-auto">
                  {isPendingApproval ? t.success.pendingMessage : t.success.message}
                </p>
                {!isPendingApproval && (
                  <div className="p-5 bg-primary/10 border border-primary/20 rounded-2xl mb-10 max-w-md mx-auto">
                    <p className="text-primary text-sm font-bold">
                      {t.success.verificationNote}
                    </p>
                  </div>
                )}
                <Button
                  onClick={onNavigateToLogin}
                  className="w-full max-w-xs h-14 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold rounded-xl shadow-xl hover:-translate-y-1 transition-all"
                >
                  {t.loginLink}
                </Button>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center gap-4 text-center mb-10">
                  <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-secondary text-white rounded-2xl shadow-xl transform rotate-3 mb-4">
                    <Anchor className="w-10 h-10" />
                  </div>
                  <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">
                    {t.title}
                  </h1>
                  <p className="text-muted-foreground font-medium text-lg">
                    {t.subtitle}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Full Name Field */}
                    <Field className="md:col-span-2">
                      <FieldLabel className={language === 'ar' ? 'text-right' : 'text-left'}>{t.fullName}</FieldLabel>
                      <div className="relative group">
                         <UserIcon className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary", language === 'ar' ? 'right-3' : 'left-3')} />
                        <Input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder={t.fullNamePlaceholder}
                          className={cn("h-12", language === 'ar' ? 'pr-10 text-right' : 'pl-10')}
                        />
                      </div>
                      {errors.fullName && <p className="text-destructive text-[11px] font-bold mt-1">{errors.fullName}</p>}
                    </Field>

                    {/* Email Field */}
                    <Field className="md:col-span-2">
                       <FieldLabel className={language === 'ar' ? 'text-right' : 'text-left'}>{t.email}</FieldLabel>
                      <div className="relative group">
                        <Mail className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary", language === 'ar' ? 'right-3' : 'left-3')} />
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder={t.emailPlaceholder}
                          className={cn("h-12", language === 'ar' ? 'pr-10 text-right' : 'pl-10')}
                        />
                      </div>
                      {errors.email && <p className="text-destructive text-[11px] font-bold mt-1">{errors.email}</p>}
                    </Field>

                    {/* Password Field */}
                    <Field>
                       <FieldLabel className={language === 'ar' ? 'text-right' : 'text-left'}>{t.password}</FieldLabel>
                      <div className="relative group">
                         <Lock className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary", language === 'ar' ? 'right-3' : 'left-3')} />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder={t.passwordPlaceholder}
                          className={cn("h-12", language === 'ar' ? 'pr-10 pl-10 text-right' : 'pl-10 pr-10')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary", language === 'ar' ? 'left-3' : 'right-3')}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-destructive text-[11px] font-bold mt-1">{errors.password}</p>}
                      {formData.password && passwordStrength && (
                        <div className="mt-3 space-y-1.5">
                          <div className="flex gap-1.5 h-1">
                            {[...Array(4)].map((_, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "flex-1 rounded-full transition-all duration-500",
                                  i < passwordStrength.strength ? passwordStrength.color : "bg-muted"
                                )}
                              />
                            ))}
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{passwordStrength.label}</p>
                        </div>
                      )}
                    </Field>

                    {/* Confirm Password Field */}
                    <Field>
                      <FieldLabel className={language === 'ar' ? 'text-right' : 'text-left'}>{t.confirmPassword}</FieldLabel>
                      <div className="relative group">
                         <Lock className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary", language === 'ar' ? 'right-3' : 'left-3')} />
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          placeholder={t.confirmPasswordPlaceholder}
                          className={cn("h-12", language === 'ar' ? 'pr-10 pl-10 text-right' : 'pl-10 pr-10')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary", language === 'ar' ? 'left-3' : 'right-3')}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="text-destructive text-[11px] font-bold mt-1">{errors.confirmPassword}</p>}
                    </Field>

                    {/* Role Selection */}
                    <Field className="md:col-span-2">
                       <FieldLabel className={language === 'ar' ? 'text-right' : 'text-left'}>{t.role}</FieldLabel>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, role: 'agent' })}
                          className={cn(
                            "p-5 rounded-2xl border-2 transition-all relative overflow-hidden group",
                            formData.role === 'agent'
                              ? "bg-primary/10 border-primary ring-4 ring-primary/5"
                              : "bg-muted/30 border-border hover:border-primary/50"
                          )}
                        >
                           <div className="font-bold relative z-10 text-sm">{t.roles.agent}</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, role: 'trader' })}
                          className={cn(
                            "p-5 rounded-2xl border-2 transition-all relative overflow-hidden group",
                            formData.role === 'trader'
                              ? "bg-primary/10 border-primary ring-4 ring-primary/5"
                              : "bg-muted/30 border-border hover:border-primary/50"
                          )}
                        >
                          <div className="font-bold relative z-10 text-sm">{t.roles.trader}</div>
                        </button>
                      </div>
                      {errors.role && <p className="text-destructive text-[11px] font-bold mt-1">{errors.role}</p>}
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-2 italic">{t.roleNote}</p>
                    </Field>

                    {/* Organization Field */}
                    {formData.role === 'agent' && (
                      <Field className="md:col-span-2 animate-in slide-in-from-top-4 duration-500">
                         <FieldLabel className={language === 'ar' ? 'text-right' : 'text-left'}>{t.organization}</FieldLabel>
                        <div className="relative group">
                          <Building className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary", language === 'ar' ? 'right-3' : 'left-3')} />
                          <Input
                            type="text"
                            value={formData.organization}
                            onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                            placeholder={t.organizationPlaceholder}
                            className={cn("h-12", language === 'ar' ? 'pr-10 text-right' : 'pl-10')}
                          />
                        </div>
                        {errors.organization && <p className="text-destructive text-[11px] font-bold mt-1">{errors.organization}</p>}
                      </Field>
                    )}
                  </div>

                  {/* Terms & Conditions */}
                  <div className="pt-2">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative mt-1">
                        <input
                          type="checkbox"
                          checked={formData.agreeToTerms}
                          onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-5 h-5 rounded border-2 border-border peer-checked:bg-primary peer-checked:border-primary transition-all shadow-inner"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-primary-foreground opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                      </div>
                      <span className="text-muted-foreground text-sm font-semibold leading-tight group-hover:text-foreground transition-colors">
                        {t.agreeToTerms}{' '}
                        <button type="button" className="text-primary hover:text-secondary underline font-black">
                          {t.termsLink}
                        </button>
                      </span>
                    </label>
                    {errors.terms && <p className="text-destructive text-[11px] font-bold mt-1">{errors.terms}</p>}
                  </div>

                  {errors.general && (
                     <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3 animate-in shake duration-300">
                      <p className="text-destructive text-sm font-semibold">{errors.general}</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-6 pt-4">
                    <Button
                      type="submit"
                      disabled={isLoading || !isFormValid}
                      className="w-full h-14 bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-primary-foreground font-black text-lg rounded-xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 active:translate-y-0 transition-all duration-300"
                    >
                      {isLoading ? (
                        <LoadingIndicator type="line-spinner" size="sm" className="text-white" />
                      ) : (
                        <span className="flex items-center gap-3">
                          {t.createButton}
                          <Anchor className={cn("w-5 h-5", language === 'ar' ? 'rotate-180' : '')} />
                        </span>
                      )}
                    </Button>

                    <div className="text-center pt-2">
                      <p className="text-muted-foreground font-medium">
                        {t.haveAccount}{' '}
                        <button
                          type="button"
                          onClick={onNavigateToLogin}
                          className="text-primary font-black hover:text-secondary transition-colors underline-offset-4 hover:underline"
                        >
                          {t.loginLink}
                        </button>
                      </p>
                    </div>
                  </div>
                </form>

                <div className="mt-16 text-center border-t border-border/50 pt-8">
                  <p className="text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground/40">
                    {t.footer}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
