import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Breadcrumbs,
  Link,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
  Chip
} from '@mui/material';
import { Home, NavigateNext } from '@mui/icons-material';
import { api } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from 'recharts';

const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.get('/fra/reports/summary');
        setSummary({
          totals: {
            total: 42567890,
            approved: 21345670,
            pending: 18456780,
            area: 35678900
          },
          districts: [
            { name: 'Maharashtra', district: 'Gadchiroli', totalClaims: 12345, approved: 8765, rejected: 2340, pending: 1240 },
            { name: 'Madhya Pradesh', district: 'Dindori', totalClaims: 10987, approved: 7654, rejected: 1987, pending: 1346 },
            { name: 'Chhattisgarh', district: 'Bastar', totalClaims: 9876, approved: 5432, rejected: 2109, pending: 2335 },
            { name: 'Jharkhand', district: 'Gumla', totalClaims: 8765, approved: 4321, rejected: 3210, pending: 1234 },
            { name: 'Odisha', district: 'Mayurbhanj', totalClaims: 7654, approved: 3210, rejected: 2109, pending: 2335 }
          ],
          ...res.data
        });
      } catch (error) {
        setSummary({
          totals: {
            total: 42567890,
            approved: 21345670,
            pending: 18456780,
            area: 35678900
          },
          districts: [
            { name: 'Maharashtra', district: 'Gadchiroli', totalClaims: 12345, approved: 8765, rejected: 2340, pending: 1240 },
            { name: 'Madhya Pradesh', district: 'Dindori', totalClaims: 10987, approved: 7654, rejected: 1987, pending: 1346 },
            { name: 'Chhattisgarh', district: 'Bastar', totalClaims: 9876, approved: 5432, rejected: 2109, pending: 2335 },
            { name: 'Jharkhand', district: 'Gumla', totalClaims: 8765, approved: 4321, rejected: 3210, pending: 1234 },
            { name: 'Odisha', district: 'Mayurbhanj', totalClaims: 7654, approved: 3210, rejected: 2109, pending: 2335 }
          ]
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Box>
      {/* Breadcrumb */}
      <Box sx={{ bgcolor: 'white', p: 2, borderBottom: '1px solid #ddd' }}>
        <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
          <Link color="inherit" href="/" sx={{ display: 'flex', alignItems: 'center' }}>
            <Home sx={{ mr: 0.5, fontSize: 16 }} />
            Home
          </Link>
          <Typography color="text.primary">Dashboard</Typography>
        </Breadcrumbs>
      </Box>

      <Box sx={{ p: 3 }}>
        {/* Page Title */}
        <Typography variant="h4" sx={{ mb: 3, color: '#1976d2', fontWeight: 600 }}>
          FRA Dashboard
        </Typography>

        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} md={8}>
            {/* Stats Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Card sx={{ bgcolor: '#e3f2fd', border: '1px solid #1976d2' }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h4" sx={{ color: '#1976d2', fontWeight: 700 }}>
                      42,56,789
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 600 }}>
                      Total Claims
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card sx={{ bgcolor: '#e8f5e8', border: '1px solid #4caf50' }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 700 }}>
                      21,34,567
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 600 }}>
                      Approved Claims
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card sx={{ bgcolor: '#fff3e0', border: '1px solid #ff9800' }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 700 }}>
                      18,45,678
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ff9800', fontWeight: 600 }}>
                      Pending Claims
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card sx={{ bgcolor: '#f3e5f5', border: '1px solid #9c27b0' }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h4" sx={{ color: '#9c27b0', fontWeight: 700 }}>
                      35,67,890
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#9c27b0', fontWeight: 600 }}>
                      Total Area (HA)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* District-wise Claims Status */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 600 }}>
                  District-wise Claims Status
                </Typography>
                <Box sx={{ height: 200, mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 8 }}>
                    [Bar Chart: District-wise Claims Dashboard]
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 600 }}>
                  Monthly Trend of Claim Processing
                </Typography>
                <Box sx={{ height: 200, mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 8 }}>
                    [Line Chart: Monthly Trend Data]
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} md={4}>
            {/* Quick Links */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, bgcolor: '#1976d2', color: 'white', p: 1, mx: -2, mt: -2 }}>
                  Quick Links
                </Typography>
                <List dense>
                  <ListItem button>
                    <ListItemText primary="FRA Rules, 2008" />
                  </ListItem>
                  <ListItem button>
                    <ListItemText primary="Guidelines" />
                  </ListItem>
                  <ListItem button>
                    <ListItemText primary="Circulars & Guidelines" />
                  </ListItem>
                  <ListItem button>
                    <ListItemText primary="Training Manual" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: 'white', fontWeight: 600, bgcolor: '#1976d2', p: 1, mx: -2, mt: -2 }}>
                  Notifications
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Digitization" 
                      secondary="New Guidelines for FRA Implementation"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Standardization" 
                      secondary="Updated Forms and Procedures"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Spatial Integration" 
                      secondary="GIS Mapping Guidelines"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {/* News & Updates */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: 'white', fontWeight: 600, bgcolor: '#1976d2', p: 1, mx: -2, mt: -2 }}>
                  News & Updates
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Workshop on GIS Mapping" 
                      secondary="15 Nov 2024"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="FRA Progress Review" 
                      secondary="12 Nov 2024"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="New Guidelines for HABITAT" 
                      secondary="10 Nov 2024"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {/* Important Documents */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: 'white', fontWeight: 600, bgcolor: '#1976d2', p: 1, mx: -2, mt: -2 }}>
                  Important Documents
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="Guidelines 2023" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Formats" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Standard Operating Procedures" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Data Table */}
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 600 }}>
                State-wise FRA Implementation Status
              </Typography>
              <Button variant="outlined" size="small">View All</Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#1976d2' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>S.No</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>State</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>District</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Total Claims</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Approved</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Rejected</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Pending</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summary?.districts?.map((row: any, index: number) => (
                    <TableRow key={index} sx={{ '&:nth-of-type(odd)': { bgcolor: '#f9f9f9' } }}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.district}</TableCell>
                      <TableCell>{row.totalClaims.toLocaleString()}</TableCell>
                      <TableCell>{row.approved.toLocaleString()}</TableCell>
                      <TableCell>{row.rejected.toLocaleString()}</TableCell>
                      <TableCell>{row.pending.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button variant="text" size="small">Previous</Button>
              <Button variant="contained" size="small" sx={{ mx: 1 }}>1</Button>
              <Button variant="text" size="small">2</Button>
              <Button variant="text" size="small">3</Button>
              <Button variant="text" size="small">4</Button>
              <Button variant="text" size="small">5</Button>
              <Button variant="text" size="small">Next</Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Dashboard;



