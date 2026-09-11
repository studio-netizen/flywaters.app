import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Package, Zap, RefreshCw, Smartphone, Share, Plus, Check, MoreVertical, AlertCircle, Fish } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

const Step = ({ icon: Icon, children, warning }: { icon: any; children: React.ReactNode; warning?: boolean }) => (
  <div className="flex items-start gap-4 py-4 border-b border-[#242242]/10 last:border-0">
    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${warning ? "bg-amber-100 text-amber-700" : "bg-[#242242]/5 text-[#242242]"}`}>
      <Icon className="w-5 h-5" />
    </div>
    <p className="pt-2 text-[#242242] leading-relaxed">{children}</p>
  </div>
);

const InstallaApp = () => {
  const [tab, setTab] = useState("iphone");

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      <Helmet>
        <title>Installa Flywaters sul tuo smartphone — App gratis</title>
        <meta name="description" content="Installa Flywaters sulla schermata home del tuo iPhone o Android in pochi secondi. Niente App Store, leggera e sempre aggiornata." />
        <link rel="canonical" href="https://flywaters.app/installa-app" />
      </Helmet>

      <nav className="px-6 py-6 max-w-7xl mx-auto">
        <Link to="/" className="text-sm tracking-[0.2em] uppercase text-[#242242] font-semibold">Flywaters</Link>
      </nav>

      <header className="px-6 pt-8 pb-16 max-w-3xl mx-auto text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-[#8c8c7a] mb-4">Web App</p>
        <h1 className="text-4xl md:text-5xl font-bold text-[#242242] tracking-tight mb-6" style={{ letterSpacing: "-0.02em" }}>
          Installa Flywaters sul tuo smartphone
        </h1>
        <p className="text-lg text-[#5a5a52] leading-relaxed">
          Accedi alla community di pesca a mosca direttamente dalla tua schermata home — gratis, leggera e veloce.
        </p>
      </header>

      <section className="px-6 pb-16 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Package, title: "Nessun download dallo store", desc: "Niente App Store, niente Google Play. Si installa in 5 secondi direttamente dal browser." },
            { icon: Zap, title: "Leggera e veloce", desc: "Pesa meno di 1MB rispetto ai 50–100MB di un'app tradizionale. Non occupa spazio sullo smartphone." },
            { icon: RefreshCw, title: "Sempre aggiornata", desc: "Si aggiorna automaticamente senza che tu debba fare nulla. Hai sempre l'ultima versione." },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="p-6">
              <div className="w-12 h-12 rounded-full bg-[#242242]/5 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-[#242242]" />
              </div>
              <h3 className="text-lg font-bold text-[#242242] mb-2">{title}</h3>
              <p className="text-sm text-[#5a5a52] leading-relaxed">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="px-6 pb-16 max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-[#242242] mb-8 text-center">Come installare</h2>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-sm mx-auto mb-8">
            <TabsTrigger value="iphone">iPhone</TabsTrigger>
            <TabsTrigger value="android">Android</TabsTrigger>
          </TabsList>

          <TabsContent value="iphone">
            <Card className="p-6 md:p-8">
              <Step icon={Smartphone}>Apri <strong>flywaters.app</strong> su <strong>Safari</strong></Step>
              <Step icon={AlertCircle} warning>Non usare Chrome o altri browser — solo Safari permette di installare l'app su iPhone.</Step>
              <Step icon={Share}>Tocca l'icona <strong>Condividi</strong> in basso (il quadrato con la freccia verso l'alto).</Step>
              <Step icon={Plus}>Scorri e tocca <strong>"Aggiungi a schermata Home"</strong>.</Step>
              <Step icon={Check}>Tocca <strong>"Aggiungi"</strong> in alto a destra — fatto!</Step>
            </Card>
          </TabsContent>

          <TabsContent value="android">
            <Card className="p-6 md:p-8">
              <Step icon={Smartphone}>Apri <strong>flywaters.app</strong> su <strong>Chrome</strong>.</Step>
              <Step icon={MoreVertical}>Tocca i <strong>tre puntini</strong> in alto a destra.</Step>
              <Step icon={Plus}>Tocca <strong>"Aggiungi a schermata Home"</strong> o <strong>"Installa app"</strong>.</Step>
              <Step icon={Check}>Tocca <strong>"Installa"</strong> — fatto!</Step>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      <section className="px-6 pb-20 max-w-3xl mx-auto">
        <div className="bg-[#242242] text-[#f5f0e8] rounded-2xl p-8 md:p-10 text-center">
          <div className="flex justify-center mb-4">
            <Fish className="w-8 h-8" />
          </div>
          <p className="text-lg md:text-xl leading-relaxed mb-8">
            Una volta installata, Flywaters si apre a schermo intero come una vera app — senza barra del browser, senza distrazioni. Solo la community di pesca a mosca.
          </p>
          <Link to="/" className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-[#f5f0e8] text-[#242242] font-semibold text-sm tracking-wide hover:bg-white transition-colors">
            Apri Flywaters
          </Link>
        </div>
      </section>

      <footer className="bg-[#242242] text-[#f5f0e8]">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs tracking-[0.2em] uppercase">Flywaters</p>
          <div className="flex gap-8 text-xs tracking-wide text-[#f5f0e8]/60">
            <Link to="/blog" className="hover:text-[#f5f0e8] transition-colors">Blog</Link>
            <Link to="/installa-app" className="hover:text-[#f5f0e8] transition-colors">Installa l'app</Link>
            <Link to="/contatti" className="hover:text-[#f5f0e8] transition-colors">Contatti</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default InstallaApp;
