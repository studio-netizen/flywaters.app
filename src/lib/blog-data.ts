export interface BlogArticle {
  slug: string;
  title: string;
  titleTag: string;
  metaDescription: string;
  h1: string;
  readingTime: string;
  excerpt: string;
  coverImage: string;
  sections: { heading: string; body: string }[];
}

export const blogArticles: BlogArticle[] = [
  {
    slug: 'migliori-spot-pesca-mosca-italia',
    title: 'I 10 migliori spot di pesca a mosca in Italia',
    titleTag: 'I 10 migliori spot di pesca a mosca in Italia — Flywaters',
    metaDescription: 'Dalla Valtellina al Friuli, scopri i migliori fiumi e torrenti italiani per la pesca a mosca. Guida completa agli spot no-kill più ambiti d\'Italia.',
    h1: 'I 10 migliori spot di pesca a mosca in Italia',
    readingTime: '8 min',
    excerpt: 'Dalla Valtellina al Friuli, scopri i migliori fiumi e torrenti italiani per la pesca a mosca.',
    coverImage: 'https://images.unsplash.com/photo-1494564605686-2e931f77a8e2?w=800',
    sections: [
      { heading: 'Perché l\'Italia è un paradiso per il fly fishing', body: 'L\'Italia offre alcune delle acque più ricche d\'Europa per la pesca a mosca. Torrenti alpini cristallini, fiumi di risorgiva nelle pianure venete e corsi d\'acqua appenninici ospitano popolazioni straordinarie di trota fario, marmorata e temolo. Ecco i 10 spot imperdibili per ogni fly fisher.' },
      { heading: '1. Torrente Sesia — Piemonte', body: 'Il Sesia è considerato da molti il fiume più bello d\'Italia per la pesca a mosca. Le sue acque fredde e ossigenate ospitano dense popolazioni di trota marmorata, la regina dei fiumi alpini. La zona di tutela ittica tra Varallo e Borgosesia offre tratti no-kill di altissima qualità. Periodo migliore: maggio-settembre.' },
      { heading: '2. Fiume Adda — Valtellina', body: 'Dal Passo dello Spluga fino al lago di Como, l\'Adda regala scenari alpini spettacolari. I tratti a valle di Tirano sono particolarmente vocati per la ninfa e la secca durante le schiuse primaverili. Specie presenti: trota fario, trota iridea, temolo.' },
      { heading: '3. Torrente Natisone — Friuli Venezia Giulia', body: 'Acque turchesi e fondale sassoso rendono il Natisone uno degli spot più fotografati d\'Italia. La visibilità eccezionale permette di sight fishing alla trota fario mediterranea, una delle sottospecie più pregiate. Ideale per la mosca secca in superficie.' },
      { heading: '4. Fiume Brenta — Veneto', body: 'Il Brenta offre diversi tratti di pesca controllata con regolamento no-kill. La zona di Cismon del Grappa è particolarmente rinomata per la presenza di temoli di taglia. Periodo ottimale: ottobre-novembre per i temoli in rimonta.' },
      { heading: '5. Torrente Noce — Trentino', body: 'Il Noce in Val di Sole è uno dei fiumi più tecnici d\'Italia. Acque rapide e pescatori esigenti hanno selezionato trote diffidenti che richiedono presentazioni perfette. Zona ideale per chi vuole migliorare la tecnica della ninfa ceca.' },
      { heading: '6. Fiume Trebbia — Emilia-Romagna', body: 'Uno dei fiumi più puliti dell\'Appennino. Il Trebbia alto, tra Ottone e Bobbio, ospita trota fario autoctona di ceppo mediterraneo. Fondali in ciottoli bianchi e acque limpidissime lo rendono perfetto per la secca.' },
      { heading: '7. Torrente Chiese — Lombardia', body: 'Il Chiese in Valle Sabbia offre tratti di pesca controllata ben gestiti. La presenza di temoli e trote marmorizzate lo rende uno spot di riferimento per i pescatori lombardi. Facile accesso e ottima infrastruttura di pescatori locali.' },
      { heading: '8. Fiume Tagliamento — Friuli Venezia Giulia', body: 'L\'ultimo fiume alpino selvaggio d\'Europa. Il Tagliamento è un ecosistema unico con tratti ampi e ramificati che richiedono wading tecnico. Specie presenti: trota marmorata, temolo, huchen nei tratti bassi.' },
      { heading: '9. Torrente Oglio — Valcamonica', body: 'L\'Oglio in Valcamonica, tra Edolo e Breno, è uno spot storico per la pesca a mosca lombarda. I tratti di tutela ittica ospitano popolazioni stabili di trota fario e marmorata. Paesaggi alpini di grande bellezza.' },
      { heading: '10. Fiume Reno — Appennino Bolognese', body: 'Il Reno alto, nella zona di Porretta Terme, rappresenta il meglio della pesca appenninica. Trote autoctone di ceppo mediterraneo in acque fresche e ben ossigenate. Ideale per una gita fuori porta da Bologna o Firenze.' },
      { heading: 'Come aggiungere i tuoi spot preferiti su Flywaters', body: 'Hai trovato uno spot straordinario che non è in questa lista? Su Flywaters puoi aggiungere nuovi spot direttamente dalla mappa, geolocalizzare il punto esatto e lasciare una recensione dettagliata per aiutare la community. Registrati gratuitamente e contribuisci a costruire la prima mappa italiana del fly fishing.' },
    ],
  },
  {
    slug: 'guida-trota-marmorata-temolo',
    title: 'Trota Marmorata e Temolo: guida completa alla pesca a mosca',
    titleTag: 'Trota Marmorata e Temolo: guida completa alla pesca a mosca — Flywaters',
    metaDescription: 'Scopri tutto su trota marmorata e temolo: habitat, comportamento, tecniche di pesca a mosca e spot migliori in Italia. Guida completa per fly fisher.',
    h1: 'Trota Marmorata e Temolo: guida completa alla pesca a mosca',
    readingTime: '7 min',
    excerpt: 'Scopri tutto su trota marmorata e temolo: habitat, comportamento, tecniche di pesca a mosca e spot migliori.',
    coverImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    sections: [
      { heading: 'La trota marmorata: la regina dei fiumi alpini', body: 'La trota marmorata (Salmo marmoratus) è endemica del bacino del Po e dei fiumi del Friuli. Riconoscibile per la livrea marmorizzata grigio-verde, può superare i 10 kg nei tratti più produttivi. È considerata la preda più ambita dai fly fisher italiani per la sua diffidenza e potenza in combattimento.' },
      { heading: 'Dove trovare la marmorata', body: 'Predilige acque fredde, correnti e ben ossigenate con fondali rocciosi dove appostarsi in attesa delle prede. I fiumi più vocati sono Sesia, Tagliamento, Isonzo e i principali affluenti del Po piemontesi. Si posiziona spesso sotto le rapide o ai bordi delle correnti principali.' },
      { heading: 'Tecniche per la marmorata', body: 'La marmorata è prevalentemente predatrice notturna, ma risponde bene agli streamer di grande dimensione durante le ore centrali della giornata. Le tecniche più efficaci sono lo streamer con canne da 7-9wt e code affondanti, la ninfa pesante sui fondali e la secca durante le grandi schiuse primaverili di effimere.' },
      { heading: 'Il temolo: il pesce delle acque veloci', body: 'Il temolo (Thymallus thymallus) è riconoscibile per la caratteristica pinna dorsale a vela e il suo guizzo fulmineo in superficie. È il pesce simbolo della mosca secca — le sue alzate esplosive sono tra le emozioni più intense del fly fishing europeo.' },
      { heading: 'Dove trovare il temolo', body: 'Il temolo predilige fiumi veloci, ghiaiosi e ben ossigenati con temperature mai superiori ai 18°C. In Italia è presente nel Brenta, nel Piave, nell\'Adige e in numerosi affluenti alpini. Il periodo ottimale è autunno, quando i temoli si radunano in grandi stormi nei tratti a corrente moderata.' },
      { heading: 'Tecniche per il temolo', body: 'Il temolo è il pesce ideale per la mosca secca e l\'emerger. Risponde in modo spettacolare durante le schiuse di effimere e plecotteri. Le mosche più efficaci sono le parachute Adams, le CDC dun e i piccoli emerger in misure 16-20. Leader lunghi e sottili (fino a 7x) sono spesso necessari in acque basse e limpide.' },
      { heading: 'No-kill: proteggere queste specie per il futuro', body: 'Sia la trota marmorata che il temolo sono specie vulnerabili che richiedono massima attenzione durante la manipolazione. Su Flywaters la filosofia no-kill è un valore fondante della community: ogni pesce catturato va rilasciato rapidamente, mantenendolo in acqua il più possibile prima dello scatto fotografico.' },
    ],
  },
  {
    slug: 'guida-attrezzatura-pesca-mosca',
    title: 'Attrezzatura pesca a mosca: guida completa a canne, mulinelli e code',
    titleTag: 'Attrezzatura pesca a mosca: canne, mulinelli e code — guida 2026 — Flywaters',
    metaDescription: 'Guida completa all\'attrezzatura per la pesca a mosca: come scegliere canna, mulinello e coda per torrenti alpini e fiumi italiani. Consigli per principianti ed esperti.',
    h1: 'Attrezzatura pesca a mosca: guida completa a canne, mulinelli e code',
    readingTime: '9 min',
    excerpt: 'Come scegliere canna, mulinello e coda per torrenti alpini e fiumi italiani. Consigli per principianti ed esperti.',
    coverImage: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800',
    sections: [
      { heading: 'Come scegliere la canna giusta', body: 'La canna è lo strumento più importante del fly fisher. La scelta dipende principalmente dal tipo di acqua e dalle specie target. Per i torrenti alpini italiani, una canna da 9 piedi in classe 4-5wt è la scelta più versatile. Per la marmorata e lo streamer si sale a 7-8wt, mentre per la pesca tecnica in acque piccole si scende a 2-3wt.' },
      { heading: 'I materiali delle canne moderne', body: 'Le canne in grafite ad alto modulo offrono il miglior rapporto tra leggerezza e potenza. I brand di riferimento sono Sage, Scott, Hardy e Orvis per il segmento premium, mentre Redington, Echo e Shakespeare offrono ottime opzioni per chi inizia. Una canna di qualità media da 200-400€ è più che sufficiente per pescare bene.' },
      { heading: 'Il mulinello: bilanciare la canna', body: 'Il mulinello per la pesca a mosca ha una funzione principalmente di deposito della coda. Le caratteristiche importanti sono il freno a disco affidabile, la leggerezza e la capacità di backing adeguata. Per una canna 4-5wt, un mulinello da 60-150€ di brand come Lamson, Orvis o Hardy è una scelta solida.' },
      { heading: 'Le code: il cuore del sistema', body: 'La coda è l\'elemento che trasmette l\'energia del lancio. Le tipologie principali sono la coda galleggiante (WF — Weight Forward), ideale per la secca e la ninfa in superficie, la coda intermedia per ninfe profonde, e la coda affondante per lo streamer. Per iniziare, una coda WF galleggiante di qualità copre il 90% delle situazioni.' },
      { heading: 'Il finale e il tippet', body: 'Il finale conico collega la coda alla mosca e ha un ruolo fondamentale nella presentazione. Lunghezze tra 9 e 12 piedi sono standard, con punte (tippet) da 4x per la ninfa fino a 7x per la secca tecnica. Materiali fluorocarbon sono preferibili per la loro invisibilità sott\'acqua.' },
      { heading: 'Accessori essenziali', body: 'Oltre alla canna, mulinello e coda, un fly fisher ha bisogno di: waders in Gore-Tex o neoprene, stivali da wading con suola in feltro o gomma, gilet o zaino porta-accessori, pinzette per la rimozione dell\'amo, guadino a maglie fini per il no-kill, e un assortimento di mosche secche, ninfe ed emerger.' },
      { heading: 'Condividi la tua attrezzatura su Flywaters', body: 'Su Flywaters puoi taggare l\'attrezzatura utilizzata in ogni post e spot. Confronta le scelte dei pescatori della community, scopri cosa funziona meglio su ogni fiume e contribuisci con la tua esperienza. Registrati e inizia a condividere.' },
    ],
  },
];
