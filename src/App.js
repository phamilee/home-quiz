import React from 'react';
import styled from 'styled-components';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GlobalStyle } from './styles/GlobalStyle';
import HomeBuilder from './components/HomeBuilder';
import BuyRent from './components/questions/BuyRent';
import Disasters from './components/questions/Disasters';
import DisasterType from './components/questions/DisasterType';
import Lifespan from './components/questions/Lifespan';
import Demographics from './components/questions/Demographics';

function App() {
  return (
    <>
      <GlobalStyle />
      <BrowserRouter>
        <AppContainer>
          <Routes>
            <Route path="/quiz/complete" element={<div>Quiz Complete!</div>} />
            <Route path="/quiz/buy-rent" element={<BuyRent />} />
            <Route path="/quiz/disasters" element={<Disasters />} />
            <Route path="/quiz/disaster-type" element={<DisasterType />} />
            <Route path="/quiz/home-builder" element={<HomeBuilder />} />
            <Route path="/quiz/lifespan" element={<Lifespan />} />
            <Route path="/quiz/demographics" element={<Demographics />} />
            <Route path="*" element={<Navigate to="/quiz/buy-rent" replace />} />
          </Routes>
        </AppContainer>
      </BrowserRouter>
    </>
  );
}

const AppContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #000;
  color: #fff;
  font-family: 'Press Start 2P', cursive;
`;

export default App; 