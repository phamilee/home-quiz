import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

export default function ThankYou() {
  const navigate = useNavigate();

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
  width: 80%;
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

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
`;

const RestartButton = styled.button`
  padding: 12px 24px;
  background: transparent;
  border: 2px solid #fff;
  color: #fff;
  font-size: 1.1em;
  cursor: pointer;
  font-family: inherit;
  
  &:hover {
    background: #333;
  }
`; 