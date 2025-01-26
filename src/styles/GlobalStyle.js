import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    overflow: hidden;
  }

  /* Common text styles */
  h2 {
    line-height: 1.5;
    font-size: 1.5rem;
    margin-bottom: 30px;
    
    @media (max-width: 768px) {
      font-size: 1.2rem;
      margin-bottom: 20px;
    }
  }

  p {
    line-height: 1.5;
    font-size: 1rem;
    
    @media (max-width: 768px) {
      font-size: 0.9rem;
    }
  }

  /* Common button styles */
  button {
    font-family: 'Press Start 2P', cursive;
    background: #333;
    color: white;
    border: 2px solid #fff;
    padding: 10px 20px;
    cursor: pointer;
    image-rendering: pixelated;
    font-size: 1rem;
    
    @media (max-width: 768px) {
      font-size: 0.8rem;
      padding: 8px 12px;
    }
    
    &:hover {
      background: #666;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      border-color: #666;
      color: #666;
      background: transparent;
    }
  }

  /* Navigation buttons */
  button.back-button {
    background: transparent;
    border: 2px solid #fff;
    
    &:hover {
      background: #333;
    }
  }

  button.next-button, button.submit-button {
    background: transparent;
    border: 2px solid #0f0;
    color: #0f0;
    
    &:hover:not(:disabled) {
      background: #0f01;
    }
    
    &:disabled {
      border-color: #666;
      color: #666;
    }
  }

  /* Common container styles */
  .question-container {
    width: 100%;
    max-width: 600px;
    background: #000;
    border: 4px solid #fff;
    padding: 20px;
    text-align: center;
    
    @media (max-width: 768px) {
      border: none;
      padding: 15px;
      max-height: 100vh;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
  }

  input {
    font-family: 'Press Start 2P', cursive;
    padding: 10px;
    margin: 5px 0;
    background: #000;
    border: 2px solid #fff;
    color: #fff;
    
    @media (max-width: 768px) {
      padding: 8px;
      font-size: 0.9rem;
    }
  }
`; 