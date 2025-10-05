import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Grid,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { TrendingUp, Assessment, LocationOn } from '@mui/icons-material';
import { fraProgressService, FRAProgress, realTimeProgressUpdater } from '../services/fraProgressService';

const FRAProgressTracker: React.FC = () => {
  const [currentLevel, setCurrentLevel] = useState<'state' | 'district' | 'block' | 'village'>('state');
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [progressData, setProgressData] = useState<FRAProgress[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProgressData();
    
    // Start real-time updates
    realTimeProgressUpdater.startRealTimeUpdates(
      (updatedData) => {
        setProgressData(updatedData);
        console.log('🔄 Progress data updated in real-time');
      },
      currentLevel,
      selectedEntity
    );
    
    // Cleanup on unmount
    return () => {
      realTimeProgressUpdater.stopRealTimeUpdates();
    };
  }, [currentLevel, selectedEntity]);

  const loadProgressData = async () => {
    setLoading(true);
    try {
      const data = await fraProgressService.getProgressData(currentLevel, selectedEntity);
      setProgressData(data);
    } catch (error) {
      console.error('Failed to load progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  const getTotalStats = () => {
    const totals = progressData.reduce((acc, item) => ({
      totalClaims: acc.totalClaims + item.totalClaims,
      grantedClaims: acc.grantedClaims + item.grantedClaims,
      pendingClaims: acc.pendingClaims + item.pendingClaims,
      totalArea: acc.totalArea + item.totalArea,
      grantedArea: acc.grantedArea + item.grantedArea
    }), { totalClaims: 0, grantedClaims: 0, pendingClaims: 0, totalArea: 0, grantedArea: 0 });

    return {
      ...totals,
      progressPercentage: totals.totalClaims > 0 ? Math.round((totals.grantedClaims / totals.totalClaims) * 100) : 0
    };
  };

  const totalStats = getTotalStats();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TrendingUp /> FRA Progress Tracking
        <Chip 
          label="LIVE" 
          color="success" 
          size="small"
          sx={{ 
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': { opacity: 1 },
              '50%': { opacity: 0.5 },
              '100%': { opacity: 1 }
            }
          }}
        />
      </Typography>

      {/* Level Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Administrative Level</InputLabel>
                <Select
                  value={currentLevel}
                  onChange={(e) => {
                    setCurrentLevel(e.target.value as any);
                    setSelectedEntity('');
                  }}
                >
                  <MenuItem value="state">State Level</MenuItem>
                  <MenuItem value="district">District Level</MenuItem>
                  <MenuItem value="block">Block Level</MenuItem>
                  <MenuItem value="village">Village Level</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {currentLevel !== 'state' && (
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Select {currentLevel === 'district' ? 'State' : currentLevel === 'block' ? 'District' : 'Block'}</InputLabel>
                  <Select
                    value={selectedEntity}
                    onChange={(e) => setSelectedEntity(e.target.value)}
                  >
                    <MenuItem value="Madhya Pradesh">Madhya Pradesh</MenuItem>
                    <MenuItem value="Tripura">Tripura</MenuItem>
                    <MenuItem value="Odisha">Odisha</MenuItem>
                    <MenuItem value="Telangana">Telangana</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">Total Claims</Typography>
              <Typography variant="h4">{totalStats.totalClaims}</Typography>
              <Typography variant="body2" color="text.secondary">
                Across all {currentLevel}s
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">Granted</Typography>
              <Typography variant="h4">{totalStats.grantedClaims}</Typography>
              <Typography variant="body2" color="text.secondary">
                {totalStats.progressPercentage}% of total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">Pending</Typography>
              <Typography variant="h4">{totalStats.pendingClaims}</Typography>
              <Typography variant="body2" color="text.secondary">
                Under review
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="info.main">Total Area</Typography>
              <Typography variant="h4">{totalStats.totalArea.toFixed(1)}</Typography>
              <Typography variant="body2" color="text.secondary">
                Hectares claimed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Progress Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assessment /> {currentLevel.charAt(0).toUpperCase() + currentLevel.slice(1)} Level Progress
          </Typography>
          
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{currentLevel.charAt(0).toUpperCase() + currentLevel.slice(1)} Name</TableCell>
                  <TableCell align="center">Total Claims</TableCell>
                  <TableCell align="center">Granted</TableCell>
                  <TableCell align="center">Pending</TableCell>
                  <TableCell align="center">Progress</TableCell>
                  <TableCell align="center">Area (Ha)</TableCell>
                  <TableCell align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {progressData.map((item, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOn fontSize="small" color="primary" />
                        {item.name}
                      </Box>
                    </TableCell>
                    <TableCell align="center">{item.totalClaims}</TableCell>
                    <TableCell align="center">{item.grantedClaims}</TableCell>
                    <TableCell align="center">{item.pendingClaims}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ minWidth: 100 }}>
                        <LinearProgress
                          variant="determinate"
                          value={item.progressPercentage}
                          color={getStatusColor(item.progressPercentage)}
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="body2">{item.progressPercentage}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      {item.grantedArea.toFixed(1)} / {item.totalArea.toFixed(1)}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={
                          item.progressPercentage >= 80 ? 'Excellent' :
                          item.progressPercentage >= 60 ? 'Good' : 'Needs Attention'
                        }
                        color={getStatusColor(item.progressPercentage)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default FRAProgressTracker;