import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, MapPin, AtSign } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import logoDark from '@/assets/flywaters-logo-dark.png';
import { italianProvinces } from '@/lib/italian-provinces';
import { logAudit } from '@/lib/audit';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: 'login' | 'register';
}

const AuthModal = ({ open, onOpenChange, defaultMode = 'login' }: AuthModalProps) => {
  const [isLogin, setIsLogin] = useState(defaultMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [provincia, setProvincia] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [requestGuideBadge, setRequestGuideBadge] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const passwordsMatch = password === confirmPassword;
  const canRegister = fullName && lastName && username && email && password && confirmPassword && passwordsMatch && privacyAccepted;

  const handleOpenChange = (val: boolean) => {
    if (val) setIsLogin(defaultMode === 'login');
    onOpenChange(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          logAudit('user.login_failed', 'user', null, { reason: error.message }, email);
          throw error;
        }
        toast.success('Bentornato!');
        onOpenChange(false);
        navigate('/');
      } else {
        if (!passwordsMatch) {
          toast.error('Le password non coincidono');
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: `${fullName} ${lastName}`, username, provincia, request_guide: requestGuideBadge },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        if (requestGuideBadge && data.user) {
          supabase.from('guide_requests').insert({ user_id: data.user.id }).then(() => {});
        }
        toast.success('Controlla la tua email per confermare l\'account!');
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
      toast.error('Inserisci la tua email prima di continuare');
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 bg-[#f5f0e8] border-none max-h-[90vh] overflow-hidden">
        <div className="overflow-y-auto max-h-[90vh] p-6 md:p-8" style={{ paddingBottom: 'max(120px, env(safe-area-inset-bottom, 120px))' }}>
          <div className="flex justify-center mb-6">
            <img src={logoDark} alt="Flywaters" className="h-8" />
          </div>

          <h2 className="text-xl font-bold text-[#242242] text-center mb-1">
            {isLogin ? 'Bentornato' : 'Crea il tuo account'}
          </h2>
          <p className="text-sm text-[#8c8c7a] text-center mb-6">
            {isLogin ? 'Accedi per continuare' : 'Unisciti alla community'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isLogin ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="modal-email" className="text-xs uppercase tracking-wider text-[#8c8c7a]">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                    <Input id="modal-email" type="email" placeholder="tu@esempio.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="modal-password" className="text-xs uppercase tracking-wider text-[#8c8c7a]">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                    <Input id="modal-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} pr-10`} required minLength={6} />
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
                  className="text-xs text-[#8c8c7a] hover:text-[#242242] transition-colors"
                >
                  Password dimenticata?
                </button>
              </>
            ) : (
              <>
                {/* Nome + Cognome */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="modal-first" className="text-xs uppercase tracking-wider text-[#8c8c7a]">Nome</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                      <Input id="modal-first" placeholder="Mario" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="modal-last" className="text-xs uppercase tracking-wider text-[#8c8c7a]">Cognome</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                      <Input id="modal-last" placeholder="Rossi" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} required />
                    </div>
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-1.5">
                  <Label htmlFor="modal-username" className="text-xs uppercase tracking-wider text-[#8c8c7a]">Username</Label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                    <Input id="modal-username" placeholder="mario_rossi" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} className={inputClass} required maxLength={30} />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="modal-reg-email" className="text-xs uppercase tracking-wider text-[#8c8c7a]">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                    <Input id="modal-reg-email" type="email" placeholder="tu@esempio.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="modal-reg-password" className="text-xs uppercase tracking-wider text-[#8c8c7a]">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                    <Input id="modal-reg-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} pr-10`} required minLength={6} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c8c7a] hover:text-[#242242] transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Conferma Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="modal-confirm" className="text-xs uppercase tracking-wider text-[#8c8c7a]">Conferma password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                    <Input id="modal-confirm" type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`${inputClass} pr-10 ${confirmPassword && !passwordsMatch ? 'border-red-400 focus-visible:ring-red-300' : ''}`} required minLength={6} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c8c7a] hover:text-[#242242] transition-colors">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-xs text-red-500 mt-1">Le password non coincidono</p>
                  )}
                </div>

                {/* Provincia */}
                <div className="space-y-1.5">
                  <Label htmlFor="modal-provincia" className="text-xs uppercase tracking-wider text-[#8c8c7a]">Provincia <span className="normal-case tracking-normal">(opzionale)</span></Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a] z-10" />
                    <select
                      id="modal-provincia"
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

                {/* Guide Badge */}
                <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                  <input type="checkbox" checked={requestGuideBadge} onChange={(e) => setRequestGuideBadge(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-[#242242]/20 text-[#242242] focus:ring-[#242242]/30 accent-[#242242]" />
                  <span className="text-xs text-[#8c8c7a] leading-relaxed">
                    Richiedi il <strong>Badge Guida</strong> — solo per guide di pesca a mosca certificate.
                  </span>
                </label>

                {/* Privacy */}
                <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                  <input type="checkbox" checked={privacyAccepted} onChange={(e) => setPrivacyAccepted(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-[#242242]/20 text-[#242242] focus:ring-[#242242]/30 accent-[#242242]" />
                  <span className="text-xs text-[#8c8c7a] leading-relaxed">
                    Ho letto e accetto i{' '}
                    <a href="https://www.iubenda.com/privacy-policy/53958448" target="_blank" rel="noopener noreferrer" className="text-[#242242] underline hover:no-underline">Privacy Policy</a>
                    {' '}e la{' '}
                    <a href="https://www.iubenda.com/privacy-policy/53958448/cookie-policy" target="_blank" rel="noopener noreferrer" className="text-[#242242] underline hover:no-underline">Cookie Policy</a>
                  </span>
                </label>
              </>
            )}

            <button
              type="submit"
              disabled={loading || (!isLogin && !canRegister)}
              className="w-full py-3.5 rounded-full text-sm tracking-widest uppercase font-medium bg-[#242242] text-[#f5f0e8] hover:opacity-85 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? 'Caricamento...' : isLogin ? 'Accedi' : 'Crea account'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>


          <p className="text-center text-sm text-[#8c8c7a]">
            {isLogin ? 'Non hai ancora un account?' : 'Hai già un account?'}{' '}
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-[#242242] font-medium hover:underline">
              {isLogin ? 'Registrati' : 'Accedi'}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
