import React from 'react';
import { Container, Typography } from '@mui/material';

const Templates = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" gutterBottom>
        Document Templates
      </Typography>
      <Typography variant="body1">
        Browse our collection of document templates including licenses, utility bills, certificates, and more.
      </Typography>
    </Container>
  );
};

export default Templates;