import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

export default function Demographics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [quizId, setQuizId] = useState(null);
  const [answers, setAnswers] = useState({
    age_range: '',
    gender_identity: '',
    profession: ''
  });

  useEffect(() => {
    const checkPreviousSubmission = async () => {
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const { ip } = await ipResponse.json();
        
        let { data: existingData, error } = await supabase
          .from('quiz_responses')
          .select()
          .eq('ip_address', ip)
          .maybeSingle();
          
        if (error) throw error;
        
        if (existingData) {
          setQuizId(existingData.id);
          setAnswers({
            age_range: existingData.age_range || '',
            gender_identity: existingData.gender_identity || '',
            profession: existingData.profession || ''
          });
        } else {
          const { data: newQuiz, error: insertError } = await supabase
            .from('quiz_responses')
            .insert({ ip_address: ip })
            .select()
            .single();
            
          if (insertError) throw insertError;
          setQuizId(newQuiz.id);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setLoading(false);
      }
    };

    checkPreviousSubmission();
  }, []);

  const handleChange = (field, value) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      const { error } = await supabase
        .from('quiz_responses')
        .update(answers)
        .eq('id', quizId);
        
      if (error) throw error;
      
      navigate('/quiz/complete');
    } catch (error) {
      console.error('Error saving demographics:', error);
    }
  };

  const handleSkip = async () => {
    try {
      const { error } = await supabase
        .from('quiz_responses')
        .update({
          age_range: null,
          gender_identity: null,
          profession: null
        })
        .eq('id', quizId);
        
      if (error) throw error;
      
      navigate('/quiz/complete');
    } catch (error) {
      console.error('Error skipping demographics:', error);
    }
  };

  if (loading) return <QuestionText>Loading...</QuestionText>;

  return (
    <QuizContainer>
      <QuestionText>Demographics</QuestionText>
      
      <FormContainer>
        <FormGroup>
          <Label>Age Range</Label>
          <Select 
            value={answers.age_range} 
            onChange={(e) => handleChange('age_range', e.target.value)}
          >
            <option value="">Select age range</option>
            {[
              "18-24",
              "25-34",
              "35-44",
              "45-54",
              "55-64",
              "65+"
            ].map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>Gender Identity</Label>
          <Select 
            value={answers.gender_identity} 
            onChange={(e) => handleChange('gender_identity', e.target.value)}
          >
            <option value="">Select gender</option>
            {["Male", "Female", "Non-binary"].map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>Profession</Label>
          <Select 
            value={answers.profession} 
            onChange={(e) => handleChange('profession', e.target.value)}
          >
            <option value="">Select profession</option>
            {[
              "Student",
              "Healthcare",
              "Technology",
              "Education",
              "Business",
              "Arts & Entertainment",
              "Service Industry",
              "Retired",
              "Other"
            ].map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </Select>
        </FormGroup>
      </FormContainer>

      <ButtonContainer>
        <BackButton onClick={() => navigate('/quiz/lifespan')}>
          Back
        </BackButton>
        <NextButton onClick={handleSubmit}>
          Complete Quiz
        </NextButton>
      </ButtonContainer>
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

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 20px 0;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Label = styled.label`
  text-align: left;
  font-size: 0.9em;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px;
  background: #000;
  border: 2px solid #fff;
  color: #fff;
  font-family: inherit;
  cursor: pointer;

  option {
    padding: 10px;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
`;

const Button = styled.button`
  padding: 8px 16px;
  background: transparent;
  border: 2px solid #fff;
  color: #fff;
  cursor: pointer;
  font-family: inherit;
  
  &:hover {
    background: #333;
  }
`;

const BackButton = styled(Button)``;

const SkipButton = styled(Button)`
  border-color: #666;
  color: #666;
  
  &:hover {
    border-color: #fff;
    color: #fff;
  }
`;

const NextButton = styled(Button)`
  border-color: #0f0;
  color: #0f0;
  
  &:hover {
    background: #0f01;
  }
`; 