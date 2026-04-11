import { useState, FormEvent } from 'react';
import { Eye, EyeOff, Mail, Lock, Globe, Anchor } from 'lucide-react';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';
import { Language, User } from '../App';
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

      <div className="w-full max-w-sm md:max-w-4xl z-10">
        <Card className="overflow-hidden p-0 border-none shadow-2xl glass-panel animate-in fade-in zoom-in duration-700">
          <CardContent className="grid p-0 md:grid-cols-2 min-h-[550px]">
            <form onSubmit={handleSubmit} className="p-8 md:p-12 flex flex-col justify-center gap-8 translate-all duration-500">
              <FieldGroup>
                <div className="flex flex-col items-center gap-3 text-center mb-4">
                  <div className="md:hidden relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-secondary text-white rounded-2xl shadow-xl transform rotate-3 mb-2">
                    <Anchor className="w-8 h-8" />
                  </div>
                  <h1 className="text-3xl font-black tracking-tight text-foreground">
                    {t.title}
                  </h1>
                  <p className="text-balance text-muted-foreground font-medium">
                    {t.subtitle}
                  </p>
                </div>

                {errors.general && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3 animate-in shake duration-300">
                    <p className="text-destructive text-sm font-semibold">{errors.general}</p>
                  </div>
                )}

                <Field>
                  <FieldLabel htmlFor="email" className={language === 'ar' ? 'text-right' : 'text-left'}>{t.email}</FieldLabel>
                  <div className="relative group">
                    <Mail className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary", language === 'ar' ? 'right-3' : 'left-3')} />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.emailPlaceholder}
                      required
                      className={cn("h-12 transition-all duration-300", language === 'ar' ? 'pr-10 text-right' : 'pl-10')}
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                    />
                  </div>
                  {errors.email && <p className="text-destructive text-[11px] font-bold mt-1 px-1">{errors.email}</p>}
                </Field>

                <Field>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="password" className={language === 'ar' ? 'mr-1' : 'ml-1'}>{t.password}</FieldLabel>
                    <button
                      type="button"
                      className="text-xs font-bold text-primary hover:text-primary/80 transition-colors hover:underline"
                    >
                      {t.forgotPassword}
                    </button>
                  </div>
                  <div className="relative group">
                    <Lock className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary", language === 'ar' ? 'right-3' : 'left-3')} />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t.passwordPlaceholder}
                      required
                      className={cn("h-12 transition-all duration-300", language === 'ar' ? 'pr-10 pl-10 text-right' : 'pl-10 pr-10')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors", language === 'ar' ? 'left-3' : 'right-3')}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-destructive text-[11px] font-bold mt-1 px-1">{errors.password}</p>}
                </Field>

                <div className="flex items-center gap-2 px-1">
                   <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 transition-all cursor-pointer"
                  />
                  <label htmlFor="remember" className="text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                    {t.rememberMe}
                  </label>
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading || !isFormValid}
                  className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
                >
                  {isLoading ? (
                    <LoadingIndicator type="line-spinner" size="sm" className="text-white" />
                  ) : (
                    <span className="flex items-center gap-2">
                       {t.loginButton}
                       <svg className={cn("w-4 h-4 transition-transform group-hover:translate-x-1", language === 'ar' ? 'rotate-180' : '')} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </span>
                  )}
                </Button>
                
                <FieldSeparator>{language === 'ar' ? 'أو' : 'Or'}</FieldSeparator>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground font-medium">
                    {t.noAccount}{' '}
                    <button
                      type="button"
                      onClick={onNavigateToRegister}
                      className="text-primary font-bold hover:text-secondary transition-colors underline-offset-4 hover:underline"
                    >
                      {t.createAccount}
                    </button>
                  </p>
                </div>
              </FieldGroup>
            </form>
            
            {/* Branding/Image Column */}
            <div className="relative hidden md:flex flex-col items-center justify-center bg-muted/30 overflow-hidden">
               {/* Decorative Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 z-10 pointer-events-none"></div>
              
              {/* Background Logo with parallax effect potential */}
              <div className="absolute inset-0 z-0 scale-110 opacity-10 blur-sm pointer-events-none grayscale">
                  <img
                    src="/logo (2).png"
                    alt="Logo Background"
                    className="w-full h-full object-cover"
                  />
              </div>

              <div className="relative z-20 flex flex-col items-center text-center p-12 animate-in slide-in-from-bottom-8 duration-1000">
                <div className="w-32 h-32 mb-8 p-1 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                   <img
                    src="/logo (2).png"
                    alt="Logo"
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>
                <h2 className="text-4xl font-black text-foreground mb-4 tracking-tighter">
                  MUKALLA PORT
                </h2>
                <div className="w-20 h-1.5 bg-gradient-to-r from-primary to-secondary rounded-full mb-6"></div>
                <p className="text-muted-foreground text-lg font-medium max-w-[300px] leading-relaxed">
                  {language === 'ar' ? 'نظام إدارة الموانئ البحرية الذكي والمتكامل' : 'Smart and Integrated Maritime Port Management System'}
                </p>
              </div>

              {/* Bottom Footer Info (Branding) */}
              <div className="absolute bottom-8 left-0 right-0 text-center z-20 px-8">
                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/60">
                   {t.footer}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
