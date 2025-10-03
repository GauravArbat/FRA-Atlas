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
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
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
import jsPDF from 'jspdf';
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
  const [reportDialog, setReportDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const theme = useTheme();

  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    setReportDialog(true);
  };

  const handleDownloadAllReports = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPos = 30;
    
    // Simple Header
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('GOVERNMENT OF INDIA', pageWidth/2, yPos, { align: 'center' });
    yPos += 8;
    pdf.setFontSize(12);
    pdf.text('Ministry of Tribal Affairs', pageWidth/2, yPos, { align: 'center' });
    yPos += 15;
    
    pdf.setFontSize(16);
    pdf.text('Forest Rights Act - Implementation Report', pageWidth/2, yPos, { align: 'center' });
    yPos += 20;
    
    // Report Info
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Report Period: ${new Date().toLocaleDateString()}`, 15, yPos);
    pdf.text('Status: Official', pageWidth-15, yPos, { align: 'right' });
    yPos += 20;
    
    // Weekly Performance Table
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Weekly Performance Summary', 15, yPos);
    yPos += 15;
    
    const weeklyData = [
      ['Week', 'Date Range', 'Claims', 'Approval', 'Districts', 'Beneficiaries'],
      ['52', 'Dec 23-29, 2024', '1,247', '89%', '15', '1,108'],
      ['51', 'Dec 16-22, 2024', '1,156', '92%', '18', '1,063'],
      ['50', 'Dec 9-15, 2024', '1,089', '87%', '12', '947'],
      ['49', 'Dec 2-8, 2024', '1,234', '91%', '16', '1,123'],
      ['48', 'Nov 25-Dec 1, 2024', '1,178', '88%', '14', '1,037'],
      ['47', 'Nov 18-24, 2024', '1,067', '93%', '17', '992'],
      ['46', 'Nov 11-17, 2024', '1,145', '90%', '13', '1,031'],
      ['45', 'Nov 4-10, 2024', '1,098', '86%', '15', '944']
    ];
    
    const colWidths = [20, 45, 25, 25, 25, 30];
    
    // Table
    pdf.setFontSize(9);
    weeklyData.forEach((row, rowIndex) => {
      let xPos = 15;
      pdf.setFont('helvetica', rowIndex === 0 ? 'bold' : 'normal');
      
      row.forEach((cell, colIndex) => {
        pdf.rect(xPos, yPos-5, colWidths[colIndex], 8);
        pdf.text(cell, xPos + colWidths[colIndex]/2, yPos, { align: 'center' });
        xPos += colWidths[colIndex];
      });
      yPos += 8;
    });
    
    // Summary Stats
    yPos += 20;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Summary Statistics', 15, yPos);
    yPos += 10;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const stats = [
      'Total Claims Processed: 9,214',
      'Average Approval Rate: 89.5%',
      'Districts Covered: 140',
      'Total Beneficiaries: 8,245'
    ];
    
    stats.forEach(stat => {
      pdf.text(`• ${stat}`, 15, yPos);
      yPos += 8;
    });
    
    // State Performance
    yPos += 15;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Top Performing States', 15, yPos);
    yPos += 10;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const states = [
      'Tripura: 94% success rate',
      'Odisha: 92% success rate', 
      'Telangana: 91% success rate',
      'Madhya Pradesh: 89% success rate'
    ];
    
    states.forEach(state => {
      pdf.text(`• ${state}`, 15, yPos);
      yPos += 8;
    });
    
    // Footer
    const footerY = pdf.internal.pageSize.getHeight() - 20;
    pdf.setFontSize(8);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 15, footerY);
    pdf.text('Ministry of Tribal Affairs', pageWidth/2, footerY, { align: 'center' });
    pdf.text('Page 1', pageWidth-15, footerY, { align: 'right' });
    
    pdf.save(`FRA-Weekly-Report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleDownloadReport = (report: any) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPos = 20;
    
    // Government Header
    pdf.setFillColor(25, 118, 210);
    pdf.rect(0, 0, pageWidth, 40, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('GOVERNMENT OF INDIA', pageWidth/2, 15, { align: 'center' });
    pdf.setFontSize(16);
    pdf.text('Ministry of Tribal Affairs', pageWidth/2, 25, { align: 'center' });
    pdf.setFontSize(12);
    pdf.text('Forest Rights Act - Implementation Report', pageWidth/2, 35, { align: 'center' });
    
    yPos = 55;
    pdf.setTextColor(0, 0, 0);
    
    // Report Title
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    const titleLines = pdf.splitTextToSize(report.title, pageWidth - 20);
    titleLines.forEach((line: string) => {
      pdf.text(line, pageWidth/2, yPos, { align: 'center' });
      yPos += 8;
    });
    yPos += 10;
    
    // Report Metadata
    pdf.setFillColor(240, 248, 255);
    pdf.rect(10, yPos-5, pageWidth-20, 25, 'F');
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('REPORT INFORMATION', 15, yPos);
    yPos += 15;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const metadata = [
      ['Report Period:', String(report.date)],
      ['Generated On:', new Date().toLocaleDateString()],
      ['Report Type:', report.title.includes('Weekly') ? 'Weekly Analysis' : 'Monthly Analysis'],
      ['Status:', 'Official Government Report']
    ];
    
    metadata.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, 15, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(value, 100, yPos);
      yPos += 8;
    });
    
    yPos += 15;
    
    // Key Metrics Section
    pdf.setFillColor(232, 245, 233);
    pdf.rect(10, yPos-5, pageWidth-20, 8, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('KEY PERFORMANCE METRICS', 15, yPos);
    yPos += 15;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const metricsLines = pdf.splitTextToSize(report.metrics, pageWidth - 30);
    metricsLines.forEach((line: string) => {
      pdf.text(line, 15, yPos);
      yPos += 8;
    });
    
    yPos += 15;
    
    // Executive Summary
    pdf.setFillColor(255, 248, 225);
    pdf.rect(10, yPos-5, pageWidth-20, 8, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('EXECUTIVE SUMMARY', 15, yPos);
    yPos += 15;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const summaryLines = pdf.splitTextToSize(report.summary, pageWidth - 30);
    summaryLines.forEach((line: string) => {
      if (yPos > pdf.internal.pageSize.getHeight() - 50) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.text(line, 15, yPos);
      yPos += 8;
    });
    
    yPos += 15;
    
    // Detailed Analysis (if available)
    if (data) {
      pdf.setFillColor(252, 228, 236);
      pdf.rect(10, yPos-5, pageWidth-20, 8, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('DETAILED ANALYSIS', 15, yPos);
      yPos += 15;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      
      // Add current system statistics
      const analysisData = [
        ['Total Beneficiaries:', '12,847 (12.5% increase)'],
        ['Active Claims:', '3,256 (8.2% increase)'],
        ['Monthly Processing:', '1,847 claims processed'],
        ['Success Rate:', '94.2% (5.7% improvement)'],
        ['Processing Efficiency:', '87% system efficiency'],
        ['Data Quality Score:', '94% accuracy maintained'],
        ['User Satisfaction:', '91% positive feedback'],
        ['System Uptime:', '99.2% availability']
      ];
      
      analysisData.forEach(([metric, value]) => {
        if (yPos > pdf.internal.pageSize.getHeight() - 50) {
          pdf.addPage();
          yPos = 20;
        }
        pdf.setFont('helvetica', 'bold');
        pdf.text(`• ${metric}`, 15, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(value, 100, yPos);
        yPos += 10;
      });
      
      yPos += 15;
    }
    
    // Recommendations Section
    pdf.setFillColor(248, 255, 248);
    pdf.rect(10, yPos-5, pageWidth-20, 8, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('RECOMMENDATIONS & ACTION ITEMS', 15, yPos);
    yPos += 15;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const recommendations = [
      'Continue focus on digital transformation initiatives',
      'Enhance stakeholder engagement programs',
      'Implement advanced analytics for better insights',
      'Strengthen compliance monitoring systems',
      'Expand beneficiary outreach programs'
    ];
    
    recommendations.forEach((rec, index) => {
      if (yPos > pdf.internal.pageSize.getHeight() - 50) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.text(`${index + 1}. ${rec}`, 15, yPos);
      yPos += 10;
    });
    
    // Footer
    const footerY = pdf.internal.pageSize.getHeight() - 25;
    pdf.setFillColor(245, 245, 245);
    pdf.rect(0, footerY-5, pageWidth, 20, 'F');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 15, footerY);
    pdf.text('Ministry of Tribal Affairs, Government of India', pageWidth/2, footerY+8, { align: 'center' });
    pdf.text('Confidential Government Document', pageWidth-15, footerY, { align: 'right' });
    
    // Save PDF
    const fileName = `FRA-${report.title.includes('Weekly') ? 'Weekly' : 'Monthly'}-Report-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  };

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
    primary: alpha(theme.palette.primary.main, 0.7),
    secondary: alpha(theme.palette.secondary.main, 0.7),
    success: alpha(theme.palette.success.main, 0.7),
    warning: alpha(theme.palette.warning.main, 0.7),
    error: alpha(theme.palette.error.main, 0.7),
    info: alpha(theme.palette.info.main, 0.7)
  };

  const PIE_COLORS = [
    alpha(theme.palette.primary.main, 0.8),
    alpha(theme.palette.secondary.main, 0.8),
    alpha(theme.palette.success.main, 0.8),
    alpha(theme.palette.warning.main, 0.8),
    alpha(theme.palette.info.main, 0.8)
  ];

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
              color="primary.main"
              sx={{ mb: 1 }}
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

        {/* AI Generated Reports Section */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12}>
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" fontWeight={600} mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Assessment sx={{ color: COLORS.primary }} />
                  AI-Generated Reports
                </Typography>
                
                <Grid container spacing={3}>
                  {/* Weekly Reports */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, border: `1px solid ${alpha(COLORS.success, 0.2)}`, bgcolor: alpha(COLORS.success, 0.05) }}>
                      <Typography variant="h6" fontWeight={600} mb={2} color={COLORS.success} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Timeline sx={{ fontSize: 20 }} />
                        Weekly Reports
                      </Typography>
                      
                      <Stack spacing={2}>
                        {[
                          {
                            title: "Weekly FRA Implementation Report - Week 52, 2024",
                            date: "Dec 23-29, 2024",
                            summary: "Comprehensive analysis of 1,247 new claims processed, 89% approval rate, covering 15 districts across 4 states. Key insights on tribal land rights progress.",
                            metrics: "1,247 Claims | 89% Approval | 15 Districts"
                          },
                          {
                            title: "Weekly Performance Analytics - Week 51, 2024", 
                            date: "Dec 16-22, 2024",
                            summary: "Detailed performance metrics showing 12% increase in processing efficiency, improved data quality scores, and enhanced user satisfaction ratings.",
                            metrics: "12% Efficiency ↑ | 94% Quality | 91% Satisfaction"
                          },
                          {
                            title: "Weekly Compliance & Audit Report - Week 50, 2024",
                            date: "Dec 9-15, 2024", 
                            summary: "Compliance assessment covering regulatory adherence, audit findings, risk mitigation strategies, and recommendations for process improvements.",
                            metrics: "98% Compliance | 3 Audit Items | 5 Recommendations"
                          }
                        ].map((report, index) => (
                          <Card key={index} sx={{ p: 2, border: '1px solid #e0e0e0' }}>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                              {report.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                              {report.date}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mb={2}>
                              {report.summary}
                            </Typography>
                            <Chip label={report.metrics} size="small" sx={{ mb: 2 }} />
                            <Stack direction="row" spacing={1}>
                              <Button size="small" variant="outlined" startIcon={<Assessment />} onClick={() => handleViewReport(report)}>
                                View Report
                              </Button>
                              <Button size="small" variant="text" startIcon={<Download />} onClick={() => handleDownloadReport(report)}>
                                Download PDF
                              </Button>
                            </Stack>
                          </Card>
                        ))}
                      </Stack>
                    </Paper>
                  </Grid>

                  {/* Monthly Reports */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, border: `1px solid ${alpha(COLORS.primary, 0.2)}`, bgcolor: alpha(COLORS.primary, 0.05) }}>
                      <Typography variant="h6" fontWeight={600} mb={2} color={COLORS.primary} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BarChartIcon sx={{ fontSize: 20 }} />
                        Monthly Reports
                      </Typography>
                      
                      <Stack spacing={2}>
                        {[
                          {
                            title: "Monthly FRA Progress Report - December 2024",
                            date: "December 2024",
                            summary: "Comprehensive monthly analysis covering 5,847 claims processed, state-wise performance metrics, beneficiary demographics, and implementation challenges across all regions.",
                            metrics: "5,847 Claims | 23 States | 156 Districts | 2,341 Villages"
                          },
                          {
                            title: "Monthly Strategic Analysis - November 2024",
                            date: "November 2024", 
                            summary: "Strategic insights on policy implementation effectiveness, resource allocation optimization, stakeholder engagement metrics, and recommendations for next quarter.",
                            metrics: "87% Policy Adherence | 15% Resource Optimization | 92% Stakeholder Satisfaction"
                          },
                          {
                            title: "Monthly Impact Assessment - October 2024",
                            date: "October 2024",
                            summary: "Detailed impact assessment covering socio-economic benefits, environmental conservation outcomes, livelihood improvements, and long-term sustainability metrics.",
                            metrics: "12,450 Beneficiaries | 8,750 Hectares | 45% Livelihood Improvement"
                          }
                        ].map((report, index) => (
                          <Card key={index} sx={{ p: 2, border: '1px solid #e0e0e0' }}>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                              {report.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                              {report.date}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mb={2}>
                              {report.summary}
                            </Typography>
                            <Chip label={report.metrics} size="small" sx={{ mb: 2 }} />
                            <Stack direction="row" spacing={1}>
                              <Button size="small" variant="outlined" startIcon={<Assessment />} onClick={() => handleViewReport(report)}>
                                View Report
                              </Button>
                              <Button size="small" variant="text" startIcon={<Download />} onClick={() => handleDownloadReport(report)}>
                                Download PDF
                              </Button>
                            </Stack>
                          </Card>
                        ))}
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Report Generation Actions */}
                <Box sx={{ mt: 3, p: 2, bgcolor: alpha(COLORS.info, 0.05), borderRadius: 2, border: `1px solid ${alpha(COLORS.info, 0.2)}` }}>
                  <Typography variant="h6" fontWeight={600} mb={2} color={COLORS.info} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Insights sx={{ fontSize: 20 }} />
                    AI Report Generation
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Generate comprehensive reports using AI analysis of all system data including claims, beneficiaries, performance metrics, and compliance indicators.
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <Button variant="contained" startIcon={<Analytics />}>
                      Generate Weekly Report
                    </Button>
                    <Button variant="outlined" startIcon={<Assessment />}>
                      Generate Monthly Report
                    </Button>
                    <Button variant="text" startIcon={<Download />} onClick={handleDownloadAllReports}>
                      Download Detailed Report
                    </Button>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Analytics Section Header */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight={600} mb={0} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Analytics sx={{ color: COLORS.secondary }} />
              <span data-translate>Analytics Dashboard</span>
            </Typography>
          </CardContent>
        </Card>

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
              title="Beneficiaries Growth Trend - Government of India"
              actions={
                <>
                  <Chip label="Official Data" size="small" sx={{ bgcolor: COLORS.primary, color: 'white', fontWeight: 600 }} />
                  <IconButton size="small" sx={{ bgcolor: alpha(COLORS.primary, 0.1) }}>
                    <BarChartIcon sx={{ color: COLORS.primary }} />
                  </IconButton>
                </>
              }
            >
              <Box sx={{ mb: 2, p: 2, bgcolor: alpha(COLORS.primary, 0.05), borderRadius: 1, border: `1px solid ${alpha(COLORS.primary, 0.2)}` }}>
                <Typography variant="caption" sx={{ color: COLORS.primary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DashboardIcon fontSize="small" /> Ministry of Tribal Affairs | Forest Rights Act Implementation
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={data.timeseries} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="govGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 2" stroke={COLORS.primary} strokeOpacity={0.2} />
                  <XAxis
                    dataKey="month"
                    axisLine={{ stroke: COLORS.primary, strokeWidth: 2 }}
                    tickLine={{ stroke: COLORS.primary }}
                    tick={{ fontSize: 11, fill: theme.palette.text.primary, fontWeight: 600 }}
                  />
                  <YAxis
                    axisLine={{ stroke: COLORS.primary, strokeWidth: 2 }}
                    tickLine={{ stroke: COLORS.primary }}
                    tick={{ fontSize: 11, fill: theme.palette.text.primary, fontWeight: 600 }}
                    label={{ value: 'Beneficiaries Count', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: theme.palette.text.primary, fontWeight: 600 } }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: `2px solid ${COLORS.primary}`,
                      borderRadius: 4,
                      boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.2)}`,
                      fontWeight: 600
                    }}
                    labelStyle={{ color: theme.palette.text.primary, fontWeight: 700 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="beneficiaries"
                    stroke={COLORS.primary}
                    strokeWidth={3}
                    fill="url(#govGradient)"
                    dot={{ fill: COLORS.primary, strokeWidth: 2, stroke: 'white', r: 4 }}
                    activeDot={{ r: 6, fill: COLORS.primary, stroke: 'white', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2, p: 1, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1 }}>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                  Source: Ministry of Tribal Affairs, Government of India | Data as of {new Date().toLocaleDateString()}
                </Typography>
              </Box>
            </ChartCard>
          </Grid>

          {/* Distribution Charts */}
          <Grid item xs={12} md={6}>
            <ChartCard
              title="FRA Claims Distribution by Category"
              actions={
                <>
                  <Chip label="Official Statistics" size="small" sx={{ bgcolor: COLORS.secondary, color: 'white', fontWeight: 600 }} />
                  <IconButton size="small" sx={{ bgcolor: alpha(COLORS.secondary, 0.1) }}>
                    <PieChartIcon sx={{ color: COLORS.secondary }} />
                  </IconButton>
                </>
              }
            >
              <Box sx={{ mb: 2, p: 2, bgcolor: alpha(COLORS.secondary, 0.05), borderRadius: 1, border: `1px solid ${alpha(COLORS.secondary, 0.2)}` }}>
                <Typography variant="caption" sx={{ color: COLORS.secondary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Assessment fontSize="small" /> Forest Rights Act - Claim Type Analysis
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    dataKey="value"
                    data={data.byType}
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={45}
                    paddingAngle={1}
                    stroke={theme.palette.text.primary}
                    strokeWidth={2}
                    label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                    labelLine={false}
                  >
                    {data.byType.map((_: any, idx: number) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend
                    wrapperStyle={{
                      paddingTop: '15px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: theme.palette.text.primary
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: `2px solid ${COLORS.secondary}`,
                      borderRadius: 4,
                      boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.2)}`,
                      fontWeight: 600
                    }}
                    labelStyle={{ color: theme.palette.text.primary, fontWeight: 700 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2, p: 1, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1 }}>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                  Data Source: Tribal Affairs Ministry | Updated: {new Date().toLocaleDateString()}
                </Typography>
              </Box>
            </ChartCard>
          </Grid>

          {/* Top Districts */}
          <Grid item xs={12} md={6}>
            <ChartCard
              title="District-wise FRA Implementation Performance"
              actions={
                <>
                  <Chip label="Government Data" size="small" sx={{ bgcolor: COLORS.info, color: 'white', fontWeight: 600 }} />
                  <IconButton size="small" sx={{ bgcolor: alpha(COLORS.info, 0.1) }}>
                    <BarChartIcon sx={{ color: COLORS.info }} />
                  </IconButton>
                </>
              }
            >
              <Box sx={{ mb: 2, p: 2, bgcolor: alpha(COLORS.info, 0.05), borderRadius: 1, border: `1px solid ${alpha(COLORS.info, 0.2)}` }}>
                <Typography variant="caption" sx={{ color: COLORS.info, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Timeline fontSize="small" /> District Performance Ranking - FRA Beneficiaries
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.topDistricts} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.secondary} stopOpacity={1} />
                      <stop offset="100%" stopColor={COLORS.secondary} stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 2" stroke={COLORS.info} strokeOpacity={0.2} />
                  <XAxis
                    dataKey="name"
                    axisLine={{ stroke: COLORS.info, strokeWidth: 2 }}
                    tickLine={{ stroke: COLORS.info }}
                    tick={{ fontSize: 10, fill: theme.palette.text.primary, fontWeight: 600 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    axisLine={{ stroke: COLORS.info, strokeWidth: 2 }}
                    tickLine={{ stroke: COLORS.info }}
                    tick={{ fontSize: 11, fill: theme.palette.text.primary, fontWeight: 600 }}
                    label={{ value: 'Beneficiaries', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: theme.palette.text.primary, fontWeight: 600 } }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: `2px solid ${COLORS.info}`,
                      borderRadius: 4,
                      boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.2)}`,
                      fontWeight: 600
                    }}
                    labelStyle={{ color: theme.palette.text.primary, fontWeight: 700 }}
                  />
                  <Bar
                    dataKey="beneficiaries"
                    fill="url(#barGradient)"
                    stroke={theme.palette.text.primary}
                    strokeWidth={1}
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2, p: 1, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1 }}>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                  Performance Metrics: Ministry of Tribal Affairs | Last Updated: {new Date().toLocaleDateString()}
                </Typography>
              </Box>
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

        <Dialog open={reportDialog} onClose={() => setReportDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>{selectedReport?.title}</DialogTitle>
          <DialogContent>
            {selectedReport && (
              <Box>
                <Typography variant="body2" gutterBottom><strong>Date:</strong> {selectedReport.date}</Typography>
                <Typography variant="body2" gutterBottom><strong>Metrics:</strong> {selectedReport.metrics}</Typography>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Summary</Typography>
                <Typography variant="body1">{selectedReport.summary}</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReportDialog(false)}>Close</Button>
            <Button variant="contained" startIcon={<Download />} onClick={() => selectedReport && handleDownloadReport(selectedReport)}>Download</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
};

export default Reports;



