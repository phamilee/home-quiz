import React from 'react';
import BaseQuestion from './BaseQuestion';

export default function Disasters() {
  return (
    <BaseQuestion
      question="Does your area experience natural disasters?"
      options={["yes", "no"]}
      field="disasters"
      nextPath={(answer) => answer === "yes" ? "/quiz/disaster-type" : "/quiz/home-builder"}
      previousPath="/quiz/buy-rent"
    />
  );
} 