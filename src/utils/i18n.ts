import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from '@/locales/en/translation.json';
import translationVI from '@/locales/vi/translation.json';

const resources = {
  en: {
    translation: translationEN,
  },
  vi: {
    translation: translationVI,
  },
};

const savedLang = localStorage.getItem('app_lang') || 'vi';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
