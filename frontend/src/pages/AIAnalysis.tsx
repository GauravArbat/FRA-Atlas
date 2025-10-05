import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { 
  Psychology, 
  ExpandMore, 
  TrendingUp, 
  Assessment, 
  Recommend,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api } from '../services/api';
import { usePageTranslation } from '../hooks/usePageTranslation';

interface DashboardData {
  total_villages_analyzed: number;
  high_priority_villages: number;
  schemes_recommended: Record<string, number>;
  satellite_coverage: Record<string, number>;
  priority_distribution: Record<string, number>;
  recent_analyses: Array<{
    village_name: string;
    state: string;
    priority_score: number;
    top_scheme: string;
    analyzed_at: string;
  }>;
}

const AIAnalysis: React.FC = () => {
  usePageTranslation();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dss/dashboard');
      setDashboardData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!dashboardData) return null;

  const schemeData = Object.entries(dashboardData.schemes_recommended).map(([scheme, count]) => ({
    name: scheme.replace('_', '-'),
    value: count
  }));

  const priorityData = Object.entries(dashboardData.priority_distribution).map(([priority, percentage]) => ({
    name: priority,
    value: percentage
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Psychology /> <span data-translate>AI Analysis Dashboard</span>
      </Typography>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                <span data-translate>Villages Analyzed</span>
              </Typography>
              <Typography variant="h4">
                {dashboardData.total_villages_analyzed.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                <span data-translate>High Priority Villages</span>
              </Typography>
              <Typography variant="h4" color="error">
                {dashboardData.high_priority_villages}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                <span data-translate>Satellite Coverage</span>
              </Typography>
              <Typography variant="h4" color="success.main">
                {Object.values(dashboardData.satellite_coverage).reduce((a, b) => a + b, 0) / 4}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                <span data-translate>Schemes Recommended</span>
              </Typography>
              <Typography variant="h4" color="primary">
                {Object.values(dashboardData.schemes_recommended).reduce((a, b) => a + b, 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Scheme Recommendations Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <span data-translate>Scheme Recommendations</span>
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={schemeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Priority Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <span data-translate>Priority Distribution</span>
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Satellite Coverage Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <span data-translate>Satellite Data Coverage</span>
              </Typography>
              {Object.entries(dashboardData.satellite_coverage).map(([type, coverage]) => (
                <Box key={type} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      {type.replace('_', ' ').toUpperCase()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {coverage}%
                    </Typography>
                  </Box>
                  <Box sx={{ width: '100%', bgcolor: 'grey.300', borderRadius: 1 }}>
                    <Box
                      sx={{
                        width: `${coverage}%`,
                        bgcolor: coverage > 95 ? 'success.main' : coverage > 85 ? 'warning.main' : 'error.main',
                        height: 8,
                        borderRadius: 1
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Analyses */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <span data-translate>Recent Analyses</span>
              </Typography>
              <List>
                {dashboardData.recent_analyses.map((analysis, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Assessment color={analysis.priority_score > 70 ? 'error' : 'primary'} />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${analysis.village_name}, ${analysis.state}`}
                      secondary={
                        <Box>
                          <Typography variant="body2" component="span">
                            Priority: {analysis.priority_score} | Top Scheme: {analysis.top_scheme}
                          </Typography>
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(analysis.analyzed_at).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* AI Model Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <span data-translate>AI/ML Model Information</span>
              </Typography>
              
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography><span data-translate>Priority Scoring Model</span></Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" paragraph>
                    <span data-translate>Random Forest Regressor trained on satellite-derived features including NDVI, water availability, forest cover, and infrastructure metrics combined with FRA claim data.</span>
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={<span data-translate>Random Forest</span>} size="small" />
                    <Chip label={<span data-translate>100 Estimators</span>} size="small" />
                    <Chip label={<span data-translate>Satellite Features</span>} size="small" />
                    <Chip label={<span data-translate>FRA Data</span>} size="small" />
                  </Box>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography><span data-translate>Satellite Data Sources</span></Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText primary={<span data-translate>Sentinel-2 (NDVI Analysis)</span>} secondary={<span data-translate>10m resolution, cloud-filtered</span>} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText primary={<span data-translate>JRC Global Surface Water</span>} secondary={<span data-translate>Water occurrence mapping</span>} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText primary={<span data-translate>ESA WorldCover</span>} secondary={<span data-translate>Land use classification</span>} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText primary={<span data-translate>VIIRS Nighttime Lights</span>} secondary={<span data-translate>Infrastructure assessment</span>} />
                    </ListItem>
                  </List>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography><span data-translate>Scheme Recommendation Rules</span></Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" gutterBottom><span data-translate>PM-KISAN</span></Typography>
                      <Typography variant="body2">
                        <span data-translate>• High agricultural potential (NDVI &gt; 0.6)<br/>• Significant cropland area<br/>• Valid FRA titles</span>
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" gutterBottom><span data-translate>Jal Jeevan Mission</span></Typography>
                      <Typography variant="body2">
                        <span data-translate>• Low water availability<br/>• High population density<br/>• Poor infrastructure</span>
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" gutterBottom><span data-translate>MGNREGA</span></Typography>
                      <Typography variant="body2">
                        <span data-translate>• High population<br/>• Low infrastructure level<br/>• Active FRA claims</span>
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" gutterBottom><span data-translate>DAJGUA</span></Typography>
                      <Typography variant="body2">
                        <span data-translate>• FRA claims/titles present<br/>• High forest cover<br/>• Low infrastructure</span>
                      </Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AIAnalysis;