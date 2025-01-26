import React from 'react';
import styled from 'styled-components';

export default function ThankYou() {
  return (
    <ThankYouContainer>
      <Title>Thank You!</Title>
      <Description>
        Your responses have been recorded. Thank you for contributing to our research
        on sustainable housing solutions.
      </Description>
    </ThankYouContainer>
  );
}

const ThankYouContainer = styled.div`
  width: 95%;
  max-width: 600px;
  background: #000;
  border: 4px solid #fff;
  padding: 40px 20px;
  text-align: center;
`;

const Title = styled.h1`
  margin-bottom: 30px;
  line-height: 1.5;
  font-size: 2em;
  color: #0f0;
`;

const Description = styled.p`
  margin-bottom: 40px;
  line-height: 1.6;
  font-size: 1.1em;
  opacity: 0.9;
`; 