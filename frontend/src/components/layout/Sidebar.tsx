import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Collapse,
  Divider
} from '@mui/material';
import {
  Dashboard,
  Map,
  LocationOn,
  Storage,
  Assessment,
  Description,
  BarChart,
  Settings,
  ExpandLess,
  ExpandMore,
  Phone,
  Email,
  Update,
  Visibility
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { usePageTranslation } from '../../hooks/usePageTranslation';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    'Core Modules': true,
    'Resources': true
  });
  usePageTranslation();

  const handleToggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    {
      title: 'Core Modules',
      items: [
        { text: 'FRA Atlas', icon: <Map />, path: '/atlas' },
        { text: 'Digital GIS Plot', icon: <LocationOn />, path: '/gis-plot' },
        { text: 'Data Management', icon: <Storage />, path: '/data' },
        { text: 'Decision Support', icon: <Assessment />, path: '/decisions' }
      ]
    },
    {
      title: 'Resources',
      items: [
        { text: 'FRA Rules 2008', icon: <Description />, path: '/rules' },
        { text: 'Guidelines', icon: <Description />, path: '/guidelines' },
        { text: 'Reports & Analytics', icon: <BarChart />, path: '/reports' },
        { text: 'User Settings', icon: <Settings />, path: '/settings' }
      ]
    }
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 260,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 260,
          boxSizing: 'border-box',
          top: '104px !important',
          height: 'calc(100vh - 104px) !important',
          position: 'fixed !important',
          left: '0 !important',
          bgcolor: 'background.default',
          borderRight: (theme) => `1px solid ${theme.palette.divider}`,
          boxShadow: (theme) => theme.palette.mode === 'dark' 
            ? '2px 0 10px rgba(255,255,255,0.05)' 
            : '2px 0 10px rgba(0,0,0,0.05)',
          zIndex: 1100
        },
      }}
    >
      <Box sx={{ 
        overflow: 'auto', 
        height: '100%', 
        '&::-webkit-scrollbar': { display: 'none' },
        msOverflowStyle: 'none',
        scrollbarWidth: 'none'
      }}>
        {/* Welcome Section */}
        <Box sx={{ 
          p: 2.5, 
          bgcolor: '#1976d2',
          color: 'white',
          textAlign: 'center',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)'
          }
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }} data-translate>
            Welcome
          </Typography>
        </Box>

        {/* Menu Sections */}
        <List sx={{ p: 0 }}>
          {menuItems.map((section, sectionIndex) => (
            <Box key={sectionIndex}>
              {/* Section Header */}
              <ListItemButton
                onClick={() => handleToggleSection(section.title)}
                sx={{
                  bgcolor: '#1976d2',
                  color: 'white',
                  py: 1.5,
                  position: 'relative',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)',
                    transform: 'translateX(2px)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <ListItemText 
                  primary={section.title}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: 600
                  }}
                  data-translate
                />
                {openSections[section.title] ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>

              {/* Section Items */}
              <Collapse in={openSections[section.title]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {section.items.map((item, itemIndex) => (
                    <ListItem key={itemIndex} disablePadding>
                      <ListItemButton
                        onClick={() => navigate(item.path)}
                        sx={{
                          pl: 2,
                          py: 1.2,
                          bgcolor: isActive(item.path) ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                          borderLeft: isActive(item.path) ? '4px solid #1976d2' : '4px solid transparent',
                          borderRadius: '0 8px 8px 0',
                          mx: 0.5,
                          '&:hover': {
                            bgcolor: 'rgba(25, 118, 210, 0.05)',
                            transform: 'translateX(4px)',
                            boxShadow: '0 2px 8px rgba(25, 118, 210, 0.15)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36, color: isActive(item.path) ? '#1976d2' : '#64748b' }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={item.text}
                          primaryTypographyProps={{
                            fontSize: '0.875rem',
                            color: isActive(item.path) ? '#1976d2' : '#475569',
                            fontWeight: isActive(item.path) ? 600 : 500
                          }}
                          data-translate
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Box>
          ))}
        </List>

        {/* Statistics Section */}
        <Box sx={{ mt: 'auto' }}>
          <Box sx={{ 
            bgcolor: '#2e7d32',
            color: 'white', 
            p: 2,
            textAlign: 'center',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)'
            }
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.95rem', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }} data-translate>
              Statistics
            </Typography>
          </Box>
          <Box sx={{ p: 2.5, bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, p: 1, borderRadius: '6px', '&:hover': { bgcolor: 'rgba(46, 125, 50, 0.05)' } }}>
              <Phone sx={{ fontSize: 18, mr: 1.5, color: '#2e7d32' }} />
              <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }} data-translate>
                <strong style={{ color: 'inherit' }}>Toll Free:</strong> 1800-11-2345
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, p: 1, borderRadius: '6px', '&:hover': { bgcolor: 'rgba(46, 125, 50, 0.05)' } }}>
              <Email sx={{ fontSize: 18, mr: 1.5, color: '#2e7d32' }} />
              <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }} data-translate>
                <strong style={{ color: 'inherit' }}>Email:</strong> helpdesk@fraatlas.gov.in
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, p: 1, borderRadius: '6px', '&:hover': { bgcolor: 'rgba(46, 125, 50, 0.05)' } }}>
              <Update sx={{ fontSize: 18, mr: 1.5, color: '#2e7d32' }} />
              <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }} data-translate>
                <strong style={{ color: 'inherit' }}>Last Updated:</strong> 15 Nov 2024
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', p: 1, borderRadius: '6px', '&:hover': { bgcolor: 'rgba(46, 125, 50, 0.05)' } }}>
              <Visibility sx={{ fontSize: 18, mr: 1.5, color: '#2e7d32' }} />
              <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }} data-translate>
                <strong style={{ color: 'inherit' }}>Visitors:</strong> 1,23,456
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;