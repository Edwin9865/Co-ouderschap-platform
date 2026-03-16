// src/data/blogPosts.ts
// src/data/blogPosts.ts

export interface BlogPost {
  id: number;
  slug: string;

  title: string;
  excerpt: string;
  contentMd: string;

  author: string;
  date: string;     // yyyy-mm-dd
  readTime: string; // bijv. "6 min"
  category: string;
  image: string;

  seo: {
    title: string;
    description: string;
    keywords: string[];
    canonicalPath: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
  };

  sources: { title: string; url: string }[];
}

export const posts: BlogPost[] = [
  {
     id: 1,
    slug: "effectieve-communicatie-met-je-co-ouder",
    title: "Effectieve communicatie met je co-ouder",
    excerpt: "Leer hoe je constructief communiceert, zelfs als gesprekken snel escaleren. Met praktische scripts, BIFF-berichten en afspraken die ruzie voorkomen.",
    author: "Sarah de Vries",
    date: "2025-04-15",
    readTime: "7 min",
    category: "Communicatie",
    image: "https://images.pexels.com/photos/5212317/pexels-photo-5212317.jpeg?auto=compress&cs=tinysrgb&w=800",

    seo: {
      title: "Effectieve communicatie met je co-ouder (zonder ruzie) | Co-ouderschap Blog",
      description:
        "Praktische tips om rustiger te communiceren met je co-ouder: BIFF-methode, voorbeeldzinnen, grenzen, afspraken en wat je wél/niet bespreekt voor het welzijn van je kind.",
      keywords: [
        "co-ouderschap communicatie",
        "communiceren met ex partner",
        "BIFF methode",
        "parallel parenting",
        "ruzie voorkomen co ouders",
        "co parenting afspraken",
        "hoog conflict scheiding"
      ],
      canonicalPath: "/blog/effectieve-communicatie-met-je-co-ouder",
      ogTitle: "Effectieve communicatie met je co-ouder",
      ogDescription: "Met BIFF-berichten, voorbeeldzinnen en afspraken die escalatie voorkomen.",
      ogImage: "https://images.pexels.com/photos/5212317/pexels-photo-5212317.jpeg?auto=compress&cs=tinysrgb&w=1200"
    },

    contentMd: `
Goede communicatie is geen “extraatje” bij co-ouderschap. Het is de **snelste manier om stress bij kinderen te verlagen**: niet doordat ouders alles perfect doen, maar doordat conflicten minder vaak en minder heftig worden. Onderzoek en professionele richtlijnen wijzen er al jaren op dat **aanhoudend ouderconflict** een belangrijke risicofactor is voor de ontwikkeling van kinderen bij scheiding.

In dit artikel krijg je een aanpak die in de praktijk werkt,óók als jullie relatie stroef is.



## 1) Maak communicatie kleiner (en dus veiliger)

Veel misverstanden ontstaan omdat alles door elkaar loopt:
- opvoedvisie
- oude relatiepijn
- geld
- planning
- verwijten

**Knip het op.** Spreek af dat jullie communicatie in 90% van de gevallen alleen gaat over:
1. planning/logistiek  
2. school & zorg  
3. bijzonderheden (ziekte, afspraken, incidenten)

Alles daarbuiten = niet via app, maar via een vast moment (maandelijks) of via hulp/mediator als dat nodig is.



## 2) Gebruik de BIFF-methode voor lastige berichten

BIFF is een eenvoudige richtlijn voor berichten die anders escaleren:

- **Brief**: kort, geen verhaal
- **Informative**: alleen feiten + concreet verzoek
- **Friendly**: neutraal vriendelijk (geen sarcasme)
- **Firm**: duidelijke afronding, geen eindeloze discussie

### Voorbeeld 1: wisselmoment
**Niet BIFF:**  
“Je bent altijd te laat, dit is echt asociaal. Ik ben er klaar mee.”

**BIFF:**  
“Hoi, ik sta morgen om 17:00 bij de overdracht. Lukt het jou om er uiterlijk 17:10 te zijn? Dan kan [naam kind] op tijd eten. Dankjewel.”

### Voorbeeld 2: vergeten spullen
“Bij mij ligt nog de gymtas. Ik geef ’m maandag mee naar school. Als jij wilt, kan je ’m ook zondag 19:00 ophalen.”

Klaar. Geen oordeel. Wel oplossing.



## 3) Kies één kanaal + één ‘reactietermijn’

Veel gedoe ontstaat doordat mensen:
- via 5 apps communiceren
- direct antwoord verwachten
- blijven pushen

Spreek af:
- **één kanaal** (bijv. e-mail of co-ouder app)
- **standaard reactietermijn** (bijv. 24 of 48 uur)
- uitzonderingen: **medisch / urgent** = bellen

Dit haalt emotie uit het systeem.



## 4) Grenzen zonder oorlog: “ik reageer op inhoud, niet op toon”

Als je co-ouder verwijtend is, reageer je op de **vraag**, niet op de **lading**.

**Script:**
“Dank je. Ik reageer op de praktische vraag: [antwoord]. Voor de rest houd ik het bij afspraken uit het ouderschapsplan.”

Herhaalbaar. Saai. En dat is precies de bedoeling.


## 5) Maak escalatie minder waarschijnlijk: vaste formats

### A) Format voor planning
- Datum:
- Tijd:
- Locatie:
- Wie brengt/haalt:
- Extra info (max 1 zin):

### B) Format voor medische updates
- Klacht/symptoom:
- Actie (huisarts/medicatie):
- Afspraak/uitslag:
- Wat moet de andere ouder weten/doen:

Hoe “droger” het format, hoe minder ruimte voor strijd.



## 6) Wanneer co-ouderschap niet werkt: parallel parenting

Soms is intensief overleg niet realistisch. Dan kan **parallel parenting** tijdelijk of langdurig beter zijn: minimaal contact, maximale duidelijkheid in afspraken.

Kern:
- ieder huishouden eigen regels (binnen redelijke bandbreedte)
- afspraken zo concreet mogelijk (wie/wat/wanneer)
- communicatie vooral schriftelijk en zakelijk

Het doel is niet “gezellig samenwerken”, maar **conflict-demping**.



## 7) Mini-checklist: doe dit deze week

1. Kies één kanaal (e-mail/app).  
2. Spreek reactietermijn af.  
3. Gebruik BIFF bij elk lastig bericht.  
4. Zet 3 onderwerpen op “alleen in maandelijkse check-in”.  
5. Maak een standaard format voor planning.



## Veelgestelde vraag: “Maar ik wil dat de ander inziet dat hij/zij fout zit”

Begrijpelijk. Alleen: in co-ouderschap werkt “gelijk krijgen” zelden. **Rust en voorspelbaarheid** zijn voor kinderen meestal waardevoller dan winnen.



## Bronnen (voor je bronvermelding pagina)
Zie de ‘sources’ bij dit blogpost-object.
`,

    sources: [
      { title: "APA – Divorce and child custody (impact of conflict, distance, adjustment)", url: "https://www.apa.org/topics/divorce-child-custody" },
      { title: "OurFamilyWizard (PDF) – BIFF communication guideline", url: "https://www.ourfamilywizard.com/sites/default/files/media/file/2024-01/hntsad-exclusive-best-communicate-with-challenging-coparent.pdf" },
      { title: "High Conflict Institute – resources on high-conflict / parallel parenting", url: "https://www.highconflictinstitute.com/clear-court-orders-for-shared-parenting/" },
      { title: "Mahrer et al. (PMC) – review shared parenting & high conflict", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7986964/" }
    ]
  },

  {
    id: 2,
    slug: "co-ouderschap-regeling-opstellen",
    title: "Een co-ouderschap regeling opstellen",
    excerpt: "Van weekindeling tot financiën en communicatie: zo maak je afspraken die duidelijk, uitvoerbaar en kindgericht zijn.",
    author: "Mark Janssen",
    date: "2025-03-28",
    readTime: "8 min",
    category: "Regelingen",
    image: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800",

    seo: {
      title: "Co-ouderschap regeling opstellen: checklist + voorbeelden | Co-ouderschap Blog",
      description:
        "Stap-voor-stap een co-ouderschap regeling maken: weekrooster, halen/brengen, school, medische zorg, communicatie, feestdagen, en financiën. Inclusief checklist.",
      keywords: [
        "co-ouderschap regeling",
        "ouderschapsplan checklist",
        "zorgregeling opstellen",
        "omgangsregeling afspraken",
        "co ouderschapsplan voorbeelden",
        "feestdagen verdelen scheiding"
      ],
      canonicalPath: "/blog/co-ouderschap-regeling-opstellen",
      ogTitle: "Een co-ouderschap regeling opstellen",
      ogDescription: "Checklist + praktische voorbeeldafspraken die ruzie voorkomen.",
      ogImage: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1200"
    },

    contentMd: `
Een regeling werkt pas als hij **duidelijk, haalbaar en kindgericht** is. In Nederland is een **ouderschapsplan** bij minderjarige kinderen vaak verplicht bij scheiden, en daarin leg je die afspraken vast.

Hieronder krijg je een praktische opbouw waarmee je niets vergeet.



## 1) Start met het doel: voorspelbaarheid voor het kind

Een kind heeft vooral baat bij:
- vaste ritmes
- duidelijke overdrachtmomenten
- weinig verrassingen
- ouders die conflicten uit de overdracht houden

Je regeling is dus in de eerste plaats een **anti-ruzie document**.



## 2) Weekindeling: kies eenvoud boven perfectie

Veelgemaakte fout: te ingewikkeld schema (“om de week op woensdag anders…”).  
Beter:
- **2-2-5-5** (populair bij basisschool)
- **week-op-week-af** (rust voor oudere kinderen)
- **vaste wisseldag** (bijv. vrijdag na school)

### Leg dit altijd vast:
- exacte wisseldag + tijd
- wie brengt/haalt
- wat als school dicht is (studiedag)



## 3) Overdracht: maak het ‘saai’ (dat is goed)

**Best practice:**
- overdracht bij school/kinderopvang (minder contact nodig)
- of neutrale plek
- overdracht duurt max 2 minuten
- geen discussies waar kinderen bij zijn

Afspraken die veel gedoe voorkomen:
- kind is **ingepakt** (spullen klaar) vóór overdracht
- medicatie + informatie schriftelijk mee



## 4) Informatie & besluitvorming

Maak onderscheid tussen:
- **dagelijkse beslissingen** (binnen je eigen huishouden)
- **gezamenlijke beslissingen** (schoolkeuze, grote medische keuzes)

Schrijf letterlijk op:
- waar jullie elkaar over informeren (school, zorg, noodgevallen)
- binnen welke termijn
- via welk kanaal



## 5) Vakanties & feestdagen: zet alles in een tabel

Neem op:
- Kerst: wisselen per jaar of splitsen in 2 delen
- Pasen / Pinksteren
- verjaardagen kind (hoe doe je dat?)
- Moederdag/Vaderdag
- zomervakantie: verdeling + wanneer plannen (bijv. vóór 1 april)

Tip: leg vast dat “wie het eerst plant, het eerst meldt” niet de norm is. Beter: één planningsmoment per jaar.



## 6) Geldzaken (kort maar concreet)

Bij co-ouderschap maken beide ouders kosten. Leg vast:
- welke kosten ieder zelf betaalt (eten, dagelijkse dingen)
- welke kosten gedeeld zijn (school, sport, kleding, zorgkosten)
- hoe je verrekent (maandelijks, per kwartaal)
- hoe je bonnetjes deelt (één map, één format)
- wat je doet bij grote uitgaven (vóóraf akkoord boven €X)

Nibud geeft praktische handvatten voor co-ouderschap en kostenverdeling.



## 7) Conflictoplossing: wat doen jullie als er gedoe is?

Zonder escalatiepad ga je vanzelf escaleren.

Zet erin:
1) eerst schriftelijk (BIFF)  
2) dan (video)gesprek van max 30 min met agenda  
3) lukt het niet: mediator / ouderschapsbemiddeling



## 8) Checklist (kopiëren-plakken)

- [ ] weekindeling + wisseltijden  
- [ ] halen/brengen + studiedagen  
- [ ] schoolafspraken + contact school  
- [ ] medische zorg + toestemming + medicatie  
- [ ] communicatiekanaal + reactietermijn  
- [ ] vakanties/feestdagen tabel  
- [ ] financiële afspraken + drempelbedrag  
- [ ] escalatiepad (bemiddeling)  



## Bronnen
Zie ‘sources’ in dit object.
`,

    sources: [
      { title: "Rijksoverheid – Wat moet er in een ouderschapsplan staan?", url: "https://www.rijksoverheid.nl/onderwerpen/scheiden/vraag-en-antwoord/ouderschapsplan" },
      { title: "Juridisch Loket – Ouderschapsplan opstellen (stappen & aandachtspunten)", url: "https://www.juridischloket.nl/familie-en-relatie/ouderschap/ouderschapsplan/" },
      { title: "Juridisch Loket – Omgangsregeling (ook vakanties/halen-brengen)", url: "https://www.juridischloket.nl/familie-en-relatie/ouderschap/omgangsregeling/" },
      { title: "Nibud – Co-ouderschap (kosten en afspraken)", url: "https://www.nibud.nl/onderwerpen/scheiden/co-ouderschap/" }
    ]
  },

  {
    id: 3,
    slug: "overgang-tussen-twee-huizen-makkelijker-maken",
    title: "De overgang tussen huizen makkelijker maken",
    excerpt: "Praktische routines, dubbele spullen en emotionele check-ins: zo help je je kind soepel schakelen tussen twee woonomgevingen.",
    author: "Lisa van Dam",
    date: "2025-03-10",
    readTime: "7 min",
    category: "Kinderen",
    image: "https://images.pexels.com/photos/4473864/pexels-photo-4473864.jpeg?auto=compress&cs=tinysrgb&w=800",

    seo: {
      title: "Overgang tussen twee huizen bij co-ouderschap: 12 praktische tips",
      description:
        "Hoe help je je kind bij het wisselen tussen twee huizen? Routines, overdrachtsmomenten, een heen-en-weer tas, schoolspullen, emoties en wat je beter kunt vermijden.",
      keywords: [
        "overgang tussen twee huizen",
        "co-ouderschap kind wissel",
        "kinderen scheiding routines",
        "tas met spullen co ouders",
        "emoties kind scheiding"
      ],
      canonicalPath: "/blog/overgang-tussen-twee-huizen-makkelijker-maken",
      ogTitle: "De overgang tussen huizen makkelijker maken",
      ogDescription: "Routines, dubbele spullen en check-ins voor minder stress bij kinderen.",
      ogImage: "https://images.pexels.com/photos/4473864/pexels-photo-4473864.jpeg?auto=compress&cs=tinysrgb&w=1200"
    },

    contentMd: `
Voor veel kinderen is het “wisselmoment” het lastigste onderdeel van co-ouderschap. Niet omdat het altijd dramatisch is, maar omdat het **mentaal schakelen** vraagt: andere bedtijden, andere regels, andere sfeer.

Het goede nieuws: met een paar simpele systemen maak je de overgang merkbaar rustiger.



## 1) Maak de overgang voorspelbaar

Kinderen ontspannen wanneer ze weten:
- wanneer ze gaan
- wie ze brengt/haalt
- hoe laat
- wat er gebeurt als het anders loopt

Zet daarom een vast ritueel neer (klein, herhaalbaar):
- jas aan
- 1 knuffel/voorwerp mee
- “3 dingen check”: tas, sleutels, medicatie
- korte goodbye (geen lange gesprekken)



## 2) De ‘heen-en-weer tas’ (maar dan slim)

Veel stress is praktisch: “Shit… dat ligt in het andere huis.”

Werk met:
- **een vaste tas** (blijft altijd dezelfde)
- **een vaste checklist** (papier of app)
- **een vaste plek** in huis waar de tas staat

Extra tip: maak een aparte **sporttas** die niet gemixt raakt met schooltas.



## 3) Dubbele spullen = minder conflict

Als budget het toelaat:
- tandenborstel + pyjama dubbel
- oplader dubbel
- basis kleding dubbel
- schoolspullen waar mogelijk dubbel

Doel: minder “terugsturen” en minder discussies.



## 4) Emotionele check-in van 60 seconden

Niet ondervragen, wel verbinding.

Voorbeeldvragen:
- “Hoe zit je energie vandaag: laag, midden of hoog?”
- “Is er iets dat je nog even wilt vertellen vóór we gaan?”
- “Wat heb je vandaag nodig van mij?”

Kort. Veilig. Kind voelt zich gezien.



## 5) Houd kinderen uit de ‘ouder-telefooncentrale’

Regel: kinderen zijn niet verantwoordelijk voor:
- afspraken doorgeven
- geldzaken
- verwijten
- onderhandeling

Alles via jullie kanaal, niet via het kind.



## 6) Wisselen bij school werkt vaak rustiger

Overdracht bij school/kinderopvang:
- minder emotie
- minder contact
- kind zit al in “bewegingsmodus”

Als dat niet kan: neutrale plek en kort houden.



## 7) Wat je beter niet doet bij overdracht

- discussies starten (“we moeten het NU even hebben”)
- kind laten kiezen als er conflict is (“waar wil jij heen?”)
- sarcasme of steken onder water
- praten over de andere ouder in negatieve termen

Als er spanning is: plan een apart moment (zonder kinderen).



## 8) Als je kind terugvalt in gedrag (dat kan normaal zijn)

Bij wissels kun je zien:
- boosheid
- huilen
- druk gedrag
- teruggetrokken zijn

Blijf bij het simpele:
- structuur
- slaap
- eten
- voorspelbaarheid
- korte check-ins

En: houd school/BSO op de hoogte als dat helpt.



## 9) 12 snelle tips (printbaar)

1. vaste wisseldag/tijd  
2. vaste tas + checklist  
3. dubbele basis spullen  
4. sporttas apart  
5. 60 sec check-in  
6. wissel bij school (als kan)  
7. overdracht max 2 minuten  
8. geen discussies waar kind bij is  
9. 1 kanaal voor ouders  
10. kind niet als boodschapper  
11. vaste plek in huis voor spullen  
12. plan B bij ziekte/studiedag  



## Bronnen
Zie ‘sources’ in dit object.
`,

    sources: [
      { title: "APA – Divorce and child custody (kinderen en welzijn; stressfactoren)", url: "https://www.apa.org/topics/divorce-child-custody" },
      { title: "Scheidingskoffer (BE) – Leven in twee huizen: praktische organisatie", url: "https://www.scheidingskoffer.be/overzicht/ouders/leven-in-twee-huizen-hoe-organiseren-we-dat-praktisch" }
    ]
  },

  {
    id: 4,
    slug: "omgaan-met-feestdagen-en-vakanties",
    title: "Omgaan met feestdagen en vakanties",
    excerpt: "Voorkom jaarlijks gedoe: zo verdeel je feestdagen en vakanties eerlijk, duidelijk en kindgericht (met voorbeeldschema’s).",
    author: "Tom Hendriksen",
    date: "2025-02-20",
    readTime: "9 min",
    category: "Planning",
    image: "https://images.pexels.com/photos/6393342/pexels-photo-6393342.jpeg?auto=compress&cs=tinysrgb&w=800",

    seo: {
      title: "Feestdagen en vakanties verdelen bij co-ouderschap (voorbeelden + tips)",
      description:
        "Praktische afspraken voor Kerst, Oud & Nieuw, verjaardagen en vakanties bij co-ouderschap. Met voorbeeldschema’s, deadlines en regels die ruzie voorkomen.",
      keywords: [
        "feestdagen verdelen co ouders",
        "vakantie planning co-ouderschap",
        "kerst verdeling scheiding",
        "zorgregeling feestdagen",
        "ouderschapsplan feestdagen"
      ],
      canonicalPath: "/blog/omgaan-met-feestdagen-en-vakanties",
      ogTitle: "Omgaan met feestdagen en vakanties",
      ogDescription: "Voorbeeldschema’s en afspraken die jaarlijks conflict voorkomen.",
      ogImage: "https://images.pexels.com/photos/6393342/pexels-photo-6393342.jpeg?auto=compress&cs=tinysrgb&w=1200"
    },

    contentMd: `
Feestdagen zijn emotioneel beladen. En precies daarom moet je ze **juist extra saai en voorspelbaar** regelen. Niet op gevoel, maar op papier.



## 1) De drie regels voor rustige feestdagen

1. **Leg alles vóór het seizoen vast** (niet in december pas beginnen).  
2. **Werk met herhaalbare patronen** (odd/even jaren).  
3. **Kind eerst, “eerlijk voor ouders” daarna.**



## 2) Kies een model (en houd het simpel)

### Model A: om-en-om per jaar (odd/even)
- Kerst 2026 bij ouder A, 2027 bij ouder B
- Oud & Nieuw andersom

Voordeel: super duidelijk.  
Nadeel: je mist soms twee jaar achter elkaar een deelmoment (als je niet splitst).

### Model B: splitsen in 2 blokken
- Kerstavond + 1e kerstdag bij ouder A
- 2e kerstdag bij ouder B

Voordeel: kind ziet beide ouders.  
Nadeel: meer reizen / meer overdrachten.

### Model C: tradities verdelen
Bijv.:
- Sinterklaas altijd bij ouder A
- Kerst altijd bij ouder B
- Oud & Nieuw om-en-om

Voordeel: vaste traditie.  
Nadeel: kan “oneerlijk” voelen, dus alleen doen als dit echt past.



## 3) Zomervakantie: deadlines voorkomen strijd

Spreek één harde regel af:
- vóór **1 april**: wensen uitwisselen
- vóór **1 mei**: definitieve planning
- daarna: alleen wijzigen bij noodzaak

Zet ook:
- max aaneengesloten weken bij één ouder (bijv. 2 of 3)
- wie boekt wat
- toestemming buitenland / paspoort



## 4) Verjaardagen: kies wat haalbaar is

Opties:
- samen vieren (alleen als dat echt kan)
- kind viert 2x (prima, als het kind dat oké vindt)
- één ouder organiseert, andere ouder komt 1 uur langs (kort, kindgericht)

Leg ook vast:
- cadeaus: wel/geen afstemming
- schooltraktatie: wie regelt



## 5) Wat je altijd in je plan zet

- exacte tijden van wissel op feestdagen  
- wat als het kind ziek is  
- hoe je omgaat met familiebezoek (opa/oma)  
- communicatie: één kanaal, BIFF-stijl  



## 6) Mini-template: feestdagen tabel

| Moment | Jaar oneven | Jaar even | Wisseltijd |
|---|---|---|---|
| Kerst | ouder A | ouder B | 26 dec 12:00 |
| Oud & Nieuw | ouder B | ouder A | 1 jan 12:00 |
| Pasen | om-en-om | om-en-om | 2e dag 18:00 |

Klaar. Iedereen weet waar hij aan toe is.


## Bronnen
Zie ‘sources’ in dit object.
`,

    sources: [
      { title: "Juridisch Loket – Omgangsregeling: ook afspraken over vakanties/halen-brengen", url: "https://www.juridischloket.nl/familie-en-relatie/ouderschap/omgangsregeling/" },
      { title: "Merel Family Law – omgaan met feestdagen na scheiding (planning & opnemen in plan)", url: "https://merelfamilylaw.com/nl/blog/how-to-handle-holidays-and-special-occasions-after-divorce/" }
    ]
  },

  {
    id: 5,
    slug: "nieuwe-partners-introduceren",
    title: "Nieuwe partners introduceren",
    excerpt: "Wanneer is het ‘het juiste moment’? En hoe doe je dit rustig, met respect voor je kind én minimale spanning met je co-ouder?",
    author: "Emma Bakker",
    date: "2025-02-02",
    readTime: "8 min",
    category: "Relaties",
    image: "https://images.pexels.com/photos/3094215/pexels-photo-3094215.jpeg?auto=compress&cs=tinysrgb&w=800",

    seo: {
      title: "Nieuwe partner introduceren na scheiding: stappenplan voor co-ouders",
      description:
        "Rustig en kindgericht je nieuwe partner introduceren: timing, voorbereiding, eerste ontmoeting, grenzen, rol van stiefouder en communicatie met je co-ouder.",
      keywords: [
        "nieuwe partner introduceren kinderen",
        "stiefouder tips",
        "samengesteld gezin",
        "co-ouderschap nieuwe relatie",
        "kinderen scheiding nieuwe partner"
      ],
      canonicalPath: "/blog/nieuwe-partners-introduceren",
      ogTitle: "Nieuwe partners introduceren",
      ogDescription: "Timing, tact en een rustig stappenplan voor kinderen én co-ouders.",
      ogImage: "https://images.pexels.com/photos/3094215/pexels-photo-3094215.jpeg?auto=compress&cs=tinysrgb&w=1200"
    },

    contentMd: `
Nieuwe liefde en co-ouderschap kan prima samengaan, maar de introductie is een gevoelig moment. Niet omdat het “fout” is, maar omdat kinderen vaak denken: *“Wordt alles nu weer anders?”*

Hier is een aanpak die rust creëert.



## 1) Eerst stabiliteit, dan introduceren

Vraag jezelf af:
- is deze relatie stabiel genoeg om “echt” te worden in het leven van je kind?
- voelt je kind zich momenteel al redelijk veilig in de basis (ritme, wonen, school)?
- is er veel conflict met de andere ouder?

Als er hoge spanning is, kan het helpen om eerst te werken aan voorspelbaarheid (schema/communicatie) vóór je een extra verandering toevoegt.



## 2) Informeer je co-ouder (kort, feitelijk)

Je hoeft geen toestemming te vragen voor liefde, maar **voorkom verrassingen**.

BIFF-bericht voorbeeld:
“Even ter info: ik heb een nieuwe partner. De kinderen ontmoeten haar/hem rustig en stap voor stap. Ik houd de routine aan. Als er iets praktisch is dat je moet weten, laat ik het weten.”



## 3) De eerste ontmoeting: klein en kort

Beste setting:
- neutrale activiteit (ijsje, speeltuin, korte wandeling)
- max 60–90 minuten
- geen ‘gezinsfoto’-moment
- geen gesprekken over de scheiding

Doel: *veilig en normaal*.



## 4) Rolhelderheid: nieuwe partner is niet meteen opvoeder

Veel samengestelde gezinnen lopen vast op rolverwarring:
- nieuwe partner neemt te snel de ouderrol
- kind voelt zich loyaal aan biologische ouder
- ex-partner voelt zich gepasseerd

Start met:
- vriendelijk, geïnteresseerd, rustig
- opvoedbeslissingen blijven bij de ouder
- nieuwe partner ondersteunt, maar “stuurt” niet



## 5) Let op loyaliteitsconflict bij kinderen

Zinnen die helpen:
- “Je hoeft niet te kiezen.”
- “Je mag papa/mama altijd blijven missen.”
- “Jij bepaalt je tempo.”

En: praat niet slecht over de andere ouder. Dat zet kinderen klem.



## 6) Als de co-ouder boos reageert

Blijf op het pad:
- geen verdedigen
- geen details
- wel rust en grenzen

Script:
“Ik begrijp dat dit emoties oproept. Ik houd het praktisch en kindgericht. Als er een concreet punt is over planning of veiligheid, hoor ik het graag.”



## 7) Stappenplan in 4 fases

1. **Voorbereiden** (met kind praten, tempo bepalen)  
2. **Kennismaken** (kort, neutraal)  
3. **Opbouwen** (vaker, maar nog niet ‘samen wonen’)  
4. **Integreren** (rollen, afspraken, routines)



## Bronnen
Zie ‘sources’ in dit object.
`,

    sources: [
      { title: "NJi – Hoe ga ik om met mijn stiefkind? (rol, tips, verwachtingen)", url: "https://www.nji.nl/kennis/scheiding/hoe-ga-ik-om-met-mijn-stiefkind" },
      { title: "Richtlijnen Jeugdhulp – Scheiding: nieuwe gezinsverhoudingen (introduceren partner, signaleren kind)", url: "https://www.richtlijnenjeugdhulp.nl/scheiding/contactopbouw-en-signalering/nieuwe-gezinsverhoudingen" },
      { title: "Kenniscentrum Kind en Scheiding – Tips voor samengestelde gezinnen (stiefcoaches)", url: "https://www.kenniscentrumkindenscheiding.nl/onderwerp/samengestelde-gezinnen/stiefcoaches-geven-tips-aan-samengestelde-gezinnen/" }
    ]
  },

  {
    id: 6,
    slug: "financiele-afspraken-in-co-ouderschap",
    title: "Financiële afspraken in co-ouderschap",
    excerpt: "Zo verdeel je kosten eerlijk en voorkom je discussies: met categorieën, drempelbedragen, verrekenen en een simpel systeem voor bonnetjes.",
    author: "David Peters",
    date: "2025-01-15",
    readTime: "8 min",
    category: "Financiën",
    image: "https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg?auto=compress&cs=tinysrgb&w=800",

    seo: {
      title: "Financiële afspraken bij co-ouderschap: kosten verdelen zonder ruzie",
      description:
        "Praktisch model om kinderkosten te verdelen bij co-ouderschap: vaste en variabele kosten, kinderbijslag, kindgebonden budget, drempelbedrag en verrekenmoment.",
      keywords: [
        "kosten verdelen co-ouderschap",
        "financiële afspraken scheiding",
        "kinderkosten co ouders",
        "kinderbijslag kindgebonden budget co ouders",
        "Nibud co-ouderschap"
      ],
      canonicalPath: "/blog/financiele-afspraken-in-co-ouderschap",
      ogTitle: "Financiële afspraken in co-ouderschap",
      ogDescription: "Eerlijk verdelen, simpel verrekenen en discussies voorkomen met één systeem.",
      ogImage: "https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg?auto=compress&cs=tinysrgb&w=1200"
    },

    contentMd: `
Geld is vaak de snelste trigger voor conflict. Niet omdat ouders “gierig” zijn, maar omdat afspraken vaag zijn. Met een helder systeem haal je emotie weg.



## 1) Spreek eerst de basis af: wat is ‘eigen’ en wat is ‘samen’?

### Eigen kosten (ieder huishouden)
- boodschappen / dagelijkse verzorging
- normale uitstapjes in eigen tijd
- kleine kleding (als je dat zo afspreekt)

### Samen te delen kosten
- schoolkosten / ouderbijdrage / laptops
- sport + contributie
- grotere kleding / schoenen
- zorgkosten die niet vergoed worden
- kinderopvang (afhankelijk van situatie)



## 2) Kies één verrekenmethode

### Methode A: 50/50 op gedeelde kosten
Simpel, maar alleen “eerlijk” als inkomens vergelijkbaar zijn.

### Methode B: naar draagkracht (bijv. 60/40)
Vaak realistischer. Spreek dan ook af:
- hoe vaak je herijkt (1x per jaar)
- welke inkomensbasis je gebruikt (netto/jaaropgave)



## 3) Zet er een drempelbedrag in

Om discussies over elke bon te voorkomen:
- Alles onder €X: ieder betaalt zelf in eigen tijd.
- Alles boven €X: vooraf overleg + akkoord.

Bijv. €25 of €50 werkt vaak goed.



## 4) Maak één bonnetjes-systeem

- één gedeelde map (Drive/OneDrive)
- vaste bestandsnaam: \`2026-02-12_sportcontributie_45e\`
- één moment per maand verrekenen (bijv. elke 1e)

Hoe minder ad-hoc appjes, hoe minder strijd.



## 5) Kinderbijslag en kindgebonden budget

Leg vast:
- wie ontvangt wat
- hoe je dat verwerkt in de kostenverdeling

Dit is vaak een bron van misverstanden. Zet het dus zwart op wit.



## 6) Als inkomens ongelijk zijn: alimentatie kan nog steeds spelen

Ook bij co-ouderschap kan er sprake zijn van kinderalimentatie als de draagkracht en kostenverdeling scheef liggen. Juridisch Loket en Nibud geven hierover laagdrempelig uitleg.



## 7) Mini-template (kopiëren)

**Gedeelde kosten:** school, sport, zorg, opvang, grote kleding  
**Verdeling:** 60/40 (A/B)  
**Drempel:** boven €50 vooraf akkoord  
**Verrekening:** maandelijks op de 1e  
**Bonnetjes:** gedeelde map + vaste naamgeving  
**Budgetten:** kinderbijslag naar ouder A, kindgebonden budget naar ouder B, verrekend in maandstaat



## Bronnen
Zie ‘sources’ in dit object.
`,

    sources: [
      { title: "Nibud – Co-ouderschap (kosten, afspraken, verdelen)", url: "https://www.nibud.nl/onderwerpen/scheiden/co-ouderschap/" },
      { title: "Juridisch Loket – Co-ouderschap (afspraken + alimentatie bij verschil inkomen)", url: "https://www.juridischloket.nl/familie-en-relatie/ouderschap/co-ouderschap/" },
      { title: "Nibud – Alimentatie (basisinformatie bij scheiding)", url: "https://www.nibud.nl/onderwerpen/scheiden/alimentatie/" },
      { title: "Kenniscentrum Kind en Scheiding – financiële informatie (verwijst o.a. naar Nibud handvatten)", url: "https://www.kenniscentrumkindenscheiding.nl/onderwerp/financiele-informatie/" }
    ]
  }
];

