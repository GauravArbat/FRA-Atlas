import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Breadcrumbs,
  Link,
  Divider,
  Alert
} from '@mui/material';
import { Home, NavigateNext, Phone, Email, LocationOn } from '@mui/icons-material';

const ContactUs: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  return (
    <Box>
      {/* Breadcrumb */}
      <Box sx={{ bgcolor: 'white', p: 2, borderBottom: '1px solid #ddd' }}>
        <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
          <Link color="inherit" href="/" sx={{ display: 'flex', alignItems: 'center' }}>
            <Home sx={{ mr: 0.5, fontSize: 16 }} />
            Home
          </Link>
          <Typography color="text.primary">Contact Us</Typography>
        </Breadcrumbs>
      </Box>

      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3, color: '#2e7d32', fontWeight: 600 }}>
          Contact Us
        </Typography>

        <Grid container spacing={3}>
          {/* Contact Information */}
          <Grid item xs={12} md={6}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: '#2e7d32' }}>
                  Get in Touch
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  For any queries related to Forest Rights Act (FRA) implementation, data access, or technical support, please reach out to us.
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Phone sx={{ mr: 2, color: '#2e7d32' }} />
                  <Box>
                    <Typography variant="subtitle2">Toll Free Number</Typography>
                    <Typography variant="body2">1800-11-2345</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Email sx={{ mr: 2, color: '#2e7d32' }} />
                  <Box>
                    <Typography variant="subtitle2">Email</Typography>
                    <Typography variant="body2">helpdesk@fraatlas.gov.in</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocationOn sx={{ mr: 2, color: '#2e7d32' }} />
                  <Box>
                    <Typography variant="subtitle2">Address</Typography>
                    <Typography variant="body2">
                      Ministry of Tribal Affairs<br />
                      Government of India<br />
                      Shastri Bhawan, New Delhi - 110001
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: '#2e7d32' }}>
                  Office Hours
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Monday - Friday:</strong> 9:00 AM - 6:00 PM
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Saturday:</strong> 9:00 AM - 1:00 PM
                </Typography>
                <Typography variant="body2">
                  <strong>Sunday:</strong> Closed
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Contact Form */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: '#2e7d32' }}>
                  Send us a Message
                </Typography>

                {submitted && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Thank you for your message! We will get back to you soon.
                  </Alert>
                )}

                <form onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Message"
                    name="message"
                    multiline
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    required
                    sx={{ mb: 2 }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={submitted}
                  >
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Additional Information */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ mb: 1, color: '#2e7d32' }}>
                  Technical Support
                </Typography>
                <Typography variant="body2">
                  For technical issues with the FRA Atlas platform, GIS tools, or data access problems.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ mb: 1, color: '#2e7d32' }}>
                  Policy Queries
                </Typography>
                <Typography variant="body2">
                  Questions related to FRA implementation, guidelines, and policy clarifications.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ mb: 1, color: '#2e7d32' }}>
                  Data Requests
                </Typography>
                <Typography variant="body2">
                  Requests for FRA data access, research collaborations, and data sharing agreements.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default ContactUs;