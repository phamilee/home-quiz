import React from 'react';
import BaseQuestion from './BaseQuestion';

export default function DisasterType() {
  return (
    <BaseQuestion
      question="What type of natural disaster have you experienced?"
      options={["Hurricane", "Earthquake", "Flood", "Wildfire", "Tornado", "Other"]}
      field="disaster_type"
      nextPath="/quiz/home-builder"
      previousPath="/quiz/disasters"
    />
  );
} 