import React from 'react';
import BaseQuestion from './BaseQuestion';

export default function Lifespan() {
  return (
    <BaseQuestion
      question="How long do you expect the building to last?"
      options={[
        "5-15 years",
        "16-35 years",
        "36-75 years",
        "76-100 years",
        "100+ years"
      ]}
      field="lifespan"
      nextPath="/survey/6"
      previousPath="/survey/4"
    />
  );
} 