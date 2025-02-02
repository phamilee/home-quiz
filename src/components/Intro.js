import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

export default function Intro() {
  const navigate = useNavigate();

  return (
    <IntroContainer>
      <Title>Hello!</Title>
      <Description>
        The following survey is a rough tool to approximate housing priorities.
        The entire survey should take less than 3 minutes. <br /><br /> Your response is anonymous.
      </Description>
      <ButtonContainer>
        <StartButton onClick={() => navigate('/survey/1')}>
          Start Survey
        </StartButton>
      </ButtonContainer>
    </IntroContainer>
  );
}

const IntroContainer = styled.div`
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
`;

const Description = styled.p`
  margin-bottom: 40px;
  line-height: 1.6;
  font-size: 1.1em;
  opacity: 0.9;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 20px;
  justify-content: center;
`;

const StartButton = styled.button`
  padding: 15px 30px;
  background: transparent;
  border: 2px solid #0f0;
  color: #0f0;
  font-size: 1.2em;
  cursor: pointer;
  font-family: inherit;
  
  &:hover {
    background: #0f01;
  }
`; 