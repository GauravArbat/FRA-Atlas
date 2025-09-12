import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  IconButton,
  Collapse,
  alpha,
  useTheme
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Circle,
  CropSquare,
  GridOn,
  Remove
} from '@mui/icons-material';

interface AreaPlot {
  id: string;
  type: string;
  area: number;
  pattern: string;
  properties: {
    name: string;
    status: string;
  };
}

interface AreaLegendProps {
  areaPlots: AreaPlot[];
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onRemoveArea?: (id: string) => void;
}

const AreaLegend: React.FC<AreaLegendProps> = ({
  areaPlots,
  isExpanded,
  onToggleExpanded,
  onRemoveArea
}) => {
  const theme = useTheme();

  const getAreaTypeColors = (type: string) => {
    const colorMap: Record<string, { fill: string; outline: string; text: string }> = {
      'fra_title': {
        fill: alpha(theme.palette.success.main, 0.3),
        outline: theme.palette.success.main,
        text: theme.palette.success.dark
      },
      'village_boundary': {
        fill: alpha(theme.palette.info.main, 0.3),
        outline: theme.palette.info.main,
        text: theme.palette.info.dark
      },
      'forest_compartment': {
        fill: alpha(theme.palette.warning.main, 0.3),
        outline: theme.palette.warning.main,
        text: theme.palette.warning.dark
      },
      'revenue_land': {
        fill: alpha(theme.palette.error.main, 0.3),
        outline: theme.palette.error.main,
        text: theme.palette.error.dark
      }
    };
    return colorMap[type] || colorMap['fra_title'];
  };

  const getPatternIcon = (pattern: string) => {
    switch (pattern) {
      case 'hatched':
        return <GridOn fontSize="small" />;
      case 'dotted':
        return <Circle fontSize="small" />;
      case 'striped':
        return <Remove fontSize="small" />;
      default:
        return <CropSquare fontSize="small" />;
    }
  };

  const totalArea = areaPlots.reduce((sum, plot) => sum + plot.area, 0);

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'absolute',
        top: 20,
        right: 20,
        width: 320,
        maxHeight: '70vh',
        overflow: 'hidden',
        borderRadius: 3,
        backdropFilter: 'blur(12px)',
        background: alpha(theme.palette.background.paper, 0.95),
        border: 1,
        borderColor: 'divider',
        zIndex: 1000,
        transition: 'all 0.3s ease-in-out'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          background: alpha(theme.palette.primary.main, 0.05),
          cursor: 'pointer'
        }}
        onClick={onToggleExpanded}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
            Area Legend
          </Typography>
          <IconButton size="small" sx={{ color: 'primary.main' }}>
            {isExpanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
        
        {areaPlots.length > 0 && (
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={`${areaPlots.length} Areas`}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Typography variant="body2" color="text.secondary">
              Total: {totalArea.toFixed(2)} ha
            </Typography>
          </Box>
        )}
      </Box>

      {/* Content */}
      <Collapse in={isExpanded}>
        <Box sx={{ maxHeight: '50vh', overflow: 'auto' }}>
          {areaPlots.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No areas plotted yet
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Draw polygons on the map to create area plots
              </Typography>
            </Box>
          ) : (
            <Box sx={{ p: 1 }}>
              {areaPlots.map((plot) => {
                const colors = getAreaTypeColors(plot.type);
                return (
                  <Paper
                    key={plot.id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      mb: 1,
                      borderRadius: 2,
                      borderColor: colors.outline,
                      background: alpha(colors.fill, 0.1),
                      '&:hover': {
                        background: alpha(colors.fill, 0.2),
                        transform: 'translateY(-1px)',
                        boxShadow: 2
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: 1,
                              bgcolor: colors.fill,
                              border: 2,
                              borderColor: colors.outline,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {getPatternIcon(plot.pattern)}
                          </Box>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 600,
                              color: colors.text,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {plot.properties.name}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                          <Chip
                            label={plot.type.replace('_', ' ').toUpperCase()}
                            size="small"
                            sx={{
                              bgcolor: colors.fill,
                              color: colors.text,
                              fontSize: '0.7rem',
                              height: 20
                            }}
                          />
                          <Chip
                            label={plot.pattern}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: colors.outline,
                              color: colors.text,
                              fontSize: '0.7rem',
                              height: 20
                            }}
                          />
                        </Box>
                        
                        <Typography variant="body2" sx={{ fontWeight: 600, color: colors.text }}>
                          {plot.area.toFixed(2)} hectares
                        </Typography>
                        
                        <Typography variant="caption" color="text.secondary">
                          Status: {plot.properties.status}
                        </Typography>
                      </Box>
                      
                      {onRemoveArea && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveArea(plot.id);
                          }}
                          sx={{
                            color: 'error.main',
                            '&:hover': {
                              bgcolor: alpha(theme.palette.error.main, 0.1)
                            }
                          }}
                        >
                          <Remove fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default AreaLegend;
