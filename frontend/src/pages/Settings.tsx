import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  TextField,
  Button,
  Divider,
  Alert,
  Grid,
  Card,
  CardContent,
  Chip,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tabs,
  Tab,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Person,
  Security,
  Settings as SettingsIcon,
  Edit,
  Save,
  Cancel,
  SupervisorAccount,
  History,
  Assessment,
  Visibility,
  GetApp,
  ExpandMore,
  Work,
  TrendingUp,
  Search
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

const Settings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('API_URL') || (process.env.REACT_APP_API_URL || 'http://localhost:8000/api'));
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // User Profile State
  const [profileEdit, setProfileEdit] = useState(false);
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || ''
  });
  
  // Password Change State
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // App Preferences
  const [preferences, setPreferences] = useState({
    darkMode: localStorage.getItem('darkMode') === 'true',
    notifications: localStorage.getItem('notifications') !== 'false',
    autoSave: localStorage.getItem('autoSave') !== 'false'
  });

  // Admin Panel State
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState([]);
  const [userLogs, setUserLogs] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userReport, setUserReport] = useState(null);
  const [combinedReport, setCombinedReport] = useState(null);
  const [logsPage, setLogsPage] = useState(0);
  const [logsRowsPerPage, setLogsRowsPerPage] = useState(10);
  const [usersPage, setUsersPage] = useState(0);
  const [usersRowsPerPage, setUsersRowsPerPage] = useState(10);
  const [reportDialog, setReportDialog] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username,
        email: user.email
      });
      
      // Load admin data if user is admin
      if (user.role === 'admin') {
        loadUsers();
        loadCombinedReport();
      }
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      console.log('Loading users...');
      const response = await api.get('/admin/users');
      console.log('Users response:', response.data);
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      setError('Failed to load users: ' + (error.response?.data?.error || error.message));
    }
  };

  const loadUserLogs = async (userId, page = 0) => {
    try {
      const response = await api.get(`/admin/users/${userId}/logs?page=${page + 1}&limit=${logsRowsPerPage}`);
      setUserLogs(response.data.logs);
    } catch (error) {
      console.error('Failed to load user logs:', error);
    }
  };

  const loadUserReport = async (userId) => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/users/${userId}/report`);
      setUserReport(response.data);
      setReportDialog(true);
    } catch (error) {
      setError('Failed to load user report');
    } finally {
      setLoading(false);
    }
  };

  const loadCombinedReport = async () => {
    try {
      const response = await api.get('/admin/reports/combined');
      setCombinedReport(response.data);
    } catch (error) {
      console.error('Failed to load combined report:', error);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    loadUserLogs(user.id, 0);
    setLogsPage(0);
  };

  const saveSystemSettings = () => {
    setInfo(null);
    setError(null);
    localStorage.setItem('API_URL', apiUrl);
    localStorage.removeItem('REACT_APP_MAPBOX_TOKEN');
    setInfo('System settings saved. Please reload the app for changes to take effect.');
  };

  const savePreferences = () => {
    localStorage.setItem('darkMode', preferences.darkMode.toString());
    localStorage.setItem('notifications', preferences.notifications.toString());
    localStorage.setItem('autoSave', preferences.autoSave.toString());
    setInfo('Preferences saved successfully.');
  };

  const saveProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await api.put('/auth/profile', profileData);
      await refreshUser(); // Refresh user data in context
      setProfileEdit(false);
      setInfo('Profile updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordDialog(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setInfo('Password changed successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: 'primary' | 'secondary' | 'success' | 'warning' | 'error' } = {
      admin: 'error',
      state_admin: 'warning',
      district_admin: 'primary',
      block_admin: 'secondary',
      user: 'success'
    };
    return colors[role] || 'default';
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        <span data-translate>Settings</span>
      </Typography>
      
      {info && <Alert severity="success" sx={{ mb: 2 }}>{info}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {user?.role === 'admin' && (
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Personal Settings" />
            <Tab label="User Management" icon={<SupervisorAccount />} />
            <Tab label="Activity Logs" icon={<History />} />
            <Tab label="Reports" icon={<Assessment />} />
          </Tabs>
        </Paper>
      )}

      {(!user || user.role !== 'admin' || tabValue === 0) && (
        <Grid container spacing={3}>
          {/* User Profile Section */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">
                    <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                    User Profile
                  </Typography>
                  <Box>
                    {profileEdit ? (
                      <>
                        <Tooltip title="Save Profile">
                          <IconButton onClick={saveProfile} disabled={loading}>
                            <Save />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel">
                          <IconButton onClick={() => setProfileEdit(false)}>
                            <Cancel />
                          </IconButton>
                        </Tooltip>
                      </>
                    ) : (
                      <Tooltip title="Edit Profile">
                        <IconButton onClick={() => setProfileEdit(true)}>
                          <Edit />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
                
                <Stack spacing={2}>
                  <TextField
                    label="Username"
                    value={profileData.username}
                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                    disabled={!profileEdit}
                    fullWidth
                  />
                  <TextField
                    label="Email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    disabled={!profileEdit}
                    fullWidth
                  />
                  
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Role
                    </Typography>
                    <Chip 
                      label={user?.role?.replace('_', ' ').toUpperCase()} 
                      color={getRoleColor(user?.role || '')}
                      size="small"
                    />
                  </Box>
                  
                  {user?.state && (
                    <TextField
                      label="State"
                      value={user.state}
                      disabled
                      fullWidth
                    />
                  )}
                  
                  {user?.district && (
                    <TextField
                      label="District"
                      value={user.district}
                      disabled
                      fullWidth
                    />
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Security Section */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Security
                </Typography>
                
                <Stack spacing={2}>
                  <Button
                    variant="outlined"
                    onClick={() => setPasswordDialog(true)}
                    fullWidth
                  >
                    Change Password
                  </Button>
                  
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Last login: {user?.last_login ? new Date(user.last_login).toLocaleString() : 'N/A'}
                    </Typography>
                  </Alert>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* App Preferences */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                App Preferences
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.darkMode}
                        onChange={(e) => setPreferences({ ...preferences, darkMode: e.target.checked })}
                      />
                    }
                    label="Dark Mode"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.notifications}
                        onChange={(e) => setPreferences({ ...preferences, notifications: e.target.checked })}
                      />
                    }
                    label="Notifications"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.autoSave}
                        onChange={(e) => setPreferences({ ...preferences, autoSave: e.target.checked })}
                      />
                    }
                    label="Auto Save"
                  />
                </Grid>
              </Grid>
              
              <Box mt={2}>
                <Button variant="contained" onClick={savePreferences}>
                  <Save sx={{ mr: 1 }} />
                  Save Preferences
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Admin User Management Tab */}
      {user?.role === 'admin' && tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            <SupervisorAccount sx={{ mr: 1, verticalAlign: 'middle' }} />
            User Management
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Activity</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.slice(usersPage * usersRowsPerPage, usersPage * usersRowsPerPage + usersRowsPerPage).map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: u.is_active ? 'success.main' : 'grey.500' }}>
                          {u.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">{u.username}</Typography>
                          <Typography variant="caption" color="textSecondary">{u.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={u.role.replace('_', ' ').toUpperCase()} color={getRoleColor(u.role)} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{u.state || 'N/A'}</Typography>
                      <Typography variant="caption" color="textSecondary">{u.district || ''}</Typography>
                    </TableCell>
                    <TableCell>
                      <Badge badgeContent={u.total_activities} color="primary">
                        <Work />
                      </Badge>
                      <Typography variant="caption" display="block">
                        {u.claims_created} claims, {u.documents_uploaded} docs
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Logs">
                        <IconButton onClick={() => handleUserSelect(u)} size="small">
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Generate Report">
                        <IconButton onClick={() => loadUserReport(u.id)} size="small">
                          <Assessment />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            component="div"
            count={users.length}
            page={usersPage}
            onPageChange={(e, page) => setUsersPage(page)}
            rowsPerPage={usersRowsPerPage}
            onRowsPerPageChange={(e) => setUsersRowsPerPage(parseInt(e.target.value))}
          />
        </Paper>
      )}

      {/* Admin Activity Logs Tab */}
      {user?.role === 'admin' && tabValue === 2 && (
        <Box>
          {/* Government Header */}
          <Paper sx={{ 
            background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)', 
            color: 'white', 
            p: 3, 
            mb: 3,
            borderRadius: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                width: 60, 
                height: 60, 
                background: 'rgba(255,255,255,0.2)', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <History sx={{ fontSize: 32 }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  Activity Monitoring System
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Government of India • Ministry of Tribal Affairs
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                  भारत सरकार • जनजातीय कार्य मंत्रालय • Forest Rights Act Implementation
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Grid container spacing={3}>
            {/* Users Directory */}
            <Grid item xs={12} lg={4}>
              <Paper sx={{ 
                border: '2px solid #e3f2fd',
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
              }}>
                {/* Directory Header */}
                <Box sx={{ 
                  background: 'linear-gradient(90deg, #e3f2fd 0%, #bbdefb 100%)', 
                  p: 3, 
                  borderBottom: '2px solid #90caf9' 
                }}>
                  <Typography variant="h6" fontWeight="bold" color="#1565c0" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SupervisorAccount sx={{ fontSize: 24 }} />
                    User Directory
                  </Typography>
                  <Typography variant="body2" color="#1976d2" sx={{ mt: 0.5 }}>
                    {users.length} Registered Officials
                  </Typography>
                </Box>
                
                {/* Search & Filter */}
                <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
                  <TextField
                    size="small"
                    placeholder="Search officials..."
                    fullWidth
                    InputProps={{
                      startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Box>
                
                {/* Users List */}
                <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
                  {users.filter((u: any) => u.role !== 'beneficiary').map((u: any, index: number) => (
                    <Box key={u.id}>
                      <Box sx={{ 
                        p: 2, 
                        cursor: 'pointer',
                        bgcolor: selectedUser?.id === u.id ? '#e3f2fd' : 'transparent',
                        borderLeft: selectedUser?.id === u.id ? '4px solid #1976d2' : '4px solid transparent',
                        '&:hover': { bgcolor: '#f5f5f5' },
                        transition: 'all 0.2s'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                            <Avatar sx={{ 
                              width: 40, 
                              height: 40,
                              bgcolor: getRoleColor(u.role) === 'error' ? '#d32f2f' : 
                                      getRoleColor(u.role) === 'warning' ? '#f57c00' :
                                      getRoleColor(u.role) === 'primary' ? '#1976d2' : '#2e7d32',
                              fontSize: '1rem',
                              fontWeight: 'bold'
                            }}>
                              {u.username.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="subtitle2" fontWeight="bold" sx={{ 
                                color: '#1565c0',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {u.username}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Chip 
                                  label={u.role.replace('_', ' ').toUpperCase()} 
                                  size="small"
                                  color={getRoleColor(u.role)}
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                              </Box>
                              {u.state && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                  📍 {u.state}{u.district ? `, ${u.district}` : ''}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                          <Button
                            size="small"
                            variant={selectedUser?.id === u.id ? "contained" : "outlined"}
                            onClick={() => handleUserSelect(u)}
                            sx={{ 
                              minWidth: 80,
                              fontWeight: 600,
                              textTransform: 'none'
                            }}
                            startIcon={<Visibility />}
                          >
                            {selectedUser?.id === u.id ? 'Viewing' : 'View Logs'}
                          </Button>
                        </Box>
                      </Box>
                      {index < users.filter((u: any) => u.role !== 'beneficiary').length - 1 && (
                        <Divider sx={{ borderColor: '#e0e0e0' }} />
                      )}
                    </Box>
                  ))}
                </Box>
                
                {/* Directory Footer */}
                <Box sx={{ 
                  p: 2, 
                  bgcolor: '#f1f5f9', 
                  borderTop: '1px solid #e0e0e0',
                  textAlign: 'center'
                }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    Authorized Personnel Only • सत्यमेव जयते
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            
            {/* Activity Logs Panel */}
            <Grid item xs={12} lg={8}>
              <Paper sx={{ 
                border: '2px solid #e8f5e8',
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                minHeight: 600
              }}>
                {/* Logs Header */}
                <Box sx={{ 
                  background: 'linear-gradient(90deg, #e8f5e8 0%, #c8e6c9 100%)', 
                  p: 3, 
                  borderBottom: '2px solid #a5d6a7' 
                }}>
                  <Typography variant="h6" fontWeight="bold" color="#2e7d32" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assessment sx={{ fontSize: 24 }} />
                    Activity Audit Trail
                  </Typography>
                  <Typography variant="body2" color="#388e3c" sx={{ mt: 0.5 }}>
                    Real-time System Activity Monitoring
                  </Typography>
                </Box>
                
                {selectedUser ? (
                  <>
                    {/* Selected User Info */}
                    <Box sx={{ p: 3, bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Avatar sx={{ 
                          width: 50, 
                          height: 50,
                          bgcolor: '#2e7d32',
                          fontSize: '1.2rem',
                          fontWeight: 'bold'
                        }}>
                          {selectedUser.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight="bold" color="#2e7d32">
                            {selectedUser.username}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            📧 {selectedUser.email}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                            <Chip 
                              label={selectedUser.role.replace('_', ' ').toUpperCase()} 
                              color={getRoleColor(selectedUser.role)}
                              size="small"
                            />
                            {selectedUser.state && (
                              <Typography variant="caption" color="text.secondary">
                                📍 {selectedUser.state}{selectedUser.district ? `, ${selectedUser.district}` : ''}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <Button 
                          variant="outlined" 
                          onClick={() => setSelectedUser(null)}
                          startIcon={<Cancel />}
                          sx={{ textTransform: 'none' }}
                        >
                          Clear Selection
                        </Button>
                      </Box>
                    </Box>
                    
                    {/* Logs Table */}
                    <Box sx={{ p: 3 }}>
                      {userLogs.length > 0 ? (
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                <TableCell sx={{ fontWeight: 'bold', color: '#2e7d32' }}>🕐 Timestamp</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#2e7d32' }}>⚡ Action</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#2e7d32' }}>📋 Table</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#2e7d32' }}>🆔 Record ID</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#2e7d32' }}>🌐 IP Address</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {userLogs.map((log: any, index: number) => (
                                <TableRow key={log.id || index} sx={{ '&:hover': { bgcolor: '#f9f9f9' } }}>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                      {new Date(log.timestamp).toLocaleString()}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={log.action} 
                                      color={log.action === 'INSERT' ? 'success' : log.action === 'UPDATE' ? 'warning' : 'error'}
                                      size="small"
                                      sx={{ fontWeight: 'bold' }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#1976d2' }}>
                                      {log.table_name}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#666' }}>
                                      {log.record_id?.substring(0, 8)}...
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                      {log.ip_address || 'N/A'}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                          <History sx={{ fontSize: 64, color: '#bdbdbd', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            No Activity Logs Found
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            This user has no recorded system activities yet.
                          </Typography>
                        </Box>
                      )}
                      
                      {userLogs.length > 0 && (
                        <TablePagination
                          component="div"
                          count={-1}
                          page={logsPage}
                          onPageChange={(e, page) => {
                            setLogsPage(page);
                            loadUserLogs(selectedUser.id, page);
                          }}
                          rowsPerPage={logsRowsPerPage}
                          onRowsPerPageChange={(e) => setLogsRowsPerPage(parseInt(e.target.value))}
                          sx={{ borderTop: '1px solid #e0e0e0', mt: 2 }}
                        />
                      )}
                    </Box>
                  </>
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    minHeight: 400,
                    p: 4
                  }}>
                    <SupervisorAccount sx={{ fontSize: 80, color: '#bdbdbd', mb: 3 }} />
                    <Typography variant="h5" color="text.secondary" gutterBottom fontWeight="bold">
                      Select a User to View Activity Logs
                    </Typography>
                    <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ maxWidth: 400 }}>
                      Choose any official from the User Directory on the left to view their complete system activity history and audit trail.
                    </Typography>
                    <Box sx={{ mt: 3, p: 2, bgcolor: '#e3f2fd', borderRadius: 2, border: '1px solid #90caf9' }}>
                      <Typography variant="body2" color="#1565c0" textAlign="center">
                        🔒 Authorized Access Only • All activities are monitored and logged
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Admin Reports Tab */}
      {user?.role === 'admin' && tabValue === 3 && (
        <Grid container spacing={3}>
          {combinedReport && (
            <>
              {/* System Overview */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                    System Overview
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} md={3}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="primary">{combinedReport.systemStats.active_users}</Typography>
                          <Typography variant="body2">Active Users</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="success.main">{combinedReport.systemStats.total_claims}</Typography>
                          <Typography variant="body2">Total Claims</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="warning.main">{combinedReport.systemStats.approved_claims}</Typography>
                          <Typography variant="body2">Approved Claims</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="info.main">{combinedReport.systemStats.recent_activities}</Typography>
                          <Typography variant="body2">Recent Activities</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Role Distribution */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Role Distribution</Typography>
                  <List>
                    {combinedReport.roleStats.map((role: any) => (
                      <ListItem key={role.role}>
                        <ListItemAvatar>
                          <Avatar>
                            <SupervisorAccount />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={role.role.replace('_', ' ').toUpperCase()}
                          secondary={`${role.count} users`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>

              {/* Top Active Users */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Top Active Users (30 days)</Typography>
                  <List>
                    {combinedReport.topUsers.slice(0, 5).map((user: any, index: number) => (
                      <ListItem key={user.username}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: index < 3 ? 'gold' : 'grey.500' }}>
                            {index + 1}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={user.username}
                          secondary={`${user.total_activities} activities • ${user.role}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>

              {/* Claims Status */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Claims by Status</Typography>
                  <Grid container spacing={2}>
                    {combinedReport.claimStats.map((claim: any) => (
                      <Grid item xs={6} md={3} key={claim.status}>
                        <Card>
                          <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h5">{claim.count}</Typography>
                            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                              {claim.status.replace('_', ' ')}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            </>
          )}
        </Grid>
      )}

      {/* User Report Dialog */}
      <Dialog open={reportDialog} onClose={() => setReportDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          User Report: {userReport?.user?.username}
        </DialogTitle>
        <DialogContent>
          {userReport && (
            <Stack spacing={3}>
              {/* User Info */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">User Information</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography><strong>Username:</strong> {userReport.user.username}</Typography>
                      <Typography><strong>Email:</strong> {userReport.user.email}</Typography>
                      <Typography><strong>Role:</strong> {userReport.user.role}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography><strong>State:</strong> {userReport.user.state || 'N/A'}</Typography>
                      <Typography><strong>District:</strong> {userReport.user.district || 'N/A'}</Typography>
                      <Typography><strong>Created:</strong> {new Date(userReport.user.created_at).toLocaleDateString()}</Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Claims */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">Claims Created ({userReport.claims.length})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Claim Number</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Area (ha)</TableCell>
                          <TableCell>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {userReport.claims.map((claim: any) => (
                          <TableRow key={claim.claim_number}>
                            <TableCell>{claim.claim_number}</TableCell>
                            <TableCell>{claim.claim_type}</TableCell>
                            <TableCell>
                              <Chip label={claim.status} size="small" />
                            </TableCell>
                            <TableCell>{claim.area_hectares}</TableCell>
                            <TableCell>{new Date(claim.submitted_date).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>

              {/* Activity Summary */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">Activity Summary</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    {userReport.activitySummary.map((activity: any, index: number) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`${activity.action} on ${activity.table_name}`}
                          secondary={`${activity.count} times • Last: ${new Date(activity.last_activity).toLocaleString()}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialog(false)}>Close</Button>
          <Button variant="contained" startIcon={<GetApp />}>
            Export Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <span data-translate>Change Password</span>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Current Password"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              fullWidth
            />
            <TextField
              label="New Password"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              helperText="Minimum 6 characters"
              fullWidth
            />
            <TextField
              label="Confirm New Password"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)}>
            <span data-translate>Cancel</span>
          </Button>
          <Button 
            onClick={handlePasswordChange} 
            variant="contained"
            disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
          >
            <span data-translate>Change Password</span>
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;