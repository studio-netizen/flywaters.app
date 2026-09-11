import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Lock, ArrowRight, Eye, EyeOff, CheckCircle } from 'lucide-react';
import logoDark from '@/assets/flywaters-logo-dark.png';
import { useTranslation } from 'react-i18next';
import SEOHead from '@/components/SEOHead';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [linkInvalid, setLinkInvalid] = useState(false);
  const [hasRecoveryToken, setHasRecoveryToken] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;
    const hasHashToken = hash.includes('type=recovery') || hash.includes('access_token');
    const hasError = hash.includes('error') || search.includes('error');

    if (hasError) {
      setLinkInvalid(true);
      setChecking(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && hasHashToken)) {
        setHasRecoveryToken(true);
        setChecking(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (hasHashToken || session) {
        setHasRecoveryToken(true);
        setChecking(false);
      }
    });

    const timeout = setTimeout(() => {
      setChecking(false);
      if (!hasHashToken) setLinkInvalid(true);
    }, 2000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Le password non corrispondono');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('La password deve essere di almeno 8 caratteri');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setSuccess(true);
      toast.success('Password aggiornata! Reindirizzamento...');

      setTimeout(() => {
        navigate('/feed');
      }, 2000);
    } catch (err: any) {
      console.error('Update password failed:', err);
      setLinkInvalid(true);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'pl-10 bg-white border border-[#242242]/10 rounded-xl focus-visible:ring-[#242242]/30 focus-visible:ring-2 h-12 text-base md:text-sm';

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0e8' }}>
        <div className="w-8 h-8 border-2 border-[#242242]/20 border-t-[#242242] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f5f0e8' }}>
      <SEOHead
        title={`${t('resetPassword.title')} | Flywaters`}
        description={t('seo.defaultDescription')}
      />

      <div className="w-full max-w-[420px] bg-white rounded-[20px] shadow-lg p-6 md:p-8 animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-6 md:mb-8">
          <img src={logoDark} alt="Flywaters" className="h-9" />
        </div>

        {linkInvalid ? (
          <div className="text-center space-y-4">
            <h1 className="text-xl font-medium text-[#242242]">Link scaduto o non valido</h1>
            <p className="text-sm text-[#8c8c7a]">Richiedi un nuovo link per reimpostare la password.</p>
            <Button
              onClick={() => navigate('/auth')}
              className="w-full py-3.5 rounded-full text-sm tracking-widest uppercase font-medium bg-[#242242] text-white hover:opacity-90 transition-opacity"
            >
              Richiedi un nuovo link
            </Button>
          </div>
        ) : success ? (
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h1 className="text-xl font-medium text-[#242242]">Password aggiornata!</h1>
            <p className="text-sm text-[#8c8c7a]">Reindirizzamento...</p>
          </div>
        ) : !hasRecoveryToken ? (
          <div className="text-center space-y-4">
            <h1 className="text-xl font-medium text-[#242242]">Link scaduto o non valido</h1>
            <p className="text-sm text-[#8c8c7a]">Richiedi un nuovo link per reimpostare la password.</p>
            <Button
              onClick={() => navigate('/auth')}
              className="w-full py-3.5 rounded-full text-sm tracking-widest uppercase font-medium bg-[#242242] text-white hover:opacity-90 transition-opacity"
            >
              Richiedi un nuovo link
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-medium text-[#242242] mb-2 text-center">
              {t('resetPassword.title')}
            </h1>
            <p className="text-sm text-[#8c8c7a] text-center mb-6">
              {t('resetPassword.subtitle')}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nuova Password */}
              <div className="space-y-1.5">
                <Label htmlFor="new-password" className="text-xs uppercase tracking-wider text-[#8c8c7a]">
                  {t('resetPassword.newPassword')}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                  <Input 
                    id="new-password" 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="••••••••" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    className={`${inputClass} pr-10`} 
                    required 
                    minLength={8} 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c8c7a] hover:text-[#242242] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Conferma Password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-xs uppercase tracking-wider text-[#8c8c7a]">
                  {t('resetPassword.confirmPassword')}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c7a]" />
                  <Input 
                    id="confirm-password" 
                    type={showConfirmPassword ? 'text' : 'password'} 
                    placeholder="••••••••" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    className={`${inputClass} pr-10`} 
                    required 
                    minLength={8} 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c8c7a] hover:text-[#242242] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full text-sm tracking-widest uppercase font-medium bg-[#242242] text-white hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? t('resetPassword.updating') : t('resetPassword.updatePassword')}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;