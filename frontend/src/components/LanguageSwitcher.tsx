import React from 'react';
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';
import { getSupportedLanguages } from '../services/translationService';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSwitcher: React.FC = () => {
  const { currentLanguage, setLanguage, isTranslating } = useLanguage();
  const supportedLanguages = getSupportedLanguages();

  const handleLanguageChange = (language: string) => {
    setLanguage(language);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Tooltip title="Change Language">
        <IconButton size="small">
          <LanguageIcon />
        </IconButton>
      </Tooltip>
      
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Language</InputLabel>
        <Select
          value={currentLanguage}
          label="Language"
          onChange={(e) => handleLanguageChange(e.target.value)}
          disabled={isTranslating}
        >
          {supportedLanguages.map((lang) => (
            <MenuItem key={lang.code} value={lang.code}>
              {lang.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      {isTranslating && (
        <Box sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
          Translating...
        </Box>
      )}
    </Box>
  );
};

export default LanguageSwitcher;