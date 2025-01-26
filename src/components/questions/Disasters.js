import React from 'react';
import BaseQuestion from './BaseQuestion';

export default function Disasters() {
  return (
    <BaseQuestion
      question="Is your area prone to natural disasters?"
      options={["yes", "no"]}
      field="disasters"
      nextPath={(answer) => answer === "yes" ? "/survey/3" : "/survey/4"}
      previousPath="/survey/1"
    />
  );
} 