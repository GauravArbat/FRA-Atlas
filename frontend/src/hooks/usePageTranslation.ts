import { useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export const usePageTranslation = () => {
  const { currentLanguage, setLanguage } = useLanguage();

  useEffect(() => {
    // Force re-translation when component mounts
    if (currentLanguage !== 'en') {
      // Multiple attempts to ensure translation happens
      setTimeout(() => {
        const event = new CustomEvent('forceTranslation', { detail: { language: currentLanguage } });
        document.dispatchEvent(event);
      }, 100);
      
      setTimeout(() => {
        const event = new CustomEvent('forceTranslation', { detail: { language: currentLanguage } });
        document.dispatchEvent(event);
      }, 500);
      
      setTimeout(() => {
        const event = new CustomEvent('forceTranslation', { detail: { language: currentLanguage } });
        document.dispatchEvent(event);
      }, 1000);
    }
  }, []); // Only run on mount

  return { currentLanguage, setLanguage };
};