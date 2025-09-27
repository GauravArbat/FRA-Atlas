import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Button,
  Stack,
  Avatar,
  LinearProgress,
  useTheme,
  alpha,
  Fade,
  Skeleton
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Assessment,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Timeline,
  Download,
  Refresh,
  FilterList,
  Insights,
  Analytics,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { api } from '../services/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart
} from 'recharts';

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon, color }) => {
  const theme = useTheme();
  const isPositive = change >= 0;

  return (
    <Card
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
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>
            {icon}
          </Avatar>
          <Chip
            icon={isPositive ? <TrendingUp /> : <TrendingDown />}
            label={`${isPositive ? '+' : ''}${change}%`}
            size="small"
            sx={{
              bgcolor: isPositive ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
              color: isPositive ? theme.palette.success.main : theme.palette.error.main,
              fontWeight: 600
            }}
          />
        </Stack>
        <Typography variant="h4" fontWeight={700} color={color} mb={0.5}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          <span data-translate>{title}</span>
        </Typography>
      </CardContent>
    </Card>
  );
};

const ChartCard: React.FC<{ title: string; children: React.ReactNode; actions?: React.ReactNode }> = ({
  title,
  children,
  actions
}) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        height: '100%',
        background: theme.palette.background.paper,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`
        }
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ p: 3, pb: 2 }}
        >
          <Typography variant="h6" fontWeight={600} color="text.primary">
            <span data-translate>{title}</span>
          </Typography>
          {actions && (
            <Stack direction="row" spacing={1}>
              {actions}
            </Stack>
          )}
        </Stack>
        <Box sx={{ px: 3, pb: 3 }}>{children}</Box>
      </CardContent>
    </Card>
  );
};

const Reports: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/fra/reports/summary');
        setData(res.data);
      } catch (error) {
        console.error('Error fetching reports data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const COLORS = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    info: theme.palette.info.main
  };

  const PIE_COLORS = [COLORS.primary, COLORS.secondary, COLORS.success, COLORS.warning, COLORS.info];

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={300} height={48} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 1 }} />
            </Grid>
          ))}
          <Grid item xs={12}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 1 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight={400}>
        <Typography variant="h6" color="text.secondary">
          <span data-translate>No data available</span>
        </Typography>
      </Box>
    );
  }

  return (
    <Fade in timeout={800}>
      <Box>
        {/* Header */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          mb={4}
        >
          <Box>
            <Typography
              variant="h3"
              fontWeight={700}
              color="text.primary"
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              <span data-translate>Reports & Analytics</span>
            </Typography>
            <Typography variant="body1" color="text.secondary" fontWeight={500}>
              <span data-translate>Comprehensive insights and performance metrics</span>
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              sx={{ borderRadius: 2 }}
            >
              <span data-translate>Filters</span>
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              sx={{ borderRadius: 2 }}
            >
              <span data-translate>Export</span>
            </Button>
            <IconButton
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
              }}
            >
              <Refresh />
            </IconButton>
          </Stack>
        </Stack>

        {/* Metrics Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Total Beneficiaries"
              value="12,847"
              change={12.5}
              icon={<Assessment />}
              color={COLORS.primary}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Active Claims"
              value="3,256"
              change={8.2}
              icon={<DashboardIcon />}
              color={COLORS.success}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Processed This Month"
              value="1,847"
              change={-2.1}
              icon={<Timeline />}
              color={COLORS.warning}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Success Rate"
              value="94.2%"
              change={5.7}
              icon={<Insights />}
              color={COLORS.info}
            />
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3}>
          {/* Beneficiaries Trend */}
          <Grid item xs={12}>
            <ChartCard
              title="Beneficiaries Growth Trend"
              actions={
                <>
                  <IconButton size="small">
                    <BarChartIcon />
                  </IconButton>
                  <IconButton size="small">
                    <Timeline />
                  </IconButton>
                </>
              }
            >
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={data.timeseries}>
                  <defs>
                    <linearGradient id="colorBeneficiaries" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      borderRadius: 8,
                      boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="beneficiaries"
                    stroke={COLORS.primary}
                    strokeWidth={3}
                    fill="url(#colorBeneficiaries)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>

          {/* Distribution Charts */}
          <Grid item xs={12} md={6}>
            <ChartCard
              title="Claims by Type"
              actions={
                <IconButton size="small">
                  <PieChartIcon />
                </IconButton>
              }
            >
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    dataKey="value"
                    data={data.byType}
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={40}
                    paddingAngle={2}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {data.byType.map((_: any, idx: number) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend
                    wrapperStyle={{
                      paddingTop: '20px',
                      fontSize: '14px'
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      borderRadius: 8
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>

          {/* Top Districts */}
          <Grid item xs={12} md={6}>
            <ChartCard
              title="Top Performing Districts"
              actions={
                <IconButton size="small">
                  <BarChartIcon />
                </IconButton>
              }
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.topDistricts} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      borderRadius: 8
                    }}
                  />
                  <Bar
                    dataKey="beneficiaries"
                    fill={COLORS.secondary}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>

          {/* Performance Indicators */}
          <Grid item xs={12}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${alpha(COLORS.primary, 0.05)} 0%, ${alpha(COLORS.secondary, 0.05)} 100%)`,
                border: `1px solid ${alpha(COLORS.primary, 0.1)}`
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} mb={3}>
                  <span data-translate>Key Performance Indicators</span>
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        <span data-translate>Processing Efficiency</span>
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={87}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: alpha(COLORS.primary, 0.1),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            bgcolor: COLORS.primary
                          }
                        }}
                      />
                      <Typography variant="body2" fontWeight={600} mt={1}>
                        87%
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        <span data-translate>Data Quality</span>
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={94}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: alpha(COLORS.success, 0.1),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            bgcolor: COLORS.success
                          }
                        }}
                      />
                      <Typography variant="body2" fontWeight={600} mt={1}>
                        94%
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        <span data-translate>User Satisfaction</span>
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={91}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: alpha(COLORS.info, 0.1),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            bgcolor: COLORS.info
                          }
                        }}
                      />
                      <Typography variant="body2" fontWeight={600} mt={1}>
                        91%
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        <span data-translate>System Uptime</span>
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={99}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: alpha(COLORS.warning, 0.1),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            bgcolor: COLORS.warning
                          }
                        }}
                      />
                      <Typography variant="body2" fontWeight={600} mt={1}>
                        99.2%
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );
};

export default Reports;



