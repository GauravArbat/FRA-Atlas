import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Chip,
  Avatar,
  alpha,
  Collapse,
  Badge
} from '@mui/material';
import {
  Dashboard,
  Map,
  Assessment,
  Settings,
  Info,
  Terrain,
  Nature,
  Public,
  ExpandLess,
  ExpandMore,
  Analytics,
  Layers,
  Timeline,
  Storage,
  CloudDownload,
  Notifications,
  Park,
  AccountCircle,
  ChevronLeft,
  ChevronRight,
  Menu
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { RootState } from '../../store';
import { toggleSidebar, toggleSidebarCollapse } from '../../store/slices/uiSlice';

const Sidebar: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarOpen, sidebarCollapsed } = useSelector((state: RootState) => state.ui);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const drawerWidth = 300;
  const drawerWidthMini = 72;
  const currentWidth = sidebarCollapsed ? drawerWidthMini : drawerWidth;

  const [expandedSections, setExpandedSections] = React.useState<string[]>(['main']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const menuSections = [
    {
      id: 'main',
      title: 'Main Navigation',
      items: [
        { text: 'Dashboard', icon: <Dashboard />, path: '/', badge: null },
        { text: 'FRA Atlas', icon: <Map />, path: '/atlas', badge: 'New' },
        { text: 'Digital GIS Plot', icon: <Terrain />, path: '/gis-plot', badge: 'Pro' }
      ]
    },
    {
      id: 'analytics',
      title: 'Analytics & Reports',
      items: [
        { text: 'Reports', icon: <Assessment />, path: '/reports', badge: null },
        { text: 'Decision Support', icon: <Analytics />, path: '/decisions', badge: null },
        { text: 'Data Management', icon: <Timeline />, path: '/data', badge: null }
      ]
    },
    {
      id: 'system',
      title: 'System',
      items: [
        { text: 'Profile', icon: <Settings />, path: '/profile', badge: null },
        { text: 'Settings', icon: <Settings />, path: '/settings', badge: null }
      ]
    }
  ];

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={sidebarOpen}
      onClose={() => dispatch(toggleSidebar())}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: isMobile ? (sidebarOpen ? drawerWidth : 0) : currentWidth,
        flexShrink: 0,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '& .MuiDrawer-paper': {
          width: isMobile ? drawerWidth : currentWidth,
          boxSizing: 'border-box',
          borderRight: '1px solid rgba(0,0,0,0.08)',
          backgroundColor: 'background.paper',
          backgroundImage: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`,
          backdropFilter: 'blur(20px)',
          boxShadow: '2px 0 12px rgba(0,0,0,0.05)',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowX: 'hidden'
        }
      }}
    >
      <Box sx={{ display: 'none' }} />
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          justifyContent: 'space-between',
          px: sidebarCollapsed ? 1 : 2,
          bgcolor: 'background.paper',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          zIndex: 1
        }}
      >
        <Box
          onClick={() => navigate('/')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            flex: 1
          }}
        >
          <Park sx={{ color: 'success.main' }} />
          {!sidebarCollapsed && (
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, letterSpacing: 0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              FRA Atlas
            </Typography>
          )}
        </Box>
        {!isMobile && (
          <Box
            onClick={() => dispatch(toggleSidebarCollapse())}
            sx={{
              cursor: 'pointer',
              p: 0.5,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover': {
                bgcolor: 'action.hover'
              },
              transition: 'all 0.2s ease'
            }}
          >
            {sidebarCollapsed ? (
              <ChevronRight sx={{ fontSize: 20, color: 'text.secondary' }} />
            ) : (
              <ChevronLeft sx={{ fontSize: 20, color: 'text.secondary' }} />
            )}
          </Box>
        )}
      </Box>
      {!sidebarCollapsed && (
        <Box sx={{ 
          p: 3, 
          borderBottom: 1, 
          borderColor: 'divider',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
          backdropFilter: 'blur(10px)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 2 }}>
            <Avatar
              sx={{
                background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
                width: 56,
                height: 56,
                fontSize: '1.75rem',
                fontWeight: 800,
                boxShadow: '0 6px 20px rgba(46, 125, 50, 0.4)',
                border: '3px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              F
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 800, 
                color: 'text.primary',
                lineHeight: 1.1,
                fontSize: '1.3rem',
                letterSpacing: -0.5
              }}>
                FRA Atlas
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
      <Divider />
      <List sx={{ pt: 2, px: sidebarCollapsed ? 0.5 : 1 }}>
        {sidebarCollapsed ? (
          // Collapsed view - show only icons
          <>
            {menuSections.flatMap(section => section.items).map((item) => (
              <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  selected={location.pathname === item.path}
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    py: 1.5,
                    minHeight: 48,
                    justifyContent: 'center',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      transform: 'scale(1.05)',
                    },
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.15),
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.2)
                      }
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <ListItemIcon sx={{ 
                    color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                    minWidth: 'auto',
                    justifyContent: 'center'
                  }}>
                    {item.badge && item.badge !== 'null' ? (
                      <Badge 
                        badgeContent={isNaN(Number(item.badge)) ? '' : item.badge} 
                        color={item.badge === 'New' ? 'success' : item.badge === 'Pro' ? 'primary' : 'error'}
                        variant={isNaN(Number(item.badge)) ? 'dot' : 'standard'}
                      >
                        {item.icon}
                      </Badge>
                    ) : (
                      item.icon
                    )}
                  </ListItemIcon>
                </ListItemButton>
              </ListItem>
            ))}
          </>
        ) : (
          // Expanded view - show sections and items
          <>
            {menuSections.map((section) => (
              <Box key={section.id}>
                <ListItemButton
                  onClick={() => toggleSection(section.id)}
                  sx={{
                    borderRadius: 3,
                    mb: 1.5,
                    mx: 1,
                    py: 1.5,
                    bgcolor: expandedSections.includes(section.id) 
                      ? alpha(theme.palette.primary.main, 0.12) 
                      : 'transparent',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.16),
                      transform: 'translateX(2px)'
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: `1px solid ${expandedSections.includes(section.id) ? alpha(theme.palette.primary.main, 0.2) : 'transparent'}`
                  }}
                >
                  <ListItemText 
                    primary={section.title}
                    primaryTypographyProps={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: expandedSections.includes(section.id) ? 'primary.main' : 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: 1
                    }}
                  />
                  {expandedSections.includes(section.id) ? 
                    <ExpandLess sx={{ color: 'primary.main', fontSize: '1.2rem' }} /> : 
                    <ExpandMore sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                  }
                </ListItemButton>
            
            <Collapse in={expandedSections.includes(section.id)} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {section.items.map((item) => (
                  <ListItem key={item.text} disablePadding sx={{ pl: 1 }}>
                    <ListItemButton
                      onClick={() => navigate(item.path)}
                      selected={location.pathname === item.path}
                      sx={{
                        borderRadius: 3,
                        mb: 1,
                        mx: 2,
                        py: 2,
                        pl: 3,
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.08),
                          transform: 'translateX(6px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        },
                        '&.Mui-selected': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.15),
                          borderLeft: `4px solid ${theme.palette.primary.main}`,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.2)
                          }
                        },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        border: `1px solid ${location.pathname === item.path ? alpha(theme.palette.primary.main, 0.3) : 'transparent'}`
                      }}
                    >
                      <ListItemIcon sx={{ 
                        color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                        minWidth: 44,
                        transition: 'color 0.3s ease'
                      }}>
                        {item.badge && item.badge !== 'null' ? (
                          <Badge 
                            badgeContent={isNaN(Number(item.badge)) ? '' : item.badge} 
                            color={item.badge === 'New' ? 'success' : item.badge === 'Pro' ? 'primary' : 'error'}
                            variant={isNaN(Number(item.badge)) ? 'dot' : 'standard'}
                          >
                            {item.icon}
                          </Badge>
                        ) : (
                          item.icon
                        )}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.text}
                        primaryTypographyProps={{
                          fontSize: '0.9rem',
                          fontWeight: location.pathname === item.path ? 700 : 500,
                          color: location.pathname === item.path ? 'primary.main' : 'text.primary'
                        }}
                      />
                      {item.badge && isNaN(Number(item.badge)) && (
                        <Chip
                          label={item.badge}
                          size="small"
                          color={item.badge === 'New' ? 'success' : 'primary'}
                          variant="filled"
                          sx={{
                            fontSize: '0.7rem',
                            height: 22,
                            fontWeight: 600,
                            background: item.badge === 'New' 
                              ? 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)'
                              : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                            color: 'white'
                          }}
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
            
                
                {section.id !== 'system' && <Divider sx={{ my: 2, mx: 1 }} />}
              </Box>
            ))}
          </>
        )}
      </List>
    </Drawer>
  );
};

export default Sidebar;
