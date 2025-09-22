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

  // Auto-translate when language changes or new content loads
  useEffect(() => {
    if (currentLanguage !== 'en') {
      const timer = setTimeout(() => {
        translatePageContent(currentLanguage);
      }, 500); // Increased delay for DOM to be ready
      return () => clearTimeout(timer);
    }
  }, [currentLanguage]);

  // Listen for force translation events and route changes
  useEffect(() => {
    const handleForceTranslation = (event: CustomEvent) => {
      const { language } = event.detail;
      if (language && language !== 'en') {
        setTimeout(() => translatePageContent(language), 200);
      }
    };

    // Also listen for route changes
    const handleRouteChange = () => {
      if (currentLanguage !== 'en') {
        setTimeout(() => translatePageContent(currentLanguage), 800);
      }
    };

    document.addEventListener('forceTranslation', handleForceTranslation as EventListener);
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      document.removeEventListener('forceTranslation', handleForceTranslation as EventListener);
      window.removeEventListener('popstate', handleRouteChange);
    };
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
      
      // Also observe Material-UI portal containers
      const portalContainers = document.querySelectorAll('.MuiDrawer-root, .MuiDialog-root, .MuiPopover-root');
      portalContainers.forEach(container => {
        mutationObserver.observe(container, {
          childList: true,
          subtree: true
        });
      });
      
      setObserver(mutationObserver);
      
      return () => {
        mutationObserver.disconnect();
      };
    } else if (observer) {
      observer.disconnect();
      setObserver(null);
    }
  }, [currentLanguage, observer]);

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
      
      for (const element of allElements) {
        // Always use current text content as original if not stored
        let originalText = element.getAttribute('data-original-text');
        if (!originalText) {
          originalText = element.textContent || '';
          if (originalText.trim()) {
            element.setAttribute('data-original-text', originalText);
          }
        }
        
        if (originalText && originalText.trim()) {
          try {
            const { translatedText } = await translateText(originalText, targetLanguage, 'en');
            element.textContent = translatedText;
          } catch (error) {
            console.warn(`Failed to translate: ${originalText}`);
          }
        }
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