import React from 'react';
import { Container, Typography } from '@mui/material';

const DocumentForm = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" gutterBottom>
        Document Form
      </Typography>
      <Typography variant="body1">
        Fill out the form with your information to generate your custom document.
      </Typography>
    </Container>
  );
};

export default DocumentForm;