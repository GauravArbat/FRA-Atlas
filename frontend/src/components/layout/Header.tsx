import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Box, 
  useMediaQuery,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Badge,
  Chip,
  alpha,
  Slide,
  useScrollTrigger
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  AccountCircle, 
  Person, 
  Settings, 
  Logout,
  Dashboard,
  Notifications,
  Search,
  Brightness4,
  Brightness7,
  Language,
  Help
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { ThemeToggle } from '../ThemeToggle';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { logout } from '../../store/slices/authSlice';
import { RootState } from '../../store';

const Header: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    handleClose();
  };

  const handleProfile = () => {
    navigate('/profile');
    handleClose();
  };

  const handleSettings = () => {
    navigate('/settings');
    handleClose();
  };

  const handleDashboard = () => {
    navigate('/');
    handleClose();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'admin': 'System Administrator',
      'state_admin': 'State Administrator',
      'district_admin': 'District Administrator',
      'block_admin': 'Block Administrator',
      'user': 'User'
    };
    return roleMap[role] || role;
  };

  return (
    <AppBar 
      position="fixed" 
      elevation={1}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        backdropFilter: 'blur(20px)',
        background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}
    >
      <Toolbar sx={{ px: { xs: 2, md: 4 }, minHeight: { xs: 64, md: 80 } }}>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="open sidebar"
          onClick={() => dispatch(toggleSidebar())}
          sx={{ mr: 2, display: 'inline-flex' }}
        >
          <MenuIcon />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)'
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '1.2rem'
                }}
              >
                F
              </Typography>
            </Box>
            <Box>
              <Typography
                variant={isMobile ? 'h6' : 'h5'}
                component="div"
                sx={{ 
                  fontWeight: 800, 
                  letterSpacing: -0.8,
                  color: 'text.primary',
                  lineHeight: 1.2,
                  fontSize: { xs: '1.25rem', md: '1.5rem' }
                }}
              >
                FRA Atlas
              </Typography>
            </Box>
          </Box>
          
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Search Icon */}
          {!isMobile && (
            <Tooltip title="Search">
              <IconButton
                size="medium"
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': { 
                    bgcolor: 'action.hover',
                    color: 'primary.main'
                  }
                }}
              >
                <Search />
              </IconButton>
            </Tooltip>
          )}
          
          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              size="medium"
              sx={{ 
                color: 'text.secondary',
                '&:hover': { 
                  bgcolor: 'action.hover',
                  color: 'primary.main'
                }
              }}
            >
              <Badge badgeContent={3} color="error" variant="dot">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* Theme Toggle */}
          <ThemeToggle size="medium" variant="default" />
          
          {/* Help */}
          {!isMobile && (
            <Tooltip title="Help & Documentation">
              <IconButton
                size="medium"
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': { 
                    bgcolor: 'action.hover',
                    color: 'primary.main'
                  }
                }}
              >
                <Help />
              </IconButton>
            </Tooltip>
          )}
          {!isMobile && user && (
            <Box sx={{ textAlign: 'right', mr: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                {user.username}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {getRoleDisplayName(user.role)}
              </Typography>
            </Box>
          )}
          
          <Tooltip title="Account menu">
            <IconButton
              aria-label="account menu"
              aria-controls={open ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
              onClick={handleProfileClick}
              sx={{ 
                p: 0.5,
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
            >
              {user ? (
                <Badge
                  overlap="circular"
                  variant="dot"
                  color="success"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                  <Avatar
                    sx={{ 
                      width: 36, 
                      height: 36, 
                      bgcolor: 'primary.main',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      boxShadow: 3,
                      border: 2,
                      borderColor: 'background.paper'
                    }}
                  >
                    {getInitials(user.username)}
                  </Avatar>
                </Badge>
              ) : (
                <AccountCircle sx={{ fontSize: 32 }} />
              )}
            </IconButton>
          </Tooltip>
        </Box>

        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={open}
          onClose={handleClose}
          onClick={handleClose}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 16px 32px rgba(0,0,0,0.15))',
              mt: 1.5,
              width: 340,
              borderRadius: 3,
              border: 1,
              borderColor: 'divider',
              backdropFilter: 'blur(12px)',
              background: (theme) => alpha(theme.palette.background.paper, 0.95),
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {user && (
            <Box sx={{ px: 2, pt: 2, pb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ 
                  bgcolor: 'primary.main', 
                  boxShadow: 3,
                  width: 48,
                  height: 48,
                  fontSize: '1.25rem',
                  fontWeight: 700
                }}>
                  {getInitials(user.username)}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography noWrap variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {user.username}
                  </Typography>
                  <Typography noWrap variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                  <Chip 
                    label={getRoleDisplayName(user.role)} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                    sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                  />
                </Box>
              </Box>
            </Box>
          )}
          
          <Divider />
          
          <MenuItem onClick={handleDashboard} sx={{ py: 1.25 }}>
            <ListItemIcon>
              <Dashboard fontSize="small" />
            </ListItemIcon>
            <ListItemText>Dashboard</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={handleProfile} sx={{ py: 1.25 }}>
            <ListItemIcon>
              <Person fontSize="small" />
            </ListItemIcon>
            <ListItemText>Profile</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={handleSettings} sx={{ py: 1.25 }}>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            <ListItemText>Settings</ListItemText>
          </MenuItem>
          
          <Divider />
          
          <MenuItem onClick={handleLogout} sx={{ py: 1.25 }}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;



