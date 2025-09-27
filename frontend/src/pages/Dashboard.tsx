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
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, CartesianGrid, Tooltip, Legend } from 'recharts';

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
            <span data-translate>Home</span>
          </Link>
          <Typography color="text.primary"><span data-translate>Dashboard</span></Typography>
        </Breadcrumbs>
      </Box>

      <Box sx={{ p: 3 }}>
        {/* Page Title */}
        <Typography variant="h4" sx={{ mb: 3, color: '#1976d2', fontWeight: 600 }}>
          <span data-translate>FRA Dashboard</span>
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
                      <span data-translate>Total Claims</span>
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
                      <span data-translate>Approved Claims</span>
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
                      <span data-translate>Pending Claims</span>
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
                      <span data-translate>Total Area (HA)</span>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* District-wise Claims Status */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 600 }}>
                  <span data-translate>District-wise Claims Status</span>
                </Typography>
                <Box sx={{ height: 300, p: 2, bgcolor: '#fafafa', borderRadius: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary?.districts || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        dataKey="district" 
                        tick={{ fontSize: 12, fill: '#666' }}
                        axisLine={{ stroke: '#ccc' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#666' }}
                        axisLine={{ stroke: '#ccc' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #ddd', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                      />
                      <Bar dataKey="approved" fill="#4caf50" name="Approved" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pending" fill="#ff9800" name="Pending" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="rejected" fill="#f44336" name="Rejected" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 600 }}>
                  <span data-translate>Monthly Trend of Claim Processing</span>
                </Typography>
                <Box sx={{ height: 300, p: 2, bgcolor: '#fafafa', borderRadius: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={[
                        { month: 'Jan', claims: 1200, approved: 800, pending: 400 },
                        { month: 'Feb', claims: 1800, approved: 1200, pending: 600 },
                        { month: 'Mar', claims: 2200, approved: 1500, pending: 700 },
                        { month: 'Apr', claims: 1900, approved: 1300, pending: 600 },
                        { month: 'May', claims: 2400, approved: 1700, pending: 700 },
                        { month: 'Jun', claims: 2800, approved: 2000, pending: 800 }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12, fill: '#666' }}
                        axisLine={{ stroke: '#ccc' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#666' }}
                        axisLine={{ stroke: '#ccc' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #ddd', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="claims" 
                        stroke="#1976d2" 
                        strokeWidth={3}
                        dot={{ fill: '#1976d2', strokeWidth: 2, r: 6 }}
                        activeDot={{ r: 8, stroke: '#1976d2', strokeWidth: 2 }}
                        name="Total Claims"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="approved" 
                        stroke="#4caf50" 
                        strokeWidth={2}
                        dot={{ fill: '#4caf50', strokeWidth: 2, r: 4 }}
                        name="Approved"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="pending" 
                        stroke="#ff9800" 
                        strokeWidth={2}
                        dot={{ fill: '#ff9800', strokeWidth: 2, r: 4 }}
                        name="Pending"
                      />
                    </LineChart>
                  </ResponsiveContainer>
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
                  <span data-translate>Quick Links</span>
                </Typography>
                <List dense>
                  <ListItem button>
                    <ListItemText primary={<span data-translate>FRA Rules, 2008</span>} />
                  </ListItem>
                  <ListItem button>
                    <ListItemText primary={<span data-translate>Guidelines</span>} />
                  </ListItem>
                  <ListItem button>
                    <ListItemText primary={<span data-translate>Circulars & Guidelines</span>} />
                  </ListItem>
                  <ListItem button>
                    <ListItemText primary={<span data-translate>Training Manual</span>} />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: 'white', fontWeight: 600, bgcolor: '#1976d2', p: 1, mx: -2, mt: -2 }}>
                  <span data-translate>Notifications</span>
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary={<span data-translate>Digitization</span>}
                      secondary={<span data-translate>New Guidelines for FRA Implementation</span>}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary={<span data-translate>Standardization</span>}
                      secondary={<span data-translate>Updated Forms and Procedures</span>}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary={<span data-translate>Spatial Integration</span>}
                      secondary={<span data-translate>GIS Mapping Guidelines</span>}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {/* News & Updates */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: 'white', fontWeight: 600, bgcolor: '#1976d2', p: 1, mx: -2, mt: -2 }}>
                  <span data-translate>News & Updates</span>
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary={<span data-translate>Workshop on GIS Mapping</span>}
                      secondary="15 Nov 2024"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary={<span data-translate>FRA Progress Review</span>}
                      secondary="12 Nov 2024"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary={<span data-translate>New Guidelines for HABITAT</span>}
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
                  <span data-translate>Important Documents</span>
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary={<span data-translate>Guidelines 2023</span>} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary={<span data-translate>Formats</span>} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary={<span data-translate>Standard Operating Procedures</span>} />
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
                <span data-translate>State-wise FRA Implementation Status</span>
              </Typography>
              <Button variant="outlined" size="small"><span data-translate>View All</span></Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#1976d2' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}><span data-translate>S.No</span></TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}><span data-translate>State</span></TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}><span data-translate>District</span></TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}><span data-translate>Total Claims</span></TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}><span data-translate>Approved</span></TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}><span data-translate>Rejected</span></TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}><span data-translate>Pending</span></TableCell>
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
              <Button variant="text" size="small"><span data-translate>Previous</span></Button>
              <Button variant="contained" size="small" sx={{ mx: 1 }}>1</Button>
              <Button variant="text" size="small">2</Button>
              <Button variant="text" size="small">3</Button>
              <Button variant="text" size="small">4</Button>
              <Button variant="text" size="small">5</Button>
              <Button variant="text" size="small"><span data-translate>Next</span></Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Dashboard;



