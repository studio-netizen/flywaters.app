import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

/**
 * Mandatory GDPR consent modal shown on first access (e.g. Google OAuth
 * signups that skip the registration form) before the user can complete
 * profile setup. Persists `terms_accepted_at`, `privacy_accepted_at` and
 * `marketing_consent` on the `profiles` row.
 *
 * Renders nothing once consent has already been recorded.
 */
const ConsentGate = ({ onAccepted }: { onAccepted?: () => void }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [needsConsent, setNeedsConsent] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('user_consents')
        .select('terms_accepted_at')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      setNeedsConsent(!data?.terms_accepted_at);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const canSubmit = privacyAccepted && ageConfirmed;

  const handleAccept = async () => {
    if (!user || !canSubmit) return;
    setSaving(true);
    const ts = new Date().toISOString();
    const { error } = await supabase
      .from('user_consents')
      .upsert({
        user_id: user.id,
        terms_accepted_at: ts,
        privacy_accepted_at: ts,
        marketing_consent: marketingConsent,
      }, { onConflict: 'user_id' });
    if (!error) {
      await supabase
        .from('profiles')
        .update({ age_confirmed: true })
        .eq('user_id', user.id);
    }
    setSaving(false);
    if (error) {
      toast.error('Impossibile salvare i consensi. Riprova.');
      return;
    }
    setNeedsConsent(false);
    onAccepted?.();
  };

  if (loading || !needsConsent) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl" style={{ color: '#242242' }}>
        <h2 className="text-xl font-bold font-serif mb-2">Prima di continuare</h2>
        <p className="text-sm text-[#8c8c7a] mb-5">
          Per usare Flywaters dobbiamo raccogliere alcuni consensi.
        </p>

        <div className="space-y-3">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[#242242]/20 accent-[#242242]"
            />
            <span className="text-xs leading-relaxed">
              Ho letto e accetto i{' '}
              <a href="https://www.iubenda.com/termini-e-condizioni/53958448" target="_blank" rel="noopener noreferrer" className="underline">Termini di Servizio</a>
              {' '}e la{' '}
              <a href="https://www.iubenda.com/privacy-policy/53958448" target="_blank" rel="noopener noreferrer" className="underline">Privacy Policy</a>
              <span className="text-red-500"> *</span>
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[#242242]/20 accent-[#242242]"
            />
            <span className="text-xs leading-relaxed">
              Confermo di avere almeno 16 anni<span className="text-red-500"> *</span>
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[#242242]/20 accent-[#242242]"
            />
            <span className="text-xs leading-relaxed">
              Acconsento a ricevere comunicazioni promozionali via email
            </span>
          </label>
        </div>

        <Button
          onClick={handleAccept}
          disabled={!canSubmit || saving}
          className="w-full h-12 rounded-full text-sm font-semibold bg-[#242242] text-[#f5f0e8] hover:opacity-90 mt-6 disabled:opacity-40"
        >
          {saving ? 'Salvataggio...' : 'Continua'}
        </Button>
      </div>
    </div>
  );
};

export default ConsentGate;
