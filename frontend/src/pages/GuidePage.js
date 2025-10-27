import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaBook, FaMagic, FaShoppingCart, FaCog } from 'react-icons/fa';

const GuidePage = () => {
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
        <h1 className="text-4xl font-bold mb-4 text-gray-800">
          📖 Vejledning til SLUSHBOOK
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Kom godt i gang med SLUSHBOOK og lær at bruge alle funktionerne
        </p>

        {/* Quick Start */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            🚀 Hurtig Start
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
              </ul>
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
          <h2 className="text-2xl font-bold mb-4">
            🧊 Hvad er BRIX?
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

        {/* Tips & Tricks */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            💡 Tips & Tricks
          </h2>
          <div className="space-y-3 text-gray-700 ml-4">
            <ul className="list-disc pl-6 space-y-2">
              <li>Gem dine favoritopskrifter ved at klikke på ⭐ på en opskrift</li>
              <li>Brug tags til at finde lignende opskrifter (f.eks. #sommer, #barn)</li>
              <li>Eksperimentér med farver - tilføj naturlige farvestoffer for sjov effekt</li>
              <li>Tilføj alkohol? Husk at BRIX skal justeres ned, da alkohol sænker frysepunkt</li>
            </ul>
          </div>
        </section>

        {/* Support */}
        <section className="mb-8 bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">
            ❓ Brug for hjælp?
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
