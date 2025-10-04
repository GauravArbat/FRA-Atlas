import React, { useEffect, useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Alert, 
  Divider,
  Container,
  Grid,
  Card,
  CardContent,
  InputAdornment,
  IconButton,
  Fade,
  Slide,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Email, 
  Lock, 
  Login as LoginIcon,
  Park,
  ArrowForward,
  Security,
  AccountTree,
  LocationCity,
  AdminPanelSettings
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
// Remove old hook import

const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@fraatlas.gov.in');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, login } = useAuth();
  const isAuthenticated = !!user;

  // If already authenticated, redirect to Dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setError('');
    
    // Clear fields first
    setEmail('');
    setPassword('');
    
    // Animate email typing
    for (let i = 0; i <= demoEmail.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 80));
      setEmail(demoEmail.substring(0, i));
    }
    
    // Small pause
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Animate password typing
    for (let i = 0; i <= demoPassword.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 80));
      setPassword(demoPassword.substring(0, i));
    }
    
    // Pause before auto-clicking login
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Auto-submit form
    setLoading(true);
    
    try {
      await login(demoEmail, demoPassword);
      navigate('/', { replace: true });
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 20% 80%, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 50%)`,
          zIndex: 0,
        }
      }}
    >
      <Container maxWidth="lg" sx={{ 
        position: 'relative', 
        zIndex: 1,
        px: { xs: 2, sm: 3, md: 4 }
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', lg: 'row' },
          gap: { xs: 2, lg: 3 }, 
          alignItems: { xs: 'center', lg: 'flex-start' }
        }}>
          {/* Left Side - Branding */}
          <Box sx={{ 
            flex: { lg: 1 },
            width: { xs: '100%', lg: 'auto' },
            textAlign: { xs: 'center', lg: 'left' }
          }}>
            <Fade in timeout={1000}>
              <Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: { xs: 'center', lg: 'flex-start' },
                  mb: { xs: 3, md: 4 } 
                }}>
                  <Park sx={{ 
                    fontSize: { xs: 40, sm: 48, md: 64 }, 
                    color: 'primary.main', 
                    mr: { xs: 2, md: 3 } 
                  }} />
                  <Typography variant="h2" sx={{ 
                    fontWeight: 800, 
                    color: 'primary.main', 
                    letterSpacing: { xs: '1px', md: '2px' },
                    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
                  }}>
                    FRA Atlas
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ 
                  fontWeight: 700, 
                  mb: { xs: 2, md: 3 }, 
                  color: 'text.primary',
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
                }}>
                  Forest Rights Act
                </Typography>
                <Typography variant="h4" sx={{ 
                  fontWeight: 600, 
                  mb: { xs: 3, md: 4 }, 
                  color: 'text.secondary',
                  fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' }
                }}>
                  Digital Platform
                </Typography>
                <Typography variant="h6" sx={{ 
                  mb: { xs: 3, md: 5 }, 
                  color: 'text.secondary', 
                  maxWidth: { xs: '100%', md: 500 }, 
                  lineHeight: 1.6,
                  fontSize: { xs: '1rem', md: '1.25rem' }
                }}>
                  Comprehensive digital platform for FRA governance, data digitization, 
                  spatial integration, and decision support for policy implementation.
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: { xs: 'center', lg: 'flex-start' }
                }}>
                  <Security sx={{ 
                    mr: { xs: 1, md: 2 }, 
                    color: 'success.main', 
                    fontSize: { xs: 20, md: 32 } 
                  }} />
                  <Typography variant="body2" color="success.main" sx={{ fontWeight: 600, fontSize: { xs: '0.875rem', md: '1.25rem' } }}>
                    Secure & Government Approved
                  </Typography>
                </Box>
              </Box>
            </Fade>
          </Box>

          {/* Middle - Demo Accounts */}
          <Box sx={{ 
            width: { xs: '100%', sm: 400, lg: 300 },
            order: { xs: 3, lg: 2 }
          }}>
            <Typography variant="h6" sx={{ 
              mb: 2, 
              fontWeight: 600, 
              textAlign: 'center',
              fontSize: { xs: '1rem', md: '1.25rem' }
            }}>
              🏆 SIH Demo Accounts
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {/* Admin */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                p: 1.5,
                border: '1px solid #ddd',
                borderRadius: 2,
                '&:hover': { backgroundColor: alpha('#f44336', 0.05) }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AdminPanelSettings sx={{ color: '#f44336', mr: 1.5, fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Admin
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{
                      fontSize: { xs: '0.65rem', sm: '0.75rem' }
                    }}>
                      admin@fraatlas.gov.in
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleDemoLogin('admin@fraatlas.gov.in', 'admin123')}
                  disabled={loading}
                  sx={{ 
                    background: '#f44336',
                    '&:hover': { background: '#d32f2f' },
                    textTransform: 'none'
                  }}
                >
                  {loading ? 'Logging...' : 'Login'}
                </Button>
              </Box>

              {/* State */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                p: 1.5,
                border: '1px solid #ddd',
                borderRadius: 2,
                '&:hover': { backgroundColor: alpha('#ff9800', 0.05) }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccountTree sx={{ color: '#ff9800', mr: 1.5, fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      State (MP)
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{
                      fontSize: { xs: '0.65rem', sm: '0.75rem' }
                    }}>
                      state@mp.gov.in
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleDemoLogin('state@mp.gov.in', 'mp123')}
                  disabled={loading}
                  sx={{ 
                    background: '#ff9800',
                    '&:hover': { background: '#f57c00' },
                    textTransform: 'none'
                  }}
                >
                  {loading ? 'Logging...' : 'Login'}
                </Button>
              </Box>

              {/* District */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                p: 1.5,
                border: '1px solid #ddd',
                borderRadius: 2,
                '&:hover': { backgroundColor: alpha('#4caf50', 0.05) }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationCity sx={{ color: '#4caf50', mr: 1.5, fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      District (Bhopal)
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{
                      fontSize: { xs: '0.65rem', sm: '0.75rem' }
                    }}>
                      tribal.bhopal@mp.gov.in
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleDemoLogin('tribal.bhopal@mp.gov.in', 'bhopal123')}
                  disabled={loading}
                  sx={{ 
                    background: '#4caf50',
                    '&:hover': { background: '#388e3c' },
                    textTransform: 'none'
                  }}
                >
                  {loading ? 'Logging...' : 'Login'}
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Right Side - Login Form */}
          <Box sx={{ 
            flex: { lg: 1 },
            width: { xs: '100%', lg: 'auto' },
            order: { xs: 2, lg: 3 }
          }}>
            <Slide direction="left" in timeout={1000}>
              <Card
                elevation={24}
                sx={{
                  borderRadius: 3,
                  background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.1)}`,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                      Welcome Back
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sign in to your FRA Atlas account
                    </Typography>
                  </Box>

                  {error && (
                    <Fade in>
                      <Alert 
                        severity="error" 
                        sx={{ 
                          mb: 3, 
                          borderRadius: 2,
                          '& .MuiAlert-icon': {
                            fontSize: '1.2rem'
                          }
                        }}
                      >
                        {error}
                      </Alert>
                    </Fade>
                  )}

                  <form onSubmit={handleSubmit}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      margin="normal"
                      required
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                          },
                        },
                      }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      margin="normal"
                      required
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={handleTogglePasswordVisibility}
                              edge="end"
                              size="small"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                          },
                        },
                      }}
                    />

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading}
                      endIcon={loading ? null : <ArrowForward />}
                      sx={{
                        mt: 4,
                        mb: 3,
                        py: 1.5,
                        borderRadius: 2,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
                        boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                        '&:hover': {
                          background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
                          boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
                          transform: 'translateY(-2px)',
                        },
                        '&:disabled': {
                          background: theme.palette.action.disabledBackground,
                          color: theme.palette.action.disabled,
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </form>

                  <Divider sx={{ my: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      or
                    </Typography>
                  </Divider>

                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Don't have an account?
                    </Typography>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => navigate('/signup')}
                      startIcon={<LoginIcon />}
                      sx={{
                        borderRadius: 2,
                        px: 4,
                        py: 1,
                        textTransform: 'none',
                        fontWeight: 600,
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        '&:hover': {
                          borderColor: 'primary.dark',
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
                          transform: 'translateY(-1px)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      Create Account
                    </Button>
                  </Box>


                </CardContent>
              </Card>
            </Slide>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;



