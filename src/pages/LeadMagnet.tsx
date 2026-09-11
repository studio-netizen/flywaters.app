import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MapPin, Fish, BookOpen, CheckCircle2, ArrowRight } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import logoWhite from "@/assets/flywaters-logo-white.png";

const LeadMagnet = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      toast.error("Devi accettare l'informativa sulla privacy per continuare.");
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Inserisci un indirizzo email valido.");
      return;
    }

    setLoading(true);
    try {
      // Store lead in CRM via edge function
      const { error } = await supabase.functions.invoke("capture-lead", {
        body: { email, source: "fly-fishing-guide-italy" },
      });

      if (error) throw error;
      setSubmitted(true);
      toast.success("Guida inviata! Controlla la tua casella email.");
    } catch (err) {
      console.error("Lead capture error:", err);
      toast.error("Si è verificato un errore. Riprova più tardi.");
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    {
      icon: MapPin,
      title: "Spot nascosti",
      desc: "Coordinate GPS di fiumi e torrenti poco conosciuti in tutta Italia",
    },
    {
      icon: Fish,
      title: "Specie e tecniche",
      desc: "Quali mosche usare, periodi migliori e consigli dai locali",
    },
    {
      icon: BookOpen,
      title: "Guide regionali",
      desc: "Approfondimenti su ogni regione italiana per la pesca a mosca",
    },
  ];

  return (
    <>
      <SEOHead
        title="Guida Gratuita Pesca a Mosca in Italia | Flywaters"
        description="Scarica la guida gratuita con i migliori spot di pesca a mosca in Italia. Coordinate GPS, tecniche e consigli dai pescatori locali."
        canonical="/fly-fishing-guide-italy"
      />

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[hsl(200,25%,15%)] to-[hsl(152,45%,20%)] text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }} />
          </div>

          {/* Top bar with logo */}
          <div className="relative z-10 max-w-5xl mx-auto px-4 pt-6 pb-0">
            <Link to="/">
              <img src={logoWhite} alt="Flywaters — La community italiana per la pesca a mosca" className="h-8 md:h-10" />
            </Link>
          </div>

          <div className="relative max-w-5xl mx-auto px-4 py-12 md:py-20">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left: Copy */}
              <div>
                <span className="inline-block bg-white/15 backdrop-blur-sm text-sm font-medium px-4 py-1.5 rounded-full mb-6">
                  📘 Guida Gratuita
                </span>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-5 font-heading">
                  Scopri i migliori spot di pesca a mosca in Italia
                </h1>
                <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-8">
                  Ricevi gratis la guida con le location nascoste, le tecniche migliori e i consigli dei pescatori locali.
                </p>
                <div className="space-y-3">
                  {["Coordinate GPS di spot selezionati", "Tecniche e mosche consigliate per stagione", "Consigli da pescatori locali esperti"].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-[hsl(152,45%,55%)] flex-shrink-0" />
                      <span className="text-white/90">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Form */}
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-2xl">
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-[hsl(152,45%,90%)] rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="h-8 w-8 text-[hsl(152,45%,35%)]" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Guida inviata! 🎣</h3>
                    <p className="text-muted-foreground mb-6">
                      Controlla la tua casella email. Se non trovi nulla, guarda nello spam.
                    </p>
                    <Button asChild variant="outline">
                      <a href="/mappa">Esplora la mappa →</a>
                    </Button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-foreground mb-2">
                      Ricevi la guida gratuita
                    </h2>
                    <p className="text-muted-foreground text-sm mb-6">
                      Inserisci la tua email e riceverai subito la guida in formato digitale.
                    </p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <Input
                        type="email"
                        placeholder="La tua email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-12"
                        maxLength={255}
                      />
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="consent"
                          checked={consent}
                          onCheckedChange={(checked) => setConsent(checked === true)}
                          className="mt-0.5"
                        />
                        <label htmlFor="consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                          Acconsento al trattamento dei miei dati personali in conformità con la{" "}
                          <a href="https://www.iubenda.com/privacy-policy/53958448" target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-primary/80">
                            Privacy Policy
                          </a>
                          . Riceverò la guida e comunicazioni da Flywaters. Posso cancellarmi in qualsiasi momento.
                        </label>
                      </div>
                      <Button
                        type="submit"
                        className="w-full h-12 text-base"
                        disabled={loading || !consent}
                      >
                        {loading ? "Invio in corso..." : "Ricevi la guida gratuita"}
                        {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="max-w-5xl mx-auto px-4 py-16 md:py-20">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
            Cosa troverai nella guida
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((b) => (
              <div key={b.title} className="text-center p-6">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <b.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{b.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Social proof / CTA */}
        <section className="bg-muted/50 py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Unisciti a centinaia di fly fisher italiani
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Flywaters è la community no-kill dove pescatori a mosca condividono spot, catture e consigli. Inizia con la guida gratuita.
            </p>
            <Button asChild size="lg">
              <a href="#top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                Scarica la guida gratuita
              </a>
            </Button>
          </div>
        </section>

        {/* Footer minimal */}
        <footer className="py-8 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Flywaters. Tutti i diritti riservati.</p>
          <div className="mt-2 space-x-4">
            <a href="https://www.iubenda.com/privacy-policy/53958448" target="_blank" rel="noopener noreferrer" className="hover:underline">Privacy Policy</a>
            <a href="https://www.iubenda.com/privacy-policy/53958448/cookie-policy" target="_blank" rel="noopener noreferrer" className="hover:underline">Cookie Policy</a>
            <a href="/contatti" className="hover:underline">Contatti</a>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LeadMagnet;
