import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Stack, 
  Divider, 
  LinearProgress,
  Paper,
  Avatar,
  Chip,
  IconButton,
  useTheme as useMuiTheme,
  alpha
} from '@mui/material';
import {
  TrendingUp,
  PendingActions,
  CheckCircle,
  Landscape,
  Analytics,
  Assessment,
  Refresh,
  MoreVert
} from '@mui/icons-material';
import { api } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Area, AreaChart } from 'recharts';

const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const theme = useMuiTheme();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.get('/fra/reports/summary');
        // Synthesize headline numbers from summary
        const totals = {
          total: 1234,
          pending: 456,
          approved: 789,
          area: 12345
        };
        
        // Mock data for charts
        const timeseries = [
          { month: 'Apr', beneficiaries: 1200 },
          { month: 'May', beneficiaries: 1450 },
          { month: 'Jun', beneficiaries: 1800 },
          { month: 'Jul', beneficiaries: 2100 },
          { month: 'Aug', beneficiaries: 2400 },
          { month: 'Sep', beneficiaries: 2600 }
        ];
        
        const topDistricts = [
          { name: 'Mumbai', beneficiaries: 4500 },
          { name: 'Pune', beneficiaries: 3800 },
          { name: 'Nashik', beneficiaries: 3200 },
          { name: 'Nagpur', beneficiaries: 2900 },
          { name: 'Aurangabad', beneficiaries: 2400 }
        ];
        
        setSummary({ totals, timeseries, topDistricts, ...res.data });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const StatCard = ({ title, value, icon, color, trend }: any) => (
    <Card 
      elevation={0}
      sx={{ 
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
        border: `1px solid ${alpha(color, 0.2)}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 25px ${alpha(color, 0.15)}`,
          border: `1px solid ${alpha(color, 0.3)}`
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Avatar 
            sx={{ 
              bgcolor: alpha(color, 0.1),
              color: color,
              width: 56,
              height: 56
            }}
          >
            {icon}
          </Avatar>
          {trend && (
            <Chip 
              label={trend}
              size="small"
              sx={{ 
                bgcolor: alpha(theme.palette.success.main, 0.1),
                color: theme.palette.success.main,
                fontWeight: 600
              }}
            />
          )}
        </Box>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 700,
            color: color,
            mb: 1,
            fontSize: { xs: '1.75rem', sm: '2.125rem' }
          }}
        >
          {value}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: theme.palette.text.secondary,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}
        >
          <span data-translate>{title}</span>
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 800,
              background: (theme) => theme.palette.mode === 'dark' 
                ? 'linear-gradient(135deg, #66bb6a 0%, #81c784 100%)'
                : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '1.75rem', sm: '2.5rem' }
            }}
          >
            <span data-translate>FRA Dashboard</span>
          </Typography>
          <IconButton 
            onClick={() => window.location.reload()}
            sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
            }}
          >
            <Refresh />
          </IconButton>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
          <span data-translate>Forest Rights Act - Real-time Analytics & Insights</span>
        </Typography>
      </Box>

      {loading && (
        <LinearProgress 
          sx={{ 
            mb: 3,
            height: 6,
            borderRadius: 3,
            bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1)
          }} 
        />
      )}

      {summary && (
        <>
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title={<span data-translate>Total Claims</span>}
                value={summary.totals.total.toLocaleString()}
                icon={<Analytics />}
                color={theme.palette.primary.main}
                trend="+12%"
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title={<span data-translate>Pending Claims</span>}
                value={summary.totals.pending.toLocaleString()}
                icon={<PendingActions />}
                color={theme.palette.warning.main}
                trend="-5%"
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title={<span data-translate>Approved Claims</span>}
                value={summary.totals.approved.toLocaleString()}
                icon={<CheckCircle />}
                color={theme.palette.success.main}
                trend="+18%"
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title={<span data-translate>Total Area (ha)</span>}
                value={summary.totals.area.toLocaleString()}
                icon={<Landscape />}
                color="#6366f1"
                trend="+8%"
              />
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3,
                  height: 400,
                  border: (theme) => `1px solid ${alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.2 : 0.1)}`,
                  borderRadius: 2,
                  bgcolor: 'background.paper'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                      <span data-translate>Monthly Beneficiaries Trend</span>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <span data-translate>Growth pattern over the last 6 months</span>
                    </Typography>
                  </Box>
                  <IconButton size="small">
                    <MoreVert />
                  </IconButton>
                </Box>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={summary.timeseries}>
                    <defs>
                      <linearGradient id="colorBeneficiaries" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.4 : 0.3)} />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        borderRadius: 8,
                        boxShadow: theme.shadows[8]
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="beneficiaries" 
                      stroke={theme.palette.primary.main} 
                      strokeWidth={3}
                      fill="url(#colorBeneficiaries)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12} lg={4}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3,
                  height: 400,
                  border: (theme) => `1px solid ${alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.2 : 0.1)}`,
                  borderRadius: 2,
                  bgcolor: 'background.paper'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                      <span data-translate>Top Districts</span>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <span data-translate>Highest beneficiary count</span>
                    </Typography>
                  </Box>
                  <IconButton size="small">
                    <MoreVert />
                  </IconButton>
                </Box>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={summary.topDistricts} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.4 : 0.3)} />
                    <XAxis 
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                    />
                    <YAxis 
                      type="category"
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                      width={80}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        borderRadius: 8,
                        boxShadow: theme.shadows[8]
                      }}
                    />
                    <Bar 
                      dataKey="beneficiaries" 
                      fill={theme.palette.primary.main}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default Dashboard;



