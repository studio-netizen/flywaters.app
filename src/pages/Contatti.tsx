import { useState } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { italianProvinces } from '@/lib/italian-provinces';
import logoDark from '@/assets/flywaters-logo-dark.png';
import logoWhite from '@/assets/flywaters-logo-white.png';
import { toast } from '@/hooks/use-toast';

const Contatti = () => {
  const [form, setForm] = useState({ nome: '', cognome: '', email: '', cellulare: '', provincia: '', messaggio: '' });
  const [privacy, setPrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const charCount = form.messaggio.length;
  const isValid = form.nome.trim() && form.cognome.trim() && form.email.trim() && form.messaggio.trim() && privacy;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || submitting) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('contact_submissions' as any).insert({
        nome: form.nome.trim(),
        cognome: form.cognome.trim(),
        email: form.email.trim(),
        cellulare: form.cellulare.trim() || null,
        provincia: form.provincia || null,
        messaggio: form.messaggio.trim(),
      });

      if (error) throw error;
      setSubmitted(true);
    } catch {
      toast({
        title: 'Errore',
        description: 'Si è verificato un errore. Riprova o scrivici a info@flywaters.app',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f0e8', color: '#242242' }}>
      <SEOHead
        title="Contatti | Flywaters"
        description="Contatta il team Flywaters per supporto, segnalazioni o collaborazioni."
        canonical="https://flywaters.app/contatti"
      />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 px-6 py-5 bg-[#f5f0e8]/95 backdrop-blur-sm border-b border-[#242242]/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoDark} alt="Flywaters" className="h-5" />
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/blog" className="text-[#8c8c7a] hover:text-[#242242] transition-colors">Blog</Link>
            <Link to="/mappa" className="text-[#8c8c7a] hover:text-[#242242] transition-colors">Mappa</Link>
          </div>
        </div>
      </nav>

      {/* Form */}
      <div className="px-6 py-16">
        <div className="max-w-[600px] mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold font-serif mb-10 text-center">Contatti</h1>

          {submitted ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#4a7c59]/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#4a7c59]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-xl font-bold font-serif mb-3">Grazie per averci scritto!</h2>
              <p className="text-[#8c8c7a]">Ti risponderemo entro 24 ore.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Nome *</label>
                  <Input
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    required
                    maxLength={100}
                    className="bg-white border-[#242242]/15 focus-visible:ring-[#4a7c59]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Cognome *</label>
                  <Input
                    value={form.cognome}
                    onChange={(e) => setForm({ ...form, cognome: e.target.value })}
                    required
                    maxLength={100}
                    className="bg-white border-[#242242]/15 focus-visible:ring-[#4a7c59]"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Email *</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  maxLength={255}
                  className="bg-white border-[#242242]/15 focus-visible:ring-[#4a7c59]"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Cellulare</label>
                <Input
                  type="tel"
                  value={form.cellulare}
                  onChange={(e) => setForm({ ...form, cellulare: e.target.value })}
                  maxLength={20}
                  className="bg-white border-[#242242]/15 focus-visible:ring-[#4a7c59]"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Provincia di provenienza</label>
                <Select value={form.provincia} onValueChange={(v) => setForm({ ...form, provincia: v })}>
                  <SelectTrigger className="bg-white border-[#242242]/15 focus:ring-[#4a7c59]">
                    <SelectValue placeholder="Seleziona provincia" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[280px]">
                    {italianProvinces.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Messaggio *</label>
                <Textarea
                  value={form.messaggio}
                  onChange={(e) => {
                    if (e.target.value.length <= 1000) setForm({ ...form, messaggio: e.target.value });
                  }}
                  required
                  rows={5}
                  className="bg-white border-[#242242]/15 focus-visible:ring-[#4a7c59] resize-none"
                />
                <p className="text-xs text-[#8c8c7a] mt-1 text-right">{charCount}/1000</p>
              </div>

              <div className="flex items-start gap-3 pt-2">
                <Checkbox
                  id="privacy"
                  checked={privacy}
                  onCheckedChange={(v) => setPrivacy(v === true)}
                  className="mt-0.5"
                />
                <label htmlFor="privacy" className="text-sm text-[#242242]/80 leading-snug cursor-pointer">
                  Ho letto e accetto la{' '}
                  <a
                    href="https://www.iubenda.com/privacy-policy/53958448"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-[#4a7c59]"
                  >
                    Privacy Policy
                  </a>
                </label>
              </div>

              <Button
                type="submit"
                disabled={!isValid || submitting}
                className="w-full h-12 text-sm tracking-widest uppercase font-medium bg-[#242242] text-[#f5f0e8] hover:bg-[#242242]/85 rounded-none"
              >
                {submitting ? 'Invio in corso...' : 'Invia messaggio'}
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#242242] text-[#f5f0e8] mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <img src={logoWhite} alt="Flywaters" className="h-6" />
          <div className="flex gap-8 text-xs tracking-wide text-[#f5f0e8]/60">
            <Link to="/blog" className="hover:text-[#f5f0e8] transition-colors">Blog</Link>
            <Link to="/installa-app" className="hover:text-[#f5f0e8] transition-colors">Installa l'app</Link>
            <Link to="/contatti" className="hover:text-[#f5f0e8] transition-colors">Contatti</Link>
            <a href="https://www.iubenda.com/privacy-policy/53958448" target="_blank" rel="noopener noreferrer" className="hover:text-[#f5f0e8] transition-colors">Privacy Policy</a>
            <a href="https://www.iubenda.com/privacy-policy/53958448/cookie-policy" target="_blank" rel="noopener noreferrer" className="hover:text-[#f5f0e8] transition-colors">Cookie Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Contatti;
