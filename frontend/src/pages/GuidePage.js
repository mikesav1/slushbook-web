import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  FaArrowLeft, 
  FaBook, 
  FaMagic, 
  FaShoppingCart, 
  FaCog,
  FaRocket,
  FaQuestionCircle,
  FaLightbulb,
  FaTint,
  FaChartLine
} from 'react-icons/fa';

const GuidePage = () => {
  const { t } = useTranslation();
  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link 
          to="/settings" 
          className="text-cyan-600 hover:text-cyan-700 flex items-center gap-2"
        >
          <FaArrowLeft /> Tilbage til Indstillinger
        </Link>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <h1 className="text-4xl font-bold mb-4 text-gray-800 flex items-center gap-3">
          <FaBook className="text-cyan-600" /> Vejledning til SLUSHBOOK
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Kom godt i gang med SLUSHBOOK og lær at bruge alle funktionerne
        </p>

        {/* Quick Start */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FaRocket className="text-cyan-600" /> Hurtig Start
          </h2>
          <div className="space-y-3 text-gray-700">
            <p>
              <strong>Ny bruger?</strong> Opret en gratis konto for at gemme favoritter og tilføje egne opskrifter.
            </p>
            <p>
              <strong>Pro bruger?</strong> Du har ubegrænset adgang til alle opskrifter og funktioner.
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FaBook className="text-cyan-600" /> Opskrifter
          </h2>
          <div className="space-y-4 text-gray-700 ml-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Find opskrifter</h3>
              <p>Gå til "Opskrifter" i menuen og brug filtrene til at finde præcis det, du leder efter:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Filtrer efter type (slush, smoothie, cocktail, osv.)</li>
                <li>Vælg med eller uden alkohol</li>
                <li>Søg på navn eller ingredienser</li>
                <li><strong>🆕 Avanceret søgning:</strong> Inkluder/ekskluder specifikke ingredienser</li>
                <li><strong>🆕 Allergenfiltre:</strong> Hurtigvalg for mælk, nødder, gluten, citrus, m.m.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">🆕 Kommentarer og anmeldelser</h3>
              <p>Del dine erfaringer med andre brugere:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Bedøm opskrifter med stjerner (1-5)</li>
                <li>Skriv kommentarer og tips til andre</li>
                <li>Se hvad andre synes om opskrifterne</li>
                <li>PRO brugere kan kommentere ubegrænset</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">🆕 Se forfattere</h3>
              <p>
                På opskriftskort kan du se forfatterens initialer. Klik på forfatternavnet på detaljesiden for at se deres profil og andre opskrifter.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Skalering</h3>
              <p>
                Hver opskrift kan automatisk skaleres til den mængde, du har brug for. 
                Klik på en opskrift, og brug skaleringsværktøjet til at justere volumenet.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Tilføj egne opskrifter</h3>
              <p>
                Gratis brugere kan tilføje op til 2 opskrifter. Pro brugere har ubegrænset adgang.
              </p>
              
              {/* Copyright Notice */}
              <div className="mt-4 bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h4 className="font-bold text-amber-900 mb-2">Vigtigt om billeder og copyright</h4>
                    <p className="text-sm text-amber-800 mb-2">
                      Når du uploader billeder til dine opskrifter, skal du være opmærksom på følgende:
                    </p>
                    <ul className="list-disc pl-5 text-sm text-amber-800 space-y-1">
                      <li><strong>Brug kun egne billeder</strong> eller billeder du har rettighederne til</li>
                      <li>Du må <strong>ikke</strong> uploade billeder fra internettet uden tilladelse fra rettighedshaveren</li>
                      <li>Når du gør en opskrift <strong>offentlig</strong>, skal du bekræfte at du har rettighederne til billedet</li>
                      <li>Private opskrifter kræver ingen særlig bekræftelse</li>
                    </ul>
                    <p className="text-xs text-amber-700 mt-3 italic">
                      Ved at dele opskrifter med egne billeder beskytter du både dig selv og SLUSHBOOK mod copyright-krænkelser.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Favorites and Ratings */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FaChartLine className="text-pink-600" /> Favoritter & Ratings
          </h2>
          <div className="space-y-4 text-gray-700 ml-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Gem favoritter</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Klik på ⭐ ikonet på en opskrift for at gemme den som favorit</li>
                <li>Gratis brugere: Op til 5 favoritter</li>
                <li>PRO brugere: Ubegrænsede favoritter</li>
                <li>Find alle dine favoritter ved at filtrere på "Kun favoritter" på opskriftssiden</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Bedøm opskrifter</h3>
              <p>Hjælp andre ved at bedømme opskrifter du har prøvet:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Giv 1-5 stjerner baseret på din oplevelse</li>
                <li>Kun PRO brugere kan bedømme</li>
                <li>Gennemsnitlig rating vises på hver opskrift</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Match Finder */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FaMagic className="text-purple-600" /> Match Finder
          </h2>
          <div className="space-y-3 text-gray-700 ml-4">
            <p>
              Match Finder hjælper dig med at finde opskrifter baseret på de ingredienser, du har derhjemme.
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Gå til "Match" i menuen</li>
              <li>Vælg de ingredienser, du har tilgængelige</li>
              <li>Se opskrifter sorteret efter hvor godt de matcher</li>
            </ol>
          </div>
        </section>

        {/* Shopping List */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FaShoppingCart className="text-green-600" /> Indkøbsliste
          </h2>
          <div className="space-y-3 text-gray-700 ml-4">
            <p>
              Opret en indkøbsliste direkte fra dine opskrifter:
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Åbn en opskrift</li>
              <li>Klik på "Tilføj til liste" ved de ingredienser, du mangler</li>
              <li>Gå til "Liste" i menuen for at se din samlede indkøbsliste</li>
              <li>Klik på købslinks for at købe direkte hos leverandører</li>
            </ol>
          </div>
        </section>

        {/* Settings */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FaCog className="text-gray-600" /> Maskiner & Indstillinger
          </h2>
          <div className="space-y-3 text-gray-700 ml-4">
            <p>
              Tilføj dine slush-maskiner under Indstillinger for at få automatisk skalering:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Angiv beholder størrelse (f.eks. 6L, 12L)</li>
              <li>Sæt tab-margin (typisk 5%)</li>
              <li>Opskrifter vil automatisk tilpasse sig din maskine</li>
            </ul>
          </div>
        </section>

        {/* BRIX */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FaTint className="text-blue-600" /> Hvad er BRIX?
          </h2>
          <div className="space-y-3 text-gray-700 ml-4">
            <p>
              BRIX er målet for sukkerindhold i din slushice. Det påvirker både frysepunkt og konsistens.
            </p>
            <div className="bg-cyan-50 p-4 rounded-lg mt-4">
              <p className="font-semibold mb-2">Tommelfingerregel:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>10-12 BRIX:</strong> Meget let, hurtig frysning (god til kolde dage)</li>
                <li><strong>13-15 BRIX:</strong> Standard (fungerer godt året rundt)</li>
                <li><strong>16-18 BRIX:</strong> Sød og cremet (god til varme dage)</li>
              </ul>
            </div>
            <p className="mt-3">
              <Link to="/brix-info" className="text-cyan-600 hover:underline">
                Læs mere om BRIX her →
              </Link>
            </p>
          </div>
        </section>

        {/* Tips & Tricks Community */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FaLightbulb className="text-yellow-600" /> 🆕 Community Forum (Tips & Tricks)
          </h2>
          <div className="space-y-4 text-gray-700 ml-4">
            <p>
              Deltag i SLUSHBOOK's community forum og del viden med andre brugere. 
              Forum dækker maskiner, produkter, rengøring, teknik og meget mere.
            </p>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">Sådan fungerer det:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Læs tips:</strong> Browse tips organiseret i kategorier (maskiner, produkter, rengøring, osv.)</li>
                <li><strong>Fold ud/ind:</strong> Klik på et tip for at læse hele indholdet</li>
                <li><strong>Kommenter:</strong> Svar på andres tips og stil spørgsmål (kun PRO)</li>
                <li><strong>Del viden:</strong> Opret dine egne tips med tekst og billeder (kun PRO)</li>
                <li><strong>Like:</strong> Giv hjertemarkeringer til nyttige tips (kun PRO)</li>
                <li><strong>Internationale tips:</strong> Slå "Inkl. internationale" til/fra for at se tips fra andre lande</li>
              </ul>
            </div>

            <div className="bg-cyan-50 p-4 rounded-lg mt-4">
              <p className="font-semibold mb-2">💡 Hurtige tips:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Gem dine favoritopskrifter ved at klikke på ⭐ på en opskrift</li>
                <li>Brug tags til at finde lignende opskrifter (f.eks. #sommer, #barn)</li>
                <li>Eksperimentér med farver - tilføj naturlige farvestoffer for sjov effekt</li>
                <li>Tilføj alkohol? Husk at BRIX skal justeres ned, da alkohol sænker frysepunkt</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mt-4">
              <p className="font-semibold text-yellow-900 mb-2">⚠️ Vigtigt om opslag</p>
              <p className="text-sm text-yellow-800">
                Tips publiceres øjeblikkeligt uden godkendelse. Som administrator kan vi slette upassende indlæg. 
                Vær respektfuld og del konstruktiv viden med fællesskabet.
              </p>
            </div>
          </div>
        </section>

        {/* Support */}
        <section className="mb-8 bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FaQuestionCircle className="text-cyan-600" /> Brug for hjælp?
          </h2>
          <p className="text-gray-700">
            Har du spørgsmål eller feedback? Kontakt os på{' '}
            <a href="mailto:support@slushbook.dk" className="text-cyan-600 hover:underline font-semibold">
              support@slushbook.dk
            </a>
          </p>
        </section>

        {/* Back Button */}
        <div className="pt-6 border-t border-gray-200">
          <Link 
            to="/settings"
            className="inline-flex items-center gap-2 text-cyan-600 hover:text-cyan-700 font-semibold"
          >
            <FaArrowLeft /> Tilbage til Indstillinger
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GuidePage;
