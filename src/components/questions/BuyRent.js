import React from 'react';
import BaseQuestion from './BaseQuestion';

export default function BuyRent() {
  return (
    <BaseQuestion
      question="For your next home, will you be buying or renting?"
      options={["buy", "rent"]}
      field="buy_rent"
      nextPath="/quiz/disasters"
    />
  );
} 