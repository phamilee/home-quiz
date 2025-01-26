import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Get session ID or create one
const getSessionId = () => {
  let sessionId = localStorage.getItem('quiz_session_id');
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('quiz_session_id', sessionId);
  }
  return sessionId;
};

const stats = [
  { name: 'Size', key: 'size' },
  { name: 'Location', key: 'loc' },
  { name: 'Vibe', key: 'vibe' },
  { name: 'Sustainability', key: 'sust' },
  { name: 'Durability', key: 'dur' }
];

function HomeBuilder() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [quizId, setQuizId] = useState(null);
  const [points, setPoints] = useState({
    size: 0,
    loc: 0,
    vibe: 0,
    sust: 10,  // Blue sustainability points (start at 10)
    sustOffset: 0,  // Green points spent to offset sustainability loss
    dur: 0
  });
  
  useEffect(() => {
    let mounted = true;

    const checkPreviousSubmission = async () => {
      try {
        if (!mounted) return;

        const sessionId = getSessionId();
        
        // First try to get existing quiz
        let { data: existingData, error: selectError } = await supabase
          .from('quiz_responses')
          .select()
          .eq('session_id', sessionId)
          .single();
          
        if (!mounted) return;

        if (existingData) {
          console.log('Found existing quiz:', existingData);
          setQuizId(existingData.id);
          setPoints({
            size: existingData.size || 0,
            loc: existingData.loc || 0,
            vibe: existingData.vibe || 0,
            sust: 10,  // Always start at 10
            sustOffset: existingData.sust_offset || 0,  // Match database column name
            dur: existingData.dur || 0
          });
        } else {
          console.log('Creating new quiz with initial points');
          const initialPoints = {
            session_id: sessionId,
            size: 0,
            loc: 0,
            vibe: 0,
            sust: 10,  // Start at 10
            sust_offset: 0,  // Match database column name
            dur: 0
          };

          console.log('Inserting initial points:', initialPoints);
          const { data: newQuiz, error: insertError } = await supabase
            .from('quiz_responses')
            .insert(initialPoints)
            .select()
            .single();
            
          if (insertError) {
            console.error('Insert error:', {
              code: insertError.code,
              message: insertError.message,
              details: insertError.details,
              hint: insertError.hint,
              initialPoints
            });
            throw insertError;
          }

          if (!mounted) return;

          console.log('New quiz created:', newQuiz);
          setQuizId(newQuiz.id);
          setPoints({
            size: 0,
            loc: 0,
            vibe: 0,
            sust: 10,  // Always start at 10
            sustOffset: 0,
            dur: 0
          });
        }
        
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkPreviousSubmission();

    return () => {
      mounted = false;
    };
  }, []);
  
  // Track green points (10 total) separately from blue sustainability points
  const totalGreenPoints = points.size + points.loc + points.vibe + points.dur + points.sustOffset;
  const remainingGreenPoints = 10 - totalGreenPoints;
  const currentSustPoints = points.sust;  // Blue sustainability points

  const handleIncrement = (stat) => {
    if (points[stat] < 10) {
      if (stat === 'size' || stat === 'dur') {
        // Size and durability decrease sustainability (blue) points
        if (remainingGreenPoints > 0 && points.sust > 0) {
          const newPoints = {
            ...points,
            [stat]: points[stat] + 1,
            sust: points.sust - 1  // Decrease blue sustainability points
          };
          console.log(`Incrementing ${stat}, using 1 green point and decreasing sust by 1:`, newPoints);
          setPoints(newPoints);
        }
      } else if (stat === 'sust') {
        // Can spend green points to offset sustainability loss
        if (remainingGreenPoints > 0) {
          const newPoints = {
            ...points,
            sust: points.sust + 1,  // Increase blue sustainability points
            sustOffset: points.sustOffset + 1  // Count the green point spent
          };
          console.log(`Offsetting sust loss with 1 green point:`, newPoints);
          setPoints(newPoints);
        }
      } else {
        // Other stats just use green points
        if (remainingGreenPoints > 0) {
          const newPoints = { ...points, [stat]: points[stat] + 1 };
          console.log(`Incrementing ${stat}, using 1 green point:`, newPoints);
          setPoints(newPoints);
        }
      }
    }
  };

  const handleDecrement = (stat) => {
    if (points[stat] > 0) {
      if (stat === 'size' || stat === 'dur') {
        // Size and durability return both green point and blue sustainability
        const newPoints = {
          ...points,
          [stat]: points[stat] - 1,
          sust: points.sust + 1  // Return blue sustainability point
        };
        console.log(`Decrementing ${stat}, returning 1 green point and 1 sust:`, newPoints);
        setPoints(newPoints);
      } else if (stat === 'sust' && points.sustOffset > 0) {
        // Return green point used for sustainability offset
        const newPoints = {
          ...points,
          sust: points.sust - 1,
          sustOffset: points.sustOffset - 1
        };
        console.log(`Removing sust offset, returning 1 green point:`, newPoints);
        setPoints(newPoints);
      } else {
        // Other stats just return green points
        const newPoints = { ...points, [stat]: points[stat] - 1 };
        console.log(`Decrementing ${stat}, returning 1 green point:`, newPoints);
        setPoints(newPoints);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      // Only validate that points are in valid range
      for (const [key, value] of Object.entries(points)) {
        if (value < 0 || value > 10) {
          console.error(`Invalid value for ${key}:`, value);
          return;
        }
      }

      const sessionId = getSessionId();

      // Calculate totals
      const totalGreenUsed = points.size + points.loc + points.vibe + points.dur + points.sustOffset;
      
      // Update with the new values
      const updateData = {
        session_id: sessionId,
        size: points.size,
        loc: points.loc,
        vibe: points.vibe,
        sust: points.sust,
        sust_offset: points.sustOffset,
        dur: points.dur
      };

      console.log('Current state:', {
        points,
        totalGreenUsed,
        updateData,
        sessionId
      });

      // Update using session_id
      const { data, error } = await supabase
        .from('quiz_responses')
        .update(updateData)
        .eq('session_id', sessionId)
        .select();

      if (error) {
        console.error('Error updating record:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          sessionId
        });
        throw error;
      }

      console.log('Update successful:', data);
      navigate('/quiz/4');
    } catch (error) {
      console.error('Error saving points:', error);
    }
  };

  if (loading) return <QuestionText>Loading...</QuestionText>;

  return (
    <BuilderContainer>
      <QuestionText>Build your ideal home:</QuestionText>
      <RemainingPoints>
        Points Remaining: {remainingGreenPoints}
      </RemainingPoints>
      
      {stats.map(({ name, key }) => (
        <StatRow key={key}>
          <ControlRow>
            <StatName>{name}</StatName>
            <Controls>
                <Button onClick={() => handleDecrement(key)}>-</Button>
                <Button 
                  onClick={() => handleIncrement(key)}
                  disabled={
                    points[key] >= 10 || 
                    remainingGreenPoints <= 0 ||
                    ((key === 'size' || key === 'dur') && points.sust <= 0)
                  }
                >
                  +
                </Button>
              </Controls>
              </ControlRow>
          <StatBarContainer>
            <StatBar>
              {[...Array(10)].map((_, i) => (
                <Segment 
                  key={i} 
                  $filled={i < points[key]}
                />
              ))}
            </StatBar>
          </StatBarContainer>
        </StatRow>
      ))}
      
      <NavigationContainer>
        <BackButton onClick={() => navigate('/quiz/disasters')}>
          Back
        </BackButton>
        <SubmitButton 
          disabled={totalGreenPoints !== 10}
          onClick={handleSubmit}
        >
          Confirm Stats
        </SubmitButton>
      </NavigationContainer>
    </BuilderContainer>
  );
}

const BuilderContainer = styled.div`
  width: 80%;
  max-width: 600px;
  background: #000;
  border: 4px solid #fff;
  padding: 20px;
`;

const QuestionText = styled.h2`
  margin-bottom: 15px;
  line-height: 1.5;
  text-align: center;
`;

const RemainingPoints = styled.div`
  margin-bottom: 20px;
  color: #0f0;
  text-align: center;
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  align-items: start;
  margin: 10px 0;
  padding: 10px;
  border: 2px solid #fff;
`;

const ControlRow = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  margin-bottom: 10px;
  align-items: center;
`;

const StatName = styled.span`
  text-align: left;
  min-width: 120px;
`;

const StatBarContainer = styled.div`
  flex: 1;
  display: flex;
  gap: 10px;
  width: 100%;
`;

const StatBar = styled.div`
  display: flex;
  gap: 4px;
  height: 20px;
  width: 100%;
`;

const Segment = styled.div`
  flex: 1;
  background: ${props => props.$filled ? '#0f0' : '#333'};
  border: 2px solid ${props => props.$filled ? '#0f0' : '#666'};
  image-rendering: pixelated;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;

const StatValue = styled.span`
  min-width: 30px;
  text-align: center;
`;

const Button = styled.button`
  padding: 5px 10px;
  min-width: 40px;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

const SubmitButton = styled.button`
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

export default HomeBuilder;