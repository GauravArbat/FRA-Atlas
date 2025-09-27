import React from 'react';
import { IconButton, Tooltip, useTheme as useMuiTheme, alpha } from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'outlined' | 'contained';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ size = 'medium', variant = 'default' }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const muiTheme = useMuiTheme();

  const getButtonStyles = () => {
    const baseStyles = {
      transition: 'all 0.3s ease',
      borderRadius: '6px',
      padding: size === 'small' ? '6px' : size === 'large' ? '12px' : '8px',
      minWidth: 'auto',
    } as const;

    switch (variant) {
      case 'outlined':
        return {
          ...baseStyles,
          border: `1px solid ${alpha('#ffffff', 0.3)}`,
          backgroundColor: 'transparent',
          color: '#ffffff',
          '&:hover': { 
            backgroundColor: alpha('#ffffff', 0.1),
            border: `1px solid ${alpha('#ffffff', 0.5)}`,
            transform: 'scale(1.05)'
          },
        };
      case 'contained':
        return {
          ...baseStyles,
          backgroundColor: alpha('#ffffff', 0.15),
          color: '#ffffff',
          border: 'none',
          '&:hover': { 
            backgroundColor: alpha('#ffffff', 0.25),
            transform: 'scale(1.05)'
          },
        };
      default:
        return { 
          ...baseStyles, 
          backgroundColor: 'transparent', 
          color: '#ffffff',
          '&:hover': { 
            backgroundColor: alpha('#ffffff', 0.1),
            transform: 'scale(1.05)'
          } 
        };
    }
  };

  const iconSize = size === 'small' ? 20 : size === 'large' ? 28 : 24;

  return (
    <Tooltip 
      title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'} 
      placement="bottom" 
      arrow
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
        onClick={toggleTheme} 
        sx={getButtonStyles()} 
        aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDarkMode ? (
          <LightMode 
            sx={{ 
              fontSize: iconSize, 
              color: '#ffd54f',
              filter: 'drop-shadow(0 0 4px rgba(255, 213, 79, 0.3))'
            }} 
          />
        ) : (
          <DarkMode 
            sx={{ 
              fontSize: iconSize, 
              color: '#ffffff',
              filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))'
            }} 
          />
        )}
      </IconButton>
    </Tooltip>
  );
};
