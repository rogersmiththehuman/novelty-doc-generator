import React from 'react';
import { Container, Typography } from '@mui/material';

const Downloads = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" gutterBottom>
        Downloads
      </Typography>
      <Typography variant="body1">
        Access and download your generated documents. Documents are available for 30 days after generation.
      </Typography>
    </Container>
  );
};

export default Downloads;