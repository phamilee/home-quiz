import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

// Get session ID or create one
const getSessionId = () => {
  let sessionId = localStorage.getItem('survey_session_id');
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('survey_session_id', sessionId);
  }
  return sessionId;
};

export default function Demographics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({
    age_range: '',
    gender_identity: '',
    profession: ''
  });

  useEffect(() => {
    const checkPreviousSubmission = async () => {
      try {
        const sessionId = getSessionId();
        
        let { data: existingData, error: selectError } = await supabase
          .from('survey_responses')
          .select()
          .eq('session_id', sessionId)
          .maybeSingle();
          
        if (selectError) throw selectError;
        
        if (existingData) {
          setAnswers({
            age_range: existingData.age_range || '',
            gender_identity: existingData.gender_identity || '',
            profession: existingData.profession || ''
          });
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
      const sessionId = getSessionId();
      const { error } = await supabase
        .from('survey_responses')
        .update(answers)
        .eq('session_id', sessionId);
        
      if (error) throw error;
      
      navigate('/survey/complete');
    } catch (error) {
      console.error('Error saving demographics:', error);
    }
  };

  if (loading) return <QuestionText>Loading...</QuestionText>;

  return (
    <SurveyContainer>
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
        <BackButton onClick={() => navigate('/survey/5')}>
          Back
        </BackButton>
        <NextButton onClick={handleSubmit}>
          Complete Survey
        </NextButton>
      </ButtonContainer>
    </SurveyContainer>
  );
}

const SurveyContainer = styled.div`
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

const NextButton = styled(Button)`
  background: #fff;
  color: #000;
  
  &:hover {
    background: #ccc;
  }
`; 