import React from 'react';
import { IconButton, Tooltip, useTheme as useMuiTheme, alpha } from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'outlined' | 'contained';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  size = 'medium', 
  variant = 'default' 
}) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const muiTheme = useMuiTheme();

  const getButtonStyles = () => {
    const baseStyles = {
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      borderRadius: '12px',
      padding: size === 'small' ? '6px' : size === 'large' ? '12px' : '8px',
    };

    switch (variant) {
      case 'outlined':
        return {
          ...baseStyles,
          border: `2px solid ${alpha(muiTheme.palette.primary.main, 0.3)}`,
          backgroundColor: 'transparent',
          '&:hover': {
            backgroundColor: alpha(muiTheme.palette.primary.main, 0.08),
            border: `2px solid ${alpha(muiTheme.palette.primary.main, 0.5)}`,
            transform: 'scale(1.05)',
          },
        };
      case 'contained':
        return {
          ...baseStyles,
          backgroundColor: alpha(muiTheme.palette.primary.main, 0.1),
          '&:hover': {
            backgroundColor: alpha(muiTheme.palette.primary.main, 0.2),
            transform: 'scale(1.05)',
            boxShadow: `0 4px 12px ${alpha(muiTheme.palette.primary.main, 0.3)}`,
          },
        };
      default:
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          '&:hover': {
            backgroundColor: alpha(muiTheme.palette.action.hover, 0.8),
            transform: 'scale(1.1)',
          },
        };
    }
  };

  const iconSize = size === 'small' ? 18 : size === 'large' ? 28 : 22;

  return (
    <Tooltip 
      title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      placement="bottom"
      arrow
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
              color: muiTheme.palette.warning.main,
              filter: 'drop-shadow(0 0 6px rgba(255, 193, 7, 0.4))',
            }} 
          />
        ) : (
          <DarkMode 
            sx={{ 
              fontSize: iconSize,
              color: muiTheme.palette.primary.main,
              filter: 'drop-shadow(0 0 6px rgba(25, 118, 210, 0.4))',
            }} 
          />
        )}
      </IconButton>
    </Tooltip>
  );
};
