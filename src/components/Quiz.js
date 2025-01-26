import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../supabaseClient';
import HomeBuilder from './HomeBuilder';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

const questions = [
  {
    id: 1,
    text: "For your next home, will you be renting or buying?",
    field: "buy_rent",
    options: ["rent", "buy"]
  },
  {
    id: 2,
    text: "Does your area experience natural disasters?",
    field: "disasters",
    options: ["yes", "no"]
  },
  {
    id: "2a",
    text: "What type of natural disaster have you experienced?",
    field: "disaster_type",
    options: ["Hurricane", "Earthquake", "Flood", "Wildfire", "Tornado", "Other"],
    condition: {
      questionId: 2,
      answer: "yes"
    }
  },
  {
    id: 3,
    type: "homeBuilder",
    text: "Build your ideal home (10 points to distribute):"
  },
  {
    id: 4,
    text: "How long do you expect the building to last?",
    field: "lifespan",
    options: [
      "5-25 years",
      "26-50 years",
      "51-100 years",
      "100+ years"
    ]
  },
  {
    id: 5,
    text: "What is your age range?",
    field: "age_range",
    options: [
      "18-24",
      "25-34",
      "35-44",
      "45-54",
      "55-64",
      "65+"
    ]
  },
  {
    id: 6,
    text: "What is your gender identity?",
    field: "gender_identity",
    options: ["Male", "Female", "Non-binary"]
  },
  {
    id: 7,
    type: "dropdown",
    text: "What is your profession?",
    field: "profession",
    options: [
      "Student",
      "Healthcare",
      "Technology",
      "Education",
      "Business",
      "Arts & Entertainment",
      "Service Industry",
      "Retired",
      "Other"
    ]
  }
];

function Quiz() {
  const navigate = useNavigate();
  const { questionId } = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [quizId, setQuizId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  
  // Check for existing quiz and load answers
  useEffect(() => {
    const checkPreviousSubmission = async () => {
      try {
        // Get user's IP address
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const { ip } = await ipResponse.json();
        
        console.log('Checking for IP:', ip);
        
        // First try to get existing quiz
        let { data: existingData, error: selectError } = await supabase
          .from('quiz_responses')
          .select()
          .eq('ip_address', ip)
          .maybeSingle();
          
        console.log('Select response:', { existingData, selectError });
        
        if (selectError) {
          console.error('Select error:', selectError);
          throw selectError;
        }
        
        // If we found an existing quiz
        if (existingData) {
          console.log('Found existing quiz:', existingData);
          
          // If all required fields are filled, redirect to complete
          if (isQuizComplete(existingData)) {
            navigate('/quiz/complete', { replace: true });
            return;
          }
          
          // Otherwise, load existing answers and continue
          setQuizId(existingData.id);
          setAnswers(existingData);
          
          // Find the first unanswered question
          const firstUnanswered = findFirstUnansweredQuestion(existingData);
          setCurrentQuestion(firstUnanswered);
        } else {
          console.log('Creating new quiz for IP:', ip);
          
          // Create new quiz entry with default values
          const { data: newQuiz, error: insertError } = await supabase
            .from('quiz_responses')
            .insert({
              ip_address: ip,
              size: 0,
              loc: 0,
              vibe: 0,
              sust: 0,
              dur: 0
            })
            .select()
            .single();
            
          if (insertError) {
            // If it's a duplicate IP error, try fetching the existing record again
            if (insertError.code === '23505') { // unique_violation
              const { data: retryData, error: retryError } = await supabase
                .from('quiz_responses')
                .select()
                .eq('ip_address', ip)
                .single();
                
              if (retryError) throw retryError;
              
              console.log('Retrieved existing quiz after conflict:', retryData);
              setQuizId(retryData.id);
              setAnswers(retryData);
              const firstUnanswered = findFirstUnansweredQuestion(retryData);
              setCurrentQuestion(firstUnanswered);
            } else {
              console.error('Insert error:', insertError);
              throw insertError;
            }
          } else {
            console.log('New quiz created:', newQuiz);
            setQuizId(newQuiz.id);
            setAnswers(newQuiz);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error checking previous submission:', error);
        setLoading(false);
      }
    };

    checkPreviousSubmission();
  }, [navigate]);

  // Save answers to DB whenever they change
  const saveAnswers = async (newAnswers) => {
    if (!quizId) {
      console.error('No quiz ID available');
      return null;
    }
    
    try {
      console.log('Saving answers:', { id: quizId, ...newAnswers });
      
      const { data, error } = await supabase
        .from('quiz_responses')
        .update(newAnswers)
        .eq('id', quizId)
        .select();
        
      if (error) {
        console.error('Save error:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error('No data returned after update');
      }
      
      console.log('Save successful:', data[0]);
      return data[0];
    } catch (error) {
      console.error('Error saving answers:', error);
      return null;
    }
  };

  const handleAnswer = async (answer) => {
    const question = questions[currentQuestion];
    let newAnswers;
    
    if (question.type === "homeBuilder") {
      newAnswers = {
        ...answers,
        size: answer.size,
        loc: answer.loc,
        vibe: answer.vibe,
        sust: answer.sust,
        dur: answer.dur
      };
      // Home builder should still auto-progress since it has its own submit button
      await saveAndProgress(newAnswers);
    } else {
      if (question.id === 2) {
        newAnswers = {
          ...answers,
          [question.field]: answer,
          ...(answer === "no" && { disaster_type: null })
        };
      } else if (question.id === "2a" && answer === "Other") {
        newAnswers = {
          ...answers,
          disasters: "no",
          [question.field]: null
        };
      } else {
        newAnswers = {
          ...answers,
          [question.field]: answer
        };
      }
      
      // Save answer and determine next question
      await saveAnswers(newAnswers);
      setAnswers(newAnswers);
      setSelectedAnswer(answer);
      
      // Find next question index
      let nextQuestionIndex = currentQuestion + 1;
      
      // Skip conditional questions if condition not met
      while (questions[nextQuestionIndex]?.condition) {
        const conditionQuestion = questions.find(
          q => q.id === questions[nextQuestionIndex].condition.questionId
        );
        if (newAnswers[conditionQuestion.field] !== questions[nextQuestionIndex].condition.answer) {
          nextQuestionIndex++;
        } else {
          break;
        }
      }
      
      // Update current question and URL
      if (nextQuestionIndex >= questions.length) {
        navigate('/quiz/complete', { replace: true });
      } else {
        setCurrentQuestion(nextQuestionIndex);
        navigate(`/quiz/${questions[nextQuestionIndex].id}`, { replace: true });
        setSelectedAnswer(null);
      }
    }
  };

  const handleBack = () => {
    let prevQuestionIndex = currentQuestion - 1;
    const question = questions[currentQuestion];
    
    // If we're on question 3, check the stored answer for disasters
    if (question.id === 3) {
      if (answers.disasters === "yes" && answers.disaster_type !== null) {
        // Only go back to 2a if they answered yes AND provided a disaster type
        prevQuestionIndex = questions.findIndex(q => q.id === "2a");
      } else {
        // Otherwise go back to question 2
        prevQuestionIndex = questions.findIndex(q => q.id === 2);
      }
    }
    // If we're on 2a, go back to 2
    else if (question.id === "2a") {
      prevQuestionIndex = questions.findIndex(q => q.id === 2);
    }
    // Don't go back past the first question
    else if (prevQuestionIndex < 0) {
      return;
    }
    
    setCurrentQuestion(prevQuestionIndex);
  };

  const handleNext = () => {
    let nextQuestionIndex = currentQuestion + 1;
    const question = questions[currentQuestion];
    
    if (question.id === 2) {
      nextQuestionIndex = questions.findIndex(q => 
        q.id === (answers.disasters === "yes" ? "2a" : 3)
      );
    } else if (question.id === "2a" && answers.disaster_type === "Other") {
      nextQuestionIndex = questions.findIndex(q => q.id === 3);
    } else if (questions[nextQuestionIndex]?.condition) {
      const conditionQuestion = questions.find(
        q => q.id === questions[nextQuestionIndex].condition.questionId
      );
      if (answers[conditionQuestion.field] !== questions[nextQuestionIndex].condition.answer) {
        const nextNonConditional = questions.findIndex((q, idx) => 
          idx > nextQuestionIndex && !q.condition
        );
        nextQuestionIndex = nextNonConditional >= 0 ? nextNonConditional : nextQuestionIndex + 1;
      }
    }

    if (nextQuestionIndex >= questions.length) {
      navigate('/quiz/complete', { replace: true });
    } else {
      setCurrentQuestion(nextQuestionIndex);
      setSelectedAnswer(null);
    }
  };

  // Helper function for home builder auto-progress
  const saveAndProgress = async (newAnswers) => {
    await saveAnswers(newAnswers);
    setAnswers(newAnswers);
    
    if (currentQuestion === questions.length - 1) {
      navigate('/quiz/complete', { replace: true });
      return;
    }
    
    const nextQuestion = currentQuestion + 1;
    setCurrentQuestion(nextQuestion);
    navigate(`/quiz/${questions[nextQuestion].id}`, { replace: true });
  };

  const question = questions[currentQuestion];

  // Helper function to check if quiz is complete
  const isQuizComplete = (quizData) => {
    const requiredFields = ['buy_rent', 'disasters', 'size', 'lifespan'];
    return requiredFields.every(field => quizData[field] !== null && quizData[field] !== undefined);
  };

  // Helper function to find first unanswered question
  const findFirstUnansweredQuestion = (quizData) => {
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (question.condition) {
        const conditionQuestion = questions.find(q => q.id === question.condition.questionId);
        const conditionAnswer = quizData[conditionQuestion.field];
        if (conditionAnswer !== question.condition.answer) {
          continue;
        }
      }
      if (!quizData[question.field] && question.field) {
        return i;
      }
    }
    return questions.length - 1;
  };

  if (loading) {
    return (
      <QuizContainer>
        <QuestionText>Loading...</QuestionText>
      </QuizContainer>
    );
  }

  return (
    <QuizContainer>
      <QuestionText>{question.text}</QuestionText>
      
      {question.type === 'homeBuilder' ? (
        <HomeBuilder 
          onComplete={handleAnswer}
          initialValues={{
            size: answers.size || 0,
            loc: answers.loc || 0,
            vibe: answers.vibe || 0,
            sust: answers.sust || 0,
            dur: answers.dur || 0
          }}
        />
      ) : question.type === 'dropdown' ? (
        <DropdownContainer>
          <Select 
            onChange={(e) => handleAnswer(e.target.value)}
            value={answers[question.field] || ""}
          >
            <option value="" disabled>Select an option</option>
            {question.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          {[5, 6, 7].includes(question.id) && (
            <SkipButton onClick={() => handleAnswer(null)}>
              Skip
            </SkipButton>
          )}
        </DropdownContainer>
      ) : (
        <div>
          <OptionsContainer>
            {question.options.map((option) => (
              <Button 
                key={option} 
                onClick={() => handleAnswer(option)}
                selected={answers[question.field] === option}
              >
                {option}
              </Button>
            ))}
          </OptionsContainer>
          {[5, 6, 7].includes(question.id) && (
            <SkipButton onClick={() => handleAnswer(null)}>
              Skip this question
            </SkipButton>
          )}
        </div>
      )}
      
      <NavigationContainer>
        <BackButton 
          onClick={handleBack}
          disabled={currentQuestion === 0}
        >
          Back
        </BackButton>
        <Progress>
          Question {currentQuestion + 1} of {questions.length}
        </Progress>
        {question.type !== 'homeBuilder' && (
          <NextButton 
            onClick={handleNext}
            disabled={!answers[question.field] && ![5, 6, 7].includes(question.id)}
          >
            Next
          </NextButton>
        )}
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

const Progress = styled.div`
  margin-top: 20px;
  font-size: 0.8em;
`;

const DropdownContainer = styled.div`
  width: 100%;
  padding: 20px;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px;
  font-size: 1.1em;
  border: 2px solid #fff;
  background: #000;
  color: #fff;
  cursor: pointer;
  
  option {
    padding: 10px;
  }
  
  &:focus {
    outline: none;
    border-color: #666;
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
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
`;

const BackButton = styled.button`
  padding: 8px 16px;
  background: transparent;
  border: 2px solid ${props => props.disabled ? '#666' : '#fff'};
  color: ${props => props.disabled ? '#666' : '#fff'};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  
  &:hover:not(:disabled) {
    background: #333;
  }
`;

const NextButton = styled(BackButton)`
  &:not(:disabled) {
    border-color: #0f0;
    color: #0f0;
  }
  
  &:hover:not(:disabled) {
    background: #0f01;
  }
`;

export default Quiz; 