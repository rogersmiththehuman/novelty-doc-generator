import React from 'react';
import { Container, Typography, Button, Box, Grid, Card, CardContent } from '@mui/material';
import { Link } from 'react-router-dom';
import { Description, Payment, Security } from '@mui/icons-material';

const Home = () => {
  const features = [
    {
      icon: <Description fontSize="large" />,
      title: 'Custom Documents',
      description: 'Generate professional-looking novelty documents including licenses, bills, certificates, and more.'
    },
    {
      icon: <Payment fontSize="large" />,
      title: 'Crypto Payments',
      description: 'Secure payments using Bitcoin and Monero. Pay per document with transparent pricing.'
    },
    {
      icon: <Security fontSize="large" />,
      title: 'Secure & Private',
      description: 'Your data is encrypted and documents are automatically removed after 30 days.'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Hero Section */}
      <Box textAlign="center" sx={{ mb: 8 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Generate Custom Documents
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Create professional novelty documents with cryptocurrency payments
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            component={Link}
            to="/register"
            sx={{ mr: 2 }}
          >
            Get Started
          </Button>
          <Button
            variant="outlined"
            size="large"
            component={Link}
            to="/templates"
          >
            Browse Templates
          </Button>
        </Box>
      </Box>

      {/* Features Section */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ color: 'primary.main', mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography variant="h5" component="h2" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* How it Works Section */}
      <Box textAlign="center" sx={{ mb: 6 }}>
        <Typography variant="h3" component="h2" gutterBottom>
          How It Works
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12} md={3}>
            <Typography variant="h6" gutterBottom>
              1. Choose Template
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Browse our collection of document templates
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="h6" gutterBottom>
              2. Fill Information
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter your details in the form fields
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="h6" gutterBottom>
              3. Pay with Crypto
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Secure payment with Bitcoin or Monero
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="h6" gutterBottom>
              4. Download
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Get your document in PDF or image format
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Home;