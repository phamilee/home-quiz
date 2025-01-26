import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

// Get session ID or create one
const getSessionId = () => {
  let sessionId = localStorage.getItem('quiz_session_id');
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('quiz_session_id', sessionId);
  }
  return sessionId;
};

// Get stored answers for the session
const getStoredAnswers = () => {
  const answers = localStorage.getItem('quiz_answers');
  return answers ? JSON.parse(answers) : {};
};

// Save answers for the session
const saveAnswers = (answers) => {
  localStorage.setItem('quiz_answers', JSON.stringify(answers));
};

export default function BaseQuestion({ 
  question, 
  options, 
  nextPath, 
  field, 
  previousPath,
  skipEnabled = false 
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState(null);
  const [savedAnswer, setSavedAnswer] = useState(null);

  useEffect(() => {
    const loadSavedAnswer = () => {
      try {
        const answers = getStoredAnswers();
        setAnswer(answers[field] || null);
        setSavedAnswer(answers[field] || null);
        setLoading(false);
      } catch (error) {
        console.error('Error loading saved answer:', error);
        setLoading(false);
      }
    };

    loadSavedAnswer();
  }, [field]);

  const handleSelect = (selectedAnswer) => {
    setAnswer(selectedAnswer);
  };

  const handleNext = async () => {
    if (answer === savedAnswer) {
      // If answer hasn't changed, just navigate
      const nextRoute = typeof nextPath === 'function' ? nextPath(answer) : nextPath;
      navigate(nextRoute);
      return;
    }

    try {
      const answers = getStoredAnswers();
      const newAnswers = {
        ...answers,
        [field]: answer
      };
      saveAnswers(newAnswers);
      setSavedAnswer(answer);
      
      // Try to sync with Supabase if possible
      try {
        const sessionId = getSessionId();
        await supabase
          .from('quiz_responses')
          .upsert({
            session_id: sessionId,
            [field]: answer,
            size: field === 'size' ? answer : answers.size || 0,
            loc: field === 'loc' ? answer : answers.loc || 0,
            vibe: field === 'vibe' ? answer : answers.vibe || 0,
            sust: field === 'sust' ? answer : answers.sust || 0,
            dur: field === 'dur' ? answer : answers.dur || 0,
            sust_offset: answers.sust_offset || 0
          }, {
            onConflict: 'session_id'
          });
      } catch (error) {
        // Ignore Supabase errors - we'll rely on localStorage
        console.warn('Failed to sync with Supabase:', error);
      }
      
      const nextRoute = typeof nextPath === 'function' ? nextPath(answer) : nextPath;
      navigate(nextRoute);
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  };

  if (loading) return <QuestionText>Loading...</QuestionText>;

  return (
    <QuizContainer>
      <QuestionText>{question}</QuestionText>
      
      <OptionsContainer>
        {options.map((option) => (
          <Button 
            key={option} 
            onClick={() => handleSelect(option)}
            selected={answer === option}
          >
            {option}
          </Button>
        ))}
      </OptionsContainer>
      
      {skipEnabled && (
        <SkipButton onClick={() => handleSelect(null)}>
          Skip this question
        </SkipButton>
      )}
      
      <NavigationContainer>
        <div>{previousPath && (
          <BackButton onClick={() => navigate(previousPath)}>
            Back
          </BackButton>
        )}</div>
        <NextButton 
          onClick={handleNext}
          disabled={answer === null && !skipEnabled}
        >
          Next
        </NextButton>
      </NavigationContainer>
    </QuizContainer>
  );
}

const QuizContainer = styled.div`
  width: 80%;
  max-width: 600px;
  background: #000;
  border: 4px solid #fff;
  padding: 20px;
  text-align: center;
`;

const QuestionText = styled.h2`
  margin-bottom: 30px;
  line-height: 1.5;
`;

const OptionsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin: 20px 0;
`;

const Button = styled.button`
  width: 100%;
  background: ${props => props.selected ? '#0f0' : '#333'};
  border-color: ${props => props.selected ? '#0f0' : '#fff'};
  color: ${props => props.selected ? '#000' : '#fff'};
  
  &:hover {
    background: ${props => props.selected ? '#0f0' : '#666'};
    color: ${props => props.selected ? '#000' : '#fff'};
  }
`;

const SkipButton = styled.button`
  width: auto;
  margin: 20px auto 0;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #666;
  color: #666;
  font-size: 0.9em;
  cursor: pointer;
  
  &:hover {
    border-color: #fff;
    color: #fff;
  }
`;

const NavigationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
`;

const BackButton = styled.button`
  padding: 8px 16px;
  background: transparent;
  border: 2px solid #fff;
  color: #fff;
  cursor: pointer;
  
  &:hover {
    background: #333;
  }
`;

const NextButton = styled.button`
  padding: 8px 16px;
  background: transparent;
  border: 2px solid #0f0;
  color: #0f0;
  cursor: pointer;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    border-color: #666;
    color: #666;
  }
  
  &:hover:not(:disabled) {
    background: #0f01;
  }
`; 