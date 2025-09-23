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
      transition: 'background-color 0.2s ease',
      borderRadius: '4px',
      padding: size === 'small' ? '6px' : size === 'large' ? '12px' : '8px',
    } as const;

    switch (variant) {
      case 'outlined':
        return {
          ...baseStyles,
          border: `1px solid ${alpha(muiTheme.palette.primary.main, 0.3)}`,
          backgroundColor: 'transparent',
          '&:hover': { backgroundColor: alpha(muiTheme.palette.primary.main, 0.06) },
        };
      case 'contained':
        return {
          ...baseStyles,
          backgroundColor: alpha(muiTheme.palette.primary.main, 0.12),
          '&:hover': { backgroundColor: alpha(muiTheme.palette.primary.main, 0.18) },
        };
      default:
        return { ...baseStyles, backgroundColor: 'transparent', '&:hover': { backgroundColor: muiTheme.palette.action.hover } };
    }
  };

  const iconSize = size === 'small' ? 18 : size === 'large' ? 28 : 22;

  return (
    <Tooltip title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'} placement="bottom" arrow>
      <IconButton onClick={toggleTheme} sx={getButtonStyles()} aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
        {isDarkMode ? (
          <LightMode sx={{ fontSize: iconSize, color: muiTheme.palette.warning.main }} />
        ) : (
          <DarkMode sx={{ fontSize: iconSize, color: muiTheme.palette.primary.main }} />
        )}
      </IconButton>
    </Tooltip>
  );
};
