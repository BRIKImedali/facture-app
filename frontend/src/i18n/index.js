// i18n/index.js — Configuration react-i18next pour le module admin
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importer les fichiers de traduction
import translationFR from './locales/fr/translation.json';
import translationEN from './locales/en/translation.json';

const resources = {
  fr: {
    translation: translationFR,
  },
  en: {
    translation: translationEN,
  },
};

i18n
  // Détecte la langue du navigateur
  .use(LanguageDetector)
  // Intègre i18next avec React
  .use(initReactI18next)
  .init({
    resources,
    // Langue par défaut si aucune détectée
    fallbackLng: 'fr',
    // Langue au démarrage (peut être surchargée par localStorage)
    lng: localStorage.getItem('i18nextLng') || 'fr',
    interpolation: {
      // React échappe déjà les valeurs par défaut — pas besoin d'échapper ici
      escapeValue: false,
    },
    detection: {
      // Ordre de détection de la langue
      order: ['localStorage', 'navigator'],
      // Clé de stockage dans localStorage
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;
