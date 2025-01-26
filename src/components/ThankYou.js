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
      <ButtonContainer>
        <ViewResultsButton onClick={() => navigate('/quiz/results')}>
          View Results
        </ViewResultsButton>
      </ButtonContainer>
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

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
`;

const ViewResultsButton = styled.button`
  padding: 12px 24px;
  background: #0f0;
  border: none;
  color: #000;
  font-size: 1.1em;
  cursor: pointer;
  font-family: inherit;
  
  &:hover {
    background: #0d0;
  }
`; 