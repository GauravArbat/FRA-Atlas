import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translateText } from '../services/translationService';

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (language: string) => void;
  isTranslating: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [observer, setObserver] = useState<MutationObserver | null>(null);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'en';
    setCurrentLanguage(savedLanguage);
  }, []);

  // Auto-translate when language changes
  useEffect(() => {
    if (currentLanguage !== 'en') {
      const timer = setTimeout(() => {
        translatePageContent(currentLanguage);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentLanguage]);

  // Watch for DOM changes and auto-translate new content
  useEffect(() => {
    if (currentLanguage !== 'en') {
      const mutationObserver = new MutationObserver((mutations) => {
        let hasNewTranslatableContent = false;
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                if (element.querySelector('[data-translate]') || element.hasAttribute('data-translate')) {
                  hasNewTranslatableContent = true;
                }
              }
            });
          }
        });
        
        if (hasNewTranslatableContent) {
          setTimeout(() => translatePageContent(currentLanguage), 300);
        }
      });
      
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      setObserver(mutationObserver);
      
      return () => {
        mutationObserver.disconnect();
        setObserver(null);
      };
    } else if (observer) {
      observer.disconnect();
      setObserver(null);
    }
  }, [currentLanguage]); // Removed observer from dependencies to prevent infinite loop

  const setLanguage = async (language: string) => {
    setCurrentLanguage(language);
    localStorage.setItem('selectedLanguage', language);
    
    if (language === 'en') {
      restoreOriginalText();
    } else {
      // Force immediate translation
      setTimeout(() => translatePageContent(language), 100);
    }
  };

  const restoreOriginalText = () => {
    const textElements = document.querySelectorAll('[data-translate]');
    textElements.forEach(element => {
      const originalText = element.getAttribute('data-original-text');
      if (originalText) {
        element.textContent = originalText;
        element.removeAttribute('data-translating');
      }
    });
  };

  const translatePageContent = async (targetLanguage: string) => {
    setIsTranslating(true);
    try {
      // Query from both document and all shadow roots/portals
      const textElements = document.querySelectorAll('[data-translate]');
      // Also check Material-UI portals and drawers
      const portalElements = document.querySelectorAll('.MuiDrawer-root [data-translate], .MuiDialog-root [data-translate], .MuiPopover-root [data-translate]');
      const allElements = [...Array.from(textElements), ...Array.from(portalElements)];
      
      // Batch translate for better performance
      const textsToTranslate: { element: Element; text: string }[] = [];
      
      allElements.forEach(element => {
        let originalText = element.getAttribute('data-original-text');
        if (!originalText) {
          originalText = element.textContent?.trim() || '';
          if (originalText) {
            element.setAttribute('data-original-text', originalText);
          }
        }
        
        if (originalText && originalText.length > 0 && !element.hasAttribute('data-translating')) {
          element.setAttribute('data-translating', 'true');
          textsToTranslate.push({ element, text: originalText });
        }
      });
      
      // Process in parallel batches of 10 for faster translation
      const batchSize = 10;
      for (let i = 0; i < textsToTranslate.length; i += batchSize) {
        const batch = textsToTranslate.slice(i, i + batchSize);
        await Promise.all(batch.map(async ({ element, text }) => {
          try {
            const { translatedText } = await translateText(text, targetLanguage, 'en');
            if (translatedText && translatedText !== text) {
              element.textContent = translatedText;
            }
          } catch (error) {
            console.warn(`Failed to translate: ${text}`);
          } finally {
            element.removeAttribute('data-translating');
          }
        }));
      }
    } catch (error) {
      console.error('Page translation failed:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, isTranslating }}>
      {children}
    </LanguageContext.Provider>
  );
};