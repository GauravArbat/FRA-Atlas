import React from 'react';
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Box, useMediaQuery, Tooltip, Divider, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dashboard as DashboardIcon,
  Map as MapIcon,
  Storage as DataIcon,
  Assessment as DecisionIcon,
  BarChart as ReportsIcon,
  Settings as SettingsIcon,
  Person as ProfileIcon,
  Park as ParkIcon,
} from '@mui/icons-material';
import { RootState } from '../../store';
import { useTheme } from '@mui/material/styles';
import { toggleSidebar } from '../../store/slices/uiSlice';

const Sidebar: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // legacy drawerContent removed in favor of unified mini-variant list below

  const drawerWidthOpen = 240;
  const drawerWidthMini = 72;

  const items = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'FRA Atlas', icon: <MapIcon />, path: '/atlas' },
    { text: 'Data Management', icon: <DataIcon />, path: '/data' },
    { text: 'Decision Support', icon: <DecisionIcon />, path: '/decisions' },
    { text: 'Reports', icon: <ReportsIcon />, path: '/reports' },
    { text: 'Profile', icon: <ProfileIcon />, path: '/profile' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={sidebarOpen}
      onClose={() => dispatch(toggleSidebar())}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: sidebarOpen ? drawerWidthOpen : drawerWidthMini,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: sidebarOpen ? drawerWidthOpen : drawerWidthMini,
          transition: 'width 200ms',
          overflowX: 'hidden',
          boxSizing: 'border-box',
          borderRight: '1px solid rgba(0,0,0,0.06)',
          top: '64px',
          height: 'calc(100vh - 64px)'
        },
      }}
    >
      <Box sx={{ display: 'none' }} />
      <Box
        onClick={() => navigate('/')}
        sx={{
          position: 'sticky',
          top: 0,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          justifyContent: sidebarOpen ? 'flex-start' : 'center',
          px: sidebarOpen ? 2 : 1,
          cursor: 'pointer',
          bgcolor: 'background.paper',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          zIndex: 1
        }}
      >
        <ParkIcon sx={{ color: 'success.main' }} />
        {sidebarOpen && (
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, letterSpacing: 0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            FRA Atlas
          </Typography>
        )}
      </Box>
      <Divider />
      <List>
        {items.map((item) => {
          const selected = location.pathname === item.path;
          const button = (
            <ListItemButton
              key={item.text}
              selected={selected}
              onClick={() => navigate(item.path)}
              sx={{
                px: sidebarOpen ? 2 : 1,
                '&.Mui-selected': { backgroundColor: 'action.selected' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: selected ? 'primary.main' : 'inherit' }}>{item.icon}</ListItemIcon>
              {sidebarOpen && <ListItemText primary={item.text} />}
            </ListItemButton>
          );
          return sidebarOpen ? (
            <Box key={item.text}>{button}</Box>
          ) : (
            <Tooltip key={item.text} title={item.text} placement="right">
              <Box>{button}</Box>
            </Tooltip>
          );
        })}
      </List>
    </Drawer>
  );
};

export default Sidebar;



