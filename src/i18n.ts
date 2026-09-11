import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import it from './locales/it.json';
import en from './locales/en.json';

// Detect language: check localStorage first, then browser language, then IP geolocation
const detectLanguage = (): string => {
  // 1. Check localStorage for saved preference
  const saved = localStorage.getItem('flywaters_lang');
  if (saved === 'it' || saved === 'en') return saved;

  // 2. Check browser language
  const browserLang = navigator.language?.toLowerCase();
  if (browserLang?.startsWith('it')) {
    localStorage.setItem('flywaters_lang', 'it');
    return 'it';
  }

  // 3. Default to English for non-Italian browsers, but also try IP geolocation
  fetchGeoLanguage();
  
  // Default to English while geo loads
  return 'en';
};

// Async IP geolocation check (runs in background on first visit)
const fetchGeoLanguage = async () => {
  try {
    const saved = localStorage.getItem('flywaters_lang');
    if (saved) return; // Already resolved

    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    
    if (data.country_code === 'IT') {
      localStorage.setItem('flywaters_lang', 'it');
      i18n.changeLanguage('it');
      document.documentElement.lang = 'it';
    } else {
      localStorage.setItem('flywaters_lang', 'en');
      i18n.changeLanguage('en');
      document.documentElement.lang = 'en';
    }
  } catch {
    // Silently fail - keep current language
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      it: { translation: it },
      en: { translation: en },
    },
    lng: detectLanguage(),
    fallbackLng: 'it',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
