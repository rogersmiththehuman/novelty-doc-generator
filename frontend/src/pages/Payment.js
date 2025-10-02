import React from 'react';
import { Container, Typography } from '@mui/material';

const Payment = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" gutterBottom>
        Payment
      </Typography>
      <Typography variant="body1">
        Complete your payment using Bitcoin or Monero to generate your document.
      </Typography>
    </Container>
  );
};

export default Payment;