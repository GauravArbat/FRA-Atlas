import React, { useState } from 'react';
import {
  MenuItem,
  Box,
  Button,
  Tooltip,
  Menu,
  alpha,
  Typography,
  Chip
} from '@mui/material';
import { Language as LanguageIcon, ExpandMore } from '@mui/icons-material';
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

  const getCurrentLanguageCode = () => {
    return currentLanguage.toUpperCase();
  };

  return (
    <>
      <Tooltip 
        title={`Change Language (Current: ${getCurrentLanguageName()})`} 
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
        <Button 
          onClick={handleClick}
          disabled={isTranslating}
          startIcon={<LanguageIcon sx={{ fontSize: 18 }} />}
          endIcon={<ExpandMore sx={{ fontSize: 16 }} />}
          sx={{
            color: '#ffffff',
            border: `1px solid ${alpha('#ffffff', 0.3)}`,
            borderRadius: '8px',
            padding: '6px 12px',
            minWidth: 'auto',
            textTransform: 'none',
            fontSize: '0.8rem',
            fontWeight: 500,
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: alpha('#ffffff', 0.1),
              border: `1px solid ${alpha('#ffffff', 0.5)}`,
              transform: 'translateY(-1px)'
            },
            '&:disabled': {
              opacity: 0.5
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
              {getCurrentLanguageCode()}
            </Typography>
          </Box>
        </Button>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 220,
            maxHeight: 300,
            overflow: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            borderRadius: '8px'
          }
        }}
      >
        <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Select Language
          </Typography>
        </Box>
        {supportedLanguages.map((lang) => (
          <MenuItem 
            key={lang.code} 
            onClick={() => handleLanguageChange(lang.code)}
            selected={lang.code === currentLanguage}
            sx={{
              fontSize: '0.85rem',
              py: 1.5,
              px: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              '&.Mui-selected': {
                backgroundColor: alpha('#1976d2', 0.12),
                '&:hover': {
                  backgroundColor: alpha('#1976d2', 0.18)
                }
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LanguageIcon sx={{ fontSize: 16, opacity: 0.7 }} />
              <Typography variant="body2">{lang.name}</Typography>
            </Box>
            {lang.code === currentLanguage && (
              <Chip 
                label="Current" 
                size="small" 
                color="primary" 
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSwitcher;