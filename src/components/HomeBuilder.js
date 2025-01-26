import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Get session ID or create one
const getSessionId = () => {
  let sessionId = localStorage.getItem('survey_session_id');
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('survey_session_id', sessionId);
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
  const [points, setPoints] = useState({
    size: 0,
    loc: 0,
    vibe: 0,
    sust: 10,  // Blue sustainability points (start at 10)
    sustOffset: 0,  // Green points spent to offset sustainability loss
    dur: 0
  });
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
            sust: 10,  // Always start at 10
            sustOffset: existingData.sust_offset || 0,  // Match database column name
            dur: existingData.dur || 0
          });
        } else {
          const initialPoints = {
            session_id: sessionId,
            size: 0,
            loc: 0,
            vibe: 0,
            sust: 10,  // Start at 10
            sust_offset: 0,
            dur: 0
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
        // Size and durability return both green point and blue sustainability
        const newPoints = {
          ...points,
          [stat]: points[stat] - 1,
          sust: points.sust + 1  // Return blue sustainability point
        };
        setPoints(newPoints);
      } else if (stat === 'sust' && points.sustOffset > 0) {
        // Only remove offset points for sustainability
        const newPoints = {
          ...points,
          sust: points.sust - 1,
          sustOffset: points.sustOffset - 1
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
        if (value < 0 || value > 10) {
          return;
        }
      }

      const sessionId = getSessionId();
      
      // Update with the new values, ensuring field names match database
      const updateData = {
        session_id: sessionId,  // Include session_id in update
        size: points.size,
        loc: points.loc,
        vibe: points.vibe,
        sust: points.sust,
        sust_offset: points.sustOffset,  // Match the database field name
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
      // Keep this error log for debugging purposes
      console.error('Error saving points:', error);
    }
  };

  if (loading) return <QuestionText>Loading...</QuestionText>;

  return (
    <BuilderContainer>
      <QuestionText>Build your ideal home:</QuestionText>
      <QuestionSubtext>
        Use your credits to set your perfect home's priorities.
      </QuestionSubtext>
      <RemainingPoints>
        Credits Remaining: {remainingGreenPoints}
      </RemainingPoints>
      
      {stats.map(({ name, key }) => (
        <StatRow key={key}>
          <ControlRow>
            <StatName>{name}</StatName>
            <Controls>
              <Button 
                onClick={() => handleDecrement(key)}
                disabled={key === 'sust' ? points.sustOffset <= 0 : points[key] <= 0}
              >
                -
              </Button>
              {key === 'sust' ? (
                <TooltipContainer 
                  onMouseEnter={() => points[key] < 10 && remainingGreenPoints > 0 && setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  <Button 
                    onClick={() => handleIncrement(key)}
                    disabled={points[key] >= 10 || remainingGreenPoints <= 0}
                  >
                    +
                  </Button>
                  <Tooltip $show={showTooltip && points[key] < 10 && remainingGreenPoints > 0}>
                    Sustainable materials and practices can offset your impact, but they come at a premium.
                  </Tooltip>
                </TooltipContainer>
              ) : (
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
              )}
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
  }
`;

const Button = styled.button`
  padding: 5px 10px;
  min-width: 40px;
  background: ${props => props.children === '+' && !props.disabled ? '#0f0' : 'transparent'};
  border: 2px solid ${props => props.children === '+' && !props.disabled ? '#0f0' : '#fff'};
  color: ${props => props.children === '+' && !props.disabled ? '#000' : '#fff'};
  
  @media (max-width: 768px) {
    padding: 4px 8px;
    min-width: 32px;
  }
  
  &:hover:not(:disabled) {
    background: ${props => props.children === '+' && !props.disabled ? '#0f0' : '#333'};
    color: ${props => props.children === '+' && !props.disabled ? '#000' : '#fff'};
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