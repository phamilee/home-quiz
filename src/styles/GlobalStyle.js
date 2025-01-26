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

  button {
    font-family: 'Press Start 2P', cursive;
    background: #333;
    color: white;
    border: 2px solid #fff;
    padding: 10px 20px;
    cursor: pointer;
    image-rendering: pixelated;
    
    &:hover {
      background: #666;
    }
  }

  input {
    font-family: 'Press Start 2P', cursive;
    padding: 10px;
    margin: 5px 0;
    background: #000;
    border: 2px solid #fff;
    color: #fff;
  }
`; 