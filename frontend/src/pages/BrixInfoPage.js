import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BrixInfoPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#115DA8] to-[#1e88e5] text-white p-6 shadow-lg">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Tilbage</span>
        </button>
        <h1 className="text-3xl font-bold">Hvad Brix betyder</h1>
      </div>

      <div className="px-4 py-6 space-y-8">
        {/* Introduction */}
        <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
          <p className="text-lg text-gray-700 leading-relaxed">
            <strong>Brix = sukkerindhold i væsken målt i procent</strong> (1°Bx ≈ 1 g sukker pr. 100 g væske).
          </p>
          <p className="text-gray-700 leading-relaxed">
            Slushice-maskiner fryser ikke væsken til is; de rører konstant, så blandingen ligger lige på kanten af frysning.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Derfor afhænger det rigtige Brix-tal af hvor meget sukker (eller alkohol) der er i.
          </p>
        </div>

        {/* Brix Values Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-[#115DA8] to-[#1e88e5] text-white p-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              🧊 Ideelle Brix-værdier for slushice
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b w-[30%]">Type</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 border-b w-[20%]">Anbefalet Brix</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b w-[50%]">Kommentar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* Klassisk slushice */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-800 font-medium">
                    Klassisk slushice<br />
                    <span className="text-sm text-gray-500">(sirup + vand)</span>
                  </td>
                  <td className="px-6 py-4 bg-cyan-500 text-white text-center font-bold whitespace-nowrap">
                    12 – 15 °Bx
                  </td>
                  <td className="px-6 py-4 text-gray-700">Standard for de fleste maskiner.</td>
                </tr>

                {/* Juice-baseret */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-800 font-medium">Juice-baseret</td>
                  <td className="px-6 py-4 bg-cyan-500 text-white text-center font-bold whitespace-nowrap">
                    11 – 13 °Bx
                  </td>
                  <td className="px-6 py-4 text-gray-700">Indeholder naturligt frugtsukker.</td>
                </tr>

                {/* Sodavands-slush */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-800 font-medium">
                    Sodavands-slush<br />
                    <span className="text-sm text-gray-500">(cola, Fanta)</span>
                  </td>
                  <td className="px-6 py-4 bg-cyan-500 text-white text-center font-bold whitespace-nowrap">
                    10 – 12 °Bx
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    Skal ofte justeres, da sodavand er lidt for sukkerrig.
                  </td>
                </tr>

                {/* Smoothie/milkshake */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-800 font-medium">
                    Smoothie-/milkshake-slush
                  </td>
                  <td className="px-6 py-4 bg-cyan-500 text-white text-center font-bold whitespace-nowrap">
                    13 – 16 °Bx
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    Mælkesukker og frugt giver tykkere masse.
                  </td>
                </tr>

                {/* Alkohol-slush */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-800 font-medium">
                    Alkohol-slush<br />
                    <span className="text-sm text-gray-500">(fx rom, vodka)</span>
                  </td>
                  <td className="px-6 py-4 bg-cyan-500 text-white text-center font-bold whitespace-nowrap">
                    14 – 18 °Bx
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    Alkohol sænker frysepunktet, så du skal hæve Brix for at få den til at sætte sig.
                  </td>
                </tr>

                {/* Sukkerfri */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-800 font-medium">Sukkerfri (light)</td>
                  <td className="px-6 py-4 bg-gray-400 text-white text-center font-bold whitespace-nowrap">
                    0 – 3 °Bx
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    Fryser for hårdt, så du skal tilsætte glycerin, frugtsaft eller fortykningsmiddel for at undgå iskrystaller.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl shadow-md p-6 border-l-4 border-amber-400">
          <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
            💡 Pro Tips
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-1">•</span>
              <span>Start altid med det anbefalede Brix-tal for din type slushice</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-1">•</span>
              <span>Juster gradvist hvis konsistensen ikke er perfekt</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-1">•</span>
              <span>Højere Brix = tykkere slush, men også sødere smag</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-1">•</span>
              <span>Lavere Brix = mere flydende, lettere at drikke</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BrixInfoPage;
