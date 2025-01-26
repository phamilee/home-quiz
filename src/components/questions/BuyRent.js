import React from 'react';
import BaseQuestion from './BaseQuestion';

export default function BuyRent() {
  return (
    <BaseQuestion
      question="For your next home, will you be renting or buying?"
      options={["rent", "buy"]}
      field="buy_rent"
      nextPath="/survey/2"
    />
  );
} 