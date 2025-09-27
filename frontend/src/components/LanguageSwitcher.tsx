import React, { useState } from 'react';
import {
  MenuItem,
  Box,
  IconButton,
  Tooltip,
  Menu,
  alpha,
} from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';
import { getSupportedLanguages } from '../services/translationService';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSwitcher: React.FC = () => {
  const { currentLanguage, setLanguage, isTranslating } = useLanguage();
  const supportedLanguages = getSupportedLanguages();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (language: string) => {
    setLanguage(language);
    handleClose();
  };

  const getCurrentLanguageName = () => {
    const lang = supportedLanguages.find(l => l.code === currentLanguage);
    return lang ? lang.name.split('(')[0].trim() : 'English';
  };

  return (
    <>
      <Tooltip 
        title={`Current: ${getCurrentLanguageName()}`} 
        placement="bottom"
        componentsProps={{
          tooltip: {
            sx: {
              bgcolor: 'rgba(0,0,0,0.8)',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 500
            }
          }
        }}
      >
        <IconButton 
          onClick={handleClick}
          disabled={isTranslating}
          sx={{
            color: '#ffffff',
            border: `1px solid ${alpha('#ffffff', 0.3)}`,
            borderRadius: '6px',
            padding: '6px',
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: alpha('#ffffff', 0.1),
              border: `1px solid ${alpha('#ffffff', 0.5)}`,
              transform: 'scale(1.05)'
            },
            '&:disabled': {
              opacity: 0.5
            }
          }}
        >
          <LanguageIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            maxHeight: 300,
            overflow: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            borderRadius: '8px'
          }
        }}
      >
        {supportedLanguages.map((lang) => (
          <MenuItem 
            key={lang.code} 
            onClick={() => handleLanguageChange(lang.code)}
            selected={lang.code === currentLanguage}
            sx={{
              fontSize: '0.85rem',
              py: 1,
              '&.Mui-selected': {
                backgroundColor: alpha('#1976d2', 0.12),
                '&:hover': {
                  backgroundColor: alpha('#1976d2', 0.18)
                }
              }
            }}
          >
            {lang.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSwitcher;