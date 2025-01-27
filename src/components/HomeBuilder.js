import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Get session ID or create one
const getSessionId = () => {
  try {
    let sessionId = localStorage.getItem('survey_session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('survey_session_id', sessionId);
    }
    return sessionId;
  } catch (error) {
    // If localStorage is not available, generate a temporary session ID
    return Math.random().toString(36).substring(2, 15);
  }
};

const INITIAL_POINTS = {
  size: 0,
  loc: 0,
  vibe: 0,
  sust: 5,  // Start at 5 only for new surveys
  sust_offset: 0,  // Match database column name
  dur: 0
};

const stats = [
  { name: 'Location', key: 'loc' },
  { name: 'Vibe', key: 'vibe' },
  { name: 'Size', key: 'size' },
  { name: 'Durability', key: 'dur' },
  { name: 'Impact (Environmental)', key: 'sust' }
];

function HomeBuilder() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(INITIAL_POINTS);
  const [showTooltip, setShowTooltip] = useState(false);
  
  useEffect(() => {
    let mounted = true;

    const checkPreviousSubmission = async () => {
      try {
        if (!mounted) return;

        const sessionId = getSessionId();
        
        // First try to get existing survey
        let { data: existingData, error: selectError } = await supabase
          .from('survey_responses')
          .select()
          .eq('session_id', sessionId)
          .maybeSingle();  // Use maybeSingle instead of single to avoid errors
          
        if (selectError) {
          console.error('Select error:', {
            code: selectError.code,
            message: selectError.message,
            details: selectError.details,
            hint: selectError.hint
          });
          throw selectError;
        }
          
        if (!mounted) return;

        if (existingData) {
          setPoints({
            size: existingData.size || 0,
            loc: existingData.loc || 0,
            vibe: existingData.vibe || 0,
            sust: existingData.sust || 5,
            sust_offset: existingData.sust_offset || 0,  // Match database column name
            dur: existingData.dur || 0
          });
        } else {
          const initialPoints = {
            session_id: sessionId,
            ...INITIAL_POINTS
          };

          const { error: insertError } = await supabase
            .from('survey_responses')
            .insert(initialPoints)
            .select()
            .maybeSingle();
            
          if (insertError) {
            throw insertError;
          }

          if (!mounted) return;
          setPoints(INITIAL_POINTS);
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
  
  // Track green points (10 total) separately from blue impact points
  const totalGreenPoints = points.size + points.loc + points.vibe + points.dur + points.sust_offset;  // Match database column name
  const remainingGreenPoints = 10 - totalGreenPoints;

  const handleIncrement = (stat) => {
    if (points[stat] < 5) {
      if (stat === 'size' || stat === 'dur') {
        // Size and durability decrease impact (blue) points
        if (remainingGreenPoints > 0 && points.sust > 0) {
          const newPoints = {
            ...points,
            [stat]: points[stat] + 1,
            sust: points.sust - 1
          };
          setPoints(newPoints);
        }
      } else if (stat === 'sust') {
        // Can spend green points to offset impact loss
        if (remainingGreenPoints > 0) {
          const newPoints = {
            ...points,
            sust: points.sust + 1,  // Increase blue impact points
            sust_offset: points.sust_offset + 1  // Match database column name
          };
          setPoints(newPoints);
        }
      } else {
        // Other stats just use green points
        if (remainingGreenPoints > 0) {
          const newPoints = { ...points, [stat]: points[stat] + 1 };
          setPoints(newPoints);
        }
      }
    }
  };

  const handleDecrement = (stat) => {
    if (points[stat] > 0) {
      if (stat === 'size' || stat === 'dur') {
        // Size and durability return both green point and blue impact
        const newPoints = {
          ...points,
          [stat]: points[stat] - 1,
          sust: points.sust + 1  // Return 1 blue impact point
        };
        setPoints(newPoints);
      } else if (stat === 'sust' && points.sust_offset > 0) {  // Match database column name
        // Only remove offset points for impact
        const newPoints = {
          ...points,
          sust: points.sust - 1,
          sust_offset: points.sust_offset - 1  // Match database column name
        };
        setPoints(newPoints);
      } else {
        // Other stats just return green points
        const newPoints = { ...points, [stat]: points[stat] - 1 };
        setPoints(newPoints);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      // Only validate that points are in valid range
      for (const [, value] of Object.entries(points)) {
        if (value < 0 || value > 5) {
          return;
        }
      }

      const sessionId = getSessionId();
      
      // Update with the new values, ensuring field names match database
      const updateData = {
        session_id: sessionId,
        size: points.size,
        loc: points.loc,
        vibe: points.vibe,
        sust: points.sust,
        sust_offset: points.sust_offset,  // Match database column name
        dur: points.dur
      };

      // Try to update first
      const { error: updateError } = await supabase
        .from('survey_responses')
        .update(updateData)
        .eq('session_id', sessionId)
        .select();

      if (updateError) {
        throw updateError;
      }

      navigate('/survey/5');
    } catch (error) {
      console.error('Error saving points:', error);
    }
  };

  if (loading) return <QuestionText>Loading...</QuestionText>;

  return (
    <BuilderContainer>
      <QuestionText>Spec your home:</QuestionText>
      <QuestionSubtext>
        Use the available credits to set your next home's priorities.
      </QuestionSubtext>
      <RemainingPoints>
        Credits Remaining: {remainingGreenPoints}
      </RemainingPoints>
      
      {stats.map(({ name, key }) => (
        <StatRow key={key}>
          <ControlRow>
            <StatName>{name}</StatName>
            <Controls>
              {key === 'sust' ? (
                <>
                  <Button 
                    onClick={() => handleDecrement(key)}
                    disabled={key === 'sust' ? points.sust_offset <= 0 : points[key] <= 0}
                  >
                    +
                  </Button>
                  <TooltipContainer 
                    onMouseEnter={() => points[key] < 5 && remainingGreenPoints > 0 && setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                  >
                    <Button 
                      onClick={() => handleIncrement(key)}
                      disabled={points[key] >= 5 || remainingGreenPoints <= 0}
                      $isIncrement={true}
                    >
                      -
                    </Button>
                    <Tooltip $show={showTooltip && points[key] < 5 && remainingGreenPoints > 0}>
                      Sustainable materials and practices can offset your impact, but they come at a premium.
                    </Tooltip>
                  </TooltipContainer>
                </>
              ) : (
                <>
                  <Button 
                    onClick={() => handleDecrement(key)}
                    disabled={key === 'sust' ? points.sust_offset <= 0 : points[key] <= 0}
                  >
                    -
                  </Button>
                  <Button 
                    onClick={() => handleIncrement(key)}
                    disabled={
                      points[key] >= 5 || 
                      remainingGreenPoints <= 0 ||
                      ((key === 'size' || key === 'dur') && points.sust <= 0)
                    }
                    $isIncrement={true}
                  >
                    +
                  </Button>
                </>
              )}
            </Controls>
          </ControlRow>
          <StatBarContainer>
            <StatBar>
              {[...Array(5)].map((_, i) => (
                <Segment 
                  key={i} 
                  $filled={i < points[key]}
                  $stat={key}
                />
              ))}
            </StatBar>
          </StatBarContainer>
        </StatRow>
      ))}
      
      <NavigationContainer>
        <BackButton onClick={() => navigate('/survey/disasters')}>
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

const BuilderContainer = styled.div.attrs({ className: 'question-container' })``;

const QuestionText = styled.h2``;

const QuestionSubtext = styled.p`
  margin-bottom: 20px;
`;

const RemainingPoints = styled.p`
  margin-bottom: 20px;
  color: #0f0;
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  align-items: start;
  margin: 10px 0;
  padding: 10px;
  border: 2px solid #fff;
  
  @media (max-width: 768px) {
    padding: 8px;
  }
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
  line-height: 1.3;
  
  @media (max-width: 768px) {
    min-width: 100px;
  }
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
  background: ${props => {
    if (props.$stat === 'sust') {
      return props.$filled ? '#333' : '#f00';
    }
    return props.$filled ? '#0f0' : '#333';
  }};
  border: 2px solid ${props => {
    if (props.$stat === 'sust') {
      return props.$filled ? '#666' : '#f00';
    }
    return props.$filled ? '#0f0' : '#666';
  }};
  image-rendering: pixelated;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;

const TooltipContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const Tooltip = styled.div`
  visibility: ${props => props.$show ? 'visible' : 'hidden'};
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px;
  background: #000;
  border: 2px solid #fff;
  color: #fff;
  font-size: 0.7em;
  white-space: normal;
  margin-bottom: 8px;
  z-index: 1;
  width: 250px;
  text-align: center;
  line-height: 1.4;
  
  @media (max-width: 768px) {
    font-size: 0.6em;
    width: 200px;
    padding: 6px;
    left: auto;
    right: 0;
    transform: none;
    margin-right: -10px;
  }

  &:after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: #fff transparent transparent transparent;

    @media (max-width: 768px) {
      left: auto;
      right: 15px;
      margin-left: 0;
    }
  }
`;

const Button = styled.button`
  padding: 5px 10px;
  min-width: 40px;
  background: ${props => props.$isIncrement && !props.disabled ? '#0f0' : 'transparent'};
  border: 2px solid ${props => props.$isIncrement && !props.disabled ? '#0f0' : '#fff'};
  color: ${props => props.$isIncrement && !props.disabled ? '#000' : '#fff'};
  
  @media (max-width: 768px) {
    padding: 4px 8px;
    min-width: 32px;
  }
  
  &:hover:not(:disabled) {
    background: ${props => props.$isIncrement && !props.disabled ? '#0d0' : '#333'};
    color: ${props => props.$isIncrement && !props.disabled ? '#000' : '#fff'};
  }
`;

const NavigationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
`;

const BackButton = styled.button.attrs({ className: 'back-button' })``;

const SubmitButton = styled.button.attrs({ className: 'submit-button' })``;

export default HomeBuilder;