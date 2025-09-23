import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  Collapse
} from '@mui/material';
import {
  Dashboard,
  Map,
  DataUsage,
  Assessment,
  Settings,
  ExpandLess,
  ExpandMore,
  Description,
  LocationOn,
  BarChart,
  Storage
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { usePageTranslation } from '../../hooks/usePageTranslation';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({});
  usePageTranslation();

  const handleToggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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

  const isActive = (path: string) => location.pathname === path;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          mt: '88px', // Account for header height
          bgcolor: '#f8f9fa',
          borderRight: '1px solid #dee2e6'
        },
      }}
    >
      <Box sx={{ overflow: 'auto', height: '100%' }}>
        {/* Welcome Section */}
        <Box sx={{ p: 2, bgcolor: '#1976d2', color: 'white' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.9rem' }} data-translate>
            Welcome
          </Typography>
        </Box>

        {menuItems.map((section, sectionIndex) => (
          <Box key={sectionIndex}>
            <Box 
              sx={{ 
                bgcolor: '#1976d2', 
                color: 'white',
                cursor: 'pointer'
              }}
              onClick={() => handleToggleSection(section.title)}
            >
              <ListItem data-translate>
                <ListItemText 
                  primary={section.title}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: 600
                  }}
                />
                {openSections[section.title] ? <ExpandLess /> : <ExpandMore />}
              </ListItem>
            </Box>
            
            <Collapse in={openSections[section.title]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {section.items.map((item, itemIndex) => (
                  <ListItem key={itemIndex} disablePadding data-translate>
                    <ListItemButton
                      onClick={() => navigate(item.path)}
                      sx={{
                        pl: 3,
                        py: 0.5,
                        bgcolor: isActive(item.path) ? '#e3f2fd' : 'transparent',
                        '&:hover': {
                          bgcolor: '#e3f2fd'
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.text}
                        primaryTypographyProps={{
                          fontSize: '0.85rem'
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </Box>
        ))}

        {/* Statistics Section */}
        <Box sx={{ mt: 2 }}>
          <Box sx={{ bgcolor: '#1976d2', color: 'white', p: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.9rem' }} data-translate>
              Statistics
            </Typography>
          </Box>
          <Box sx={{ p: 2, bgcolor: 'white' }}>
            <Typography variant="body2" sx={{ mb: 1 }} data-translate>
              <strong>Toll Free:</strong> 1800-11-2345
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }} data-translate>
              <strong>Email:</strong> helpdesk@fraatlas.gov.in
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }} data-translate>
              <strong>Last Updated:</strong> 15 Nov 2024
            </Typography>
            <Typography variant="body2" data-translate>
              <strong>Visitors:</strong> 1,23,456
            </Typography>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;