import React from 'react';
import BaseQuestion from './BaseQuestion';

export default function DisasterType() {
  return (
    <BaseQuestion
      question="What type of natural disasters?"
      options={["Hurricane", "Earthquake", "Flood", "Wildfire", "Tornado", "Other"]}
      field="disaster_type"
      nextPath="/survey/4"
      previousPath="/survey/2"
    />
  );
} 