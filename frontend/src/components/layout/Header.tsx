import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Avatar,
  Box,
  Menu,
  MenuItem,
  Divider,
  Button,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  alpha
} from '@mui/material';
import {
  Notifications,
  AccountCircle,
  Settings,
  Logout,
  Language,
  TextIncrease,
  TextDecrease,
  Contrast
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LanguageSwitcher from '../LanguageSwitcher';
import { ThemeToggle } from '../ThemeToggle';
import { usePageTranslation } from '../../hooks/usePageTranslation';

const Header: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  usePageTranslation();

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    navigate('/profile');
    handleClose();
  };

  const handleSettings = () => {
    navigate('/settings');
    handleClose();
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  return (
    <>
      {/* Top Header Bar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: '#1976d2',
          color: 'white',
          boxShadow: 'none',
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`
        }}
      >
        <Toolbar sx={{ minHeight: '48px !important', px: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <img 
              src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K" 
              alt="Government Logo" 
              style={{ width: 24, height: 24, marginRight: 8 }}
            />
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', color: 'inherit' }} data-translate>
              Forest Rights Act (FRA) Atlas
            </Typography>
            <Typography variant="caption" sx={{ ml: 1, opacity: 0.8, color: 'inherit' }} data-translate>
              Ministry of Tribal Affairs, Government of India
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ThemeToggle size="small" variant="contained" />
            <LanguageSwitcher />
            
            {/* Notifications */}
            <Tooltip title="Notifications" placement="bottom">
              <IconButton 
                onClick={() => navigate('/notifications')}
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
                  }
                }}
              >
                <Badge badgeContent={3} color="error">
                  <Notifications sx={{ fontSize: 20 }} />
                </Badge>
              </IconButton>
            </Tooltip>
            
            {/* Admin Profile */}
            <Tooltip title="Admin Profile" placement="bottom">
              <IconButton
                onClick={handleMenu}
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
                  }
                }}
              >
                <Avatar 
                  sx={{ 
                    width: 20, 
                    height: 20, 
                    bgcolor: '#ffffff',
                    color: '#1976d2',
                    fontSize: '0.7rem',
                    fontWeight: 600
                  }}
                >
                  {user?.username?.charAt(0) || 'A'}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Bar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          top: 48,
          zIndex: (theme) => theme.zIndex.drawer,
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: (theme) => `0 2px 4px ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
        }}
      >
        <Toolbar sx={{ minHeight: '40px !important', px: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Button 
              sx={{ 
                color: 'primary.main', 
                fontWeight: 600,
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => navigate('/')}
              data-translate
            >
              Home
            </Button>
            <Button 
              sx={{ 
                color: 'text.primary',
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => navigate('/atlas')}
              data-translate
            >
              About FRA
            </Button>
            <Button 
              sx={{ 
                color: 'text.primary',
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => navigate('/')}
              data-translate
            >
              Dashboard
            </Button>
            <Button 
              sx={{ 
                color: 'text.primary',
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => navigate('/data')}
              data-translate
            >
              Data Discovery
            </Button>
            <Button 
              sx={{ 
                color: 'text.primary',
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => navigate('/gis-plot')}
              data-translate
            >
              GIS Platform
            </Button>
            <Button 
              sx={{ 
                color: 'text.primary',
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => navigate('/reports')}
              data-translate
            >
              Reports
            </Button>
            <Button 
              sx={{ 
                color: 'text.primary',
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => navigate('/data')}
              data-translate
            >
              Downloads
            </Button>
            <Button 
              sx={{ 
                color: 'text.primary',
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => navigate('/contact')}
              data-translate
            >
              Contact Us
            </Button>
          </Box>
          
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton 
              size="small"
              onClick={() => navigate('/notifications')}
              sx={{ color: 'text.primary' }}
            >
              <Badge badgeContent={3} color="error">
                <Notifications fontSize="small" />
              </Badge>
            </IconButton>
            
            <IconButton
              size="small"
              onClick={handleMenu}
              sx={{ color: 'text.primary' }}
            >
              <Avatar 
                sx={{ 
                  width: 24, 
                  height: 24, 
                  bgcolor: 'primary.main',
                  fontSize: '0.8rem'
                }}
              >
                {user?.username?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 180,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }
              }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {user?.username || 'User'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email || 'user@example.com'}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={handleProfile} data-translate>
                <AccountCircle sx={{ mr: 1, fontSize: 18 }} />
                Profile
              </MenuItem>
              <MenuItem onClick={handleSettings} data-translate>
                <Settings sx={{ mr: 1, fontSize: 18 }} />
                Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }} data-translate>
                <Logout sx={{ mr: 1, fontSize: 18 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
    </>
  );
};

export default Header;