import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import da from './locales/da.json';
import de from './locales/de.json';
import en from './locales/en.json';
import en_us from './locales/en_us.json';
import fr from './locales/fr.json';

// Get saved language from localStorage
const savedLanguage = localStorage.getItem('user_language') || 'da';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      da: { translation: da },
      de: { translation: de },
      en: { translation: en },
      en_us: { translation: en_us },
      fr: { translation: fr },
    },
    lng: savedLanguage,
    fallbackLng: 'da',
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

// Make i18n available globally
window.i18n = i18n;

export default i18n;
