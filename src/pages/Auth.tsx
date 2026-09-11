import { useState } from 'react';
import SEOHead from '@/components/SEOHead';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, MapPin, AtSign } from 'lucide-react';
import logoDark from '@/assets/flywaters-logo-dark.png';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { italianProvinces } from '@/lib/italian-provinces';
import { logAudit } from '@/lib/audit';

const Auth = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [provincia, setProvincia] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [requestGuideBadge, setRequestGuideBadge] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const passwordsMatch = password === confirmPassword;
  const canRegister = firstName && lastName && username && email && password && confirmPassword && passwordsMatch && privacyAccepted && ageConfirmed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (activeTab === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          logAudit('user.login_failed', 'user', null, { reason: error.message }, email);
          throw error;
        }
        toast.success(t('auth.welcome'));
        navigate('/');
      } else {
        if (!passwordsMatch) {
          toast.error(t('auth.passwordsDontMatch'));
          setLoading(false);
          return;
        }
        const consentTimestamp = new Date().toISOString();
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: `${firstName} ${lastName}`, username, provincia, request_guide: requestGuideBadge },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        if (data.user) {
          supabase
            .from('user_consents')
            .upsert({
              user_id: data.user.id,
              terms_accepted_at: consentTimestamp,
              privacy_accepted_at: consentTimestamp,
              marketing_consent: marketingConsent,
            }, { onConflict: 'user_id' })
            .then(() => {});
          const profileUpdate: Record<string, any> = { age_confirmed: true };
          if (requestGuideBadge) {
            supabase.from('guide_requests').insert({ user_id: data.user.id }).then(() => {});
          }
          let referredBy: string | null = null;
          try { referredBy = localStorage.getItem('flywaters_referred_by'); } catch {}
          if (referredBy) profileUpdate.referred_by = referredBy;
          supabase
            .from('profiles')
            .update(profileUpdate)
            .eq('user_id', data.user.id)
            .then(() => {
              if (referredBy) {
                try { localStorage.removeItem('flywaters_referred_by'); } catch {}
              }
            });
        }
        toast.success(t('auth.checkEmail'));
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const resetEmail = email.trim();
    if (!resetEmail) {
      toast.error(t('resetPassword.enterEmail'));
      return;
    }

    setLoading(true);
    try {
      const redirectTo = 'https://flywaters.app/reset-password';
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, { redirectTo });
      if (error) {
        console.error('Password reset failed:', error);
        toast.error('Si è verificato un errore. Riprova tra qualche minuto.');
      } else {
        logAudit('user.password_reset', 'user', null, undefined, resetEmail);
        // Always show success — do not reveal whether the email exists
        toast.success('Email inviata! Controlla la tua casella di posta.');
      }
    } catch (err: any) {
      console.error('Password reset failed:', err);
      toast.error('Si è verificato un errore. Riprova tra qualche minuto.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'pl-10 bg-white border border-[#242242]/10 rounded-xl focus-visible:ring-[#242242]/30 focus-visible:ring-2 h-12 text-base md:text-sm';

  return (
    <div className="min-h-screen flex items-start md:items-center justify-center p-4 pt-8 md:pt-4 overflow-y-auto" style={{ backgroundColor: '#f5f0e8' }}>
      <SEOHead
        title={`${t('auth.login')} | Flywaters`}
        description={t('seo.defaultDescription')}
      />

      <div className="w-full max-w-[420px] bg-white rounded-[20px] shadow-lg p-6 md:p-8 animate-fade-in mb-[120px]" style={{ marginBottom: 'max(120px, env(safe-area-inset-bottom, 120px))' }}>
        {/* Logo + Language */}
        <div className="flex justify-center items-center gap-3 mb-6 md:mb-8">
          <img src={logoDark} alt="Flywaters" className="h-9" />
          <LanguageSwitcher />
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#f5f0e8] rounded-full p-1 mb-6 md:mb-8">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-full transition-all duration-300 ${
              activeTab === 'login'
                ? 'bg-[#242242] text-white shadow-sm'
                : 'text-[#8c8c7a] hover:text-[#242242]'
            }`}
          >
            {t('auth.login')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-full transition-all duration-300 ${
              activeTab === 'register'
                ? 'bg-[#242242] text-white shadow-sm'
                : 'text-[#8c8c7a] hover:text-[#242242]'
            }`}
          >
            {t('auth.register')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'login' && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-xs uppercase tracking-wider text-[#8c8c7a]">
                  {t('auth.email')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                  <Input id="login-email" type="email" placeholder="tu@esempio.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password" className="text-xs uppercase tracking-wider text-[#8c8c7a]">
                  {t('auth.password')}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                  <Input id="login-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} pr-10`} required minLength={6} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c8c7a] hover:text-[#242242] transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button 
                type="button" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void handleResetPassword();
                }}
                className="text-xs text-[#8c8c7a] hover:text-[#242242] transition-colors text-left"
              >
                {t('auth.forgotPassword')}
              </button>
            </>
          )}

          {activeTab === 'register' && (
            <>
              {/* Nome + Cognome */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-first" className="text-xs uppercase tracking-wider text-[#8c8c7a]">{t('auth.firstName')}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                    <Input id="reg-first" placeholder="Mario" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-last" className="text-xs uppercase tracking-wider text-[#8c8c7a]">{t('auth.lastName')}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                    <Input id="reg-last" placeholder="Rossi" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} required />
                  </div>
                </div>
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-username" className="text-xs uppercase tracking-wider text-[#8c8c7a]">Username</Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                  <Input id="reg-username" placeholder="mario_rossi" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} className={inputClass} required maxLength={30} />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-email" className="text-xs uppercase tracking-wider text-[#8c8c7a]">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                  <Input id="reg-email" type="email" placeholder="tu@esempio.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-password" className="text-xs uppercase tracking-wider text-[#8c8c7a]">{t('auth.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                  <Input id="reg-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} pr-10`} required minLength={6} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c8c7a] hover:text-[#242242] transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Conferma Password */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-confirm" className="text-xs uppercase tracking-wider text-[#8c8c7a]">{t('auth.confirmPassword')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                  <Input id="reg-confirm" type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`${inputClass} pr-10 ${confirmPassword && !passwordsMatch ? 'border-red-400 focus-visible:ring-red-300' : ''}`} required minLength={6} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c8c7a] hover:text-[#242242] transition-colors">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-red-500 mt-1">{t('auth.passwordsDontMatch')}</p>
                )}
              </div>

              {/* Provincia */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-provincia" className="text-xs uppercase tracking-wider text-[#8c8c7a]">Provincia <span className="normal-case tracking-normal">(opzionale)</span></Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a] z-10" />
                  <select
                    id="reg-provincia"
                    value={provincia}
                    onChange={(e) => setProvincia(e.target.value)}
                    className="flex h-12 w-full rounded-xl border border-[#242242]/10 bg-white pl-10 pr-3 py-2 text-base md:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#242242]/30 transition-colors appearance-none"
                  >
                    <option value="">Seleziona provincia...</option>
                    {italianProvinces.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Guide Badge checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input type="checkbox" checked={requestGuideBadge} onChange={(e) => setRequestGuideBadge(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-[#242242]/20 text-[#242242] focus:ring-[#242242]/30 accent-[#242242]" />
                <span className="text-xs text-[#8c8c7a] leading-relaxed">
                  {t('auth.requestGuideBadge')}
                </span>
              </label>

              {/* GDPR consent checkboxes */}
              <div className="space-y-2.5 pt-2 border-t border-[#242242]/10 mt-2">
                <label className="flex items-start gap-2.5 cursor-pointer pt-2">
                  <input type="checkbox" checked={privacyAccepted} onChange={(e) => setPrivacyAccepted(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-[#242242]/20 text-[#242242] focus:ring-[#242242]/30 accent-[#242242]" required />
                  <span className="text-xs text-[#8c8c7a] leading-relaxed">
                    Ho letto e accetto i{' '}
                    <a href="https://www.iubenda.com/termini-e-condizioni/53958448" target="_blank" rel="noopener noreferrer" className="text-[#242242] underline hover:no-underline">Termini di Servizio</a>
                    {' '}e la{' '}
                    <a href="https://www.iubenda.com/privacy-policy/53958448" target="_blank" rel="noopener noreferrer" className="text-[#242242] underline hover:no-underline">Privacy Policy</a>
                    <span className="text-red-500"> *</span>
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-[#242242]/20 text-[#242242] focus:ring-[#242242]/30 accent-[#242242]" required />
                  <span className="text-xs text-[#8c8c7a] leading-relaxed">
                    Confermo di avere almeno 16 anni<span className="text-red-500"> *</span>
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={marketingConsent} onChange={(e) => setMarketingConsent(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-[#242242]/20 text-[#242242] focus:ring-[#242242]/30 accent-[#242242]" />
                  <span className="text-xs text-[#8c8c7a] leading-relaxed">
                    Acconsento a ricevere comunicazioni promozionali via email
                  </span>
                </label>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading || (activeTab === 'register' && !canRegister)}
            className="w-full py-3.5 rounded-full text-sm tracking-widest uppercase font-medium bg-[#242242] text-white hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2 mt-2"
            style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            {loading ? t('auth.loading') : activeTab === 'login' ? t('auth.login') : t('auth.createAccount')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
