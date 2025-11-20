import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const BrixInfoPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#115DA8] to-[#1e88e5] text-white p-6 shadow-lg">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t('brix.back')}</span>
        </button>
        <h1 className="text-3xl font-bold">{t('brix.title')}</h1>
      </div>

      <div className="px-4 py-6 space-y-8">
        {/* Introduction */}
        <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
          <p className="text-lg text-gray-700 leading-relaxed">
            <strong>{t('brix.intro1')}</strong> {t('brix.intro1Detail')}
          </p>
          <p className="text-gray-700 leading-relaxed">
            {t('brix.intro2')}
          </p>
          <p className="text-gray-700 leading-relaxed">
            {t('brix.intro3')}
          </p>
        </div>

        {/* Brix Values Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-[#115DA8] to-[#1e88e5] text-white p-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              🧊 {t('brix.tableTitle')}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b w-[30%]">{t('brix.tableHeaderType')}</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 border-b w-[20%]">{t('brix.tableHeaderBrix')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b w-[50%]">{t('brix.tableHeaderComment')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* Klassisk slushice */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-800 font-medium">
                    {t('brix.typeClassic')}<br />
                    <span className="text-sm text-gray-500">{t('brix.typeClassicSub')}</span>
                  </td>
                  <td className="px-6 py-4 bg-cyan-500 text-white text-center font-bold whitespace-nowrap">
                    12 – 15 °Bx
                  </td>
                  <td className="px-6 py-4 text-gray-700">{t('brix.typeClassicComment')}</td>
                </tr>

                {/* Juice-baseret */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-800 font-medium">{t('brix.typeJuice')}</td>
                  <td className="px-6 py-4 bg-cyan-500 text-white text-center font-bold whitespace-nowrap">
                    11 – 13 °Bx
                  </td>
                  <td className="px-6 py-4 text-gray-700">{t('brix.typeJuiceComment')}</td>
                </tr>

                {/* Sodavands-slush */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-800 font-medium">
                    {t('brix.typeSoda')}<br />
                    <span className="text-sm text-gray-500">{t('brix.typeSodaSub')}</span>
                  </td>
                  <td className="px-6 py-4 bg-cyan-500 text-white text-center font-bold whitespace-nowrap">
                    10 – 12 °Bx
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {t('brix.typeSodaComment')}
                  </td>
                </tr>

                {/* Smoothie/milkshake */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-800 font-medium">
                    {t('brix.typeSmoothie')}
                  </td>
                  <td className="px-6 py-4 bg-cyan-500 text-white text-center font-bold whitespace-nowrap">
                    13 – 16 °Bx
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {t('brix.typeSmoothieComment')}
                  </td>
                </tr>

                {/* Alkohol-slush */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-800 font-medium">
                    {t('brix.typeAlcohol')}<br />
                    <span className="text-sm text-gray-500">{t('brix.typeAlcoholSub')}</span>
                  </td>
                  <td className="px-6 py-4 bg-cyan-500 text-white text-center font-bold whitespace-nowrap">
                    14 – 18 °Bx
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {t('brix.typeAlcoholComment')}
                  </td>
                </tr>

                {/* Sukkerfri */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-800 font-medium">{t('brix.typeSugarFree')}</td>
                  <td className="px-6 py-4 bg-gray-400 text-white text-center font-bold whitespace-nowrap">
                    0 – 3 °Bx
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {t('brix.typeSugarFreeComment')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl shadow-md p-6 border-l-4 border-amber-400">
          <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
            💡 {t('brix.proTipsTitle')}
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-1">•</span>
              <span>{t('brix.tip1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-1">•</span>
              <span>{t('brix.tip2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-1">•</span>
              <span>{t('brix.tip3')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-1">•</span>
              <span>{t('brix.tip4')}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BrixInfoPage;
