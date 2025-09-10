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
  Badge
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  AccountCircle, 
  Person, 
  Settings, 
  Logout,
  Dashboard
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
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
    <AppBar position="fixed" color="primary" elevation={2}>
      <Toolbar sx={{ px: { xs: 2, md: 3 } }}>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="open sidebar"
          onClick={() => dispatch(toggleSidebar())}
          sx={{ mr: 2, display: 'inline-flex' }}
        >
          <MenuIcon />
        </IconButton>
        <Typography
          variant={isMobile ? 'h6' : 'h5'}
          component="div"
          sx={{ flexGrow: 1, fontWeight: 600, letterSpacing: 0.2 }}
        >
          FRA Atlas
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!isMobile && user && (
            <Box sx={{ textAlign: 'right', mr: 2 }}>
              <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                {user.username}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                {getRoleDisplayName(user.role)}
              </Typography>
            </Box>
          )}
          
          <Tooltip title="Account menu">
            <IconButton
              color="inherit"
              aria-label="account menu"
              aria-controls={open ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
              onClick={handleProfileClick}
              sx={{ p: 0.5 }}
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
                      width: 32, 
                      height: 32, 
                      bgcolor: 'secondary.main',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      boxShadow: 2
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
              filter: 'drop-shadow(0px 8px 24px rgba(0,0,0,0.24))',
              mt: 1.5,
              width: 320,
              borderRadius: 2,
              border: '1px solid rgba(0,0,0,0.06)',
              backdropFilter: 'blur(8px)',
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
                <Avatar sx={{ bgcolor: 'primary.main', boxShadow: 2 }}>
                  {getInitials(user.username)}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography noWrap variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {user.username}
                  </Typography>
                  <Typography noWrap variant="caption" color="text.secondary">
                    {user.email}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                {getRoleDisplayName(user.role)}
              </Typography>
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



