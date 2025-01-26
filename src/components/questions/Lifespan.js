import React from 'react';
import BaseQuestion from './BaseQuestion';

export default function Lifespan() {
  return (
    <BaseQuestion
      question="How long do you expect the building to last?"
      options={[
        "5-25 years",
        "26-50 years",
        "51-100 years",
        "100+ years"
      ]}
      field="lifespan"
      nextPath="/quiz/demographics"
      previousPath="/quiz/home-builder"
    />
  );
} 