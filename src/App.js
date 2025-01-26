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
import Intro from './components/Intro';
import ThankYou from './components/ThankYou';
import Results from './components/Results';

function App() {
  return (
    <>
      <GlobalStyle />
      <BrowserRouter>
        <AppContainer>
          <Routes>
            <Route path="/" element={<Navigate to="/survey" replace />} />
            <Route path="/survey" element={<Intro />} />
            <Route path="/survey/complete" element={<ThankYou />} />
            <Route path="/survey/1" element={<BuyRent />} />
            <Route path="/survey/2" element={<Disasters />} />
            <Route path="/survey/3" element={<DisasterType />} />
            <Route path="/survey/4" element={<HomeBuilder />} />
            <Route path="/survey/5" element={<Lifespan />} />
            <Route path="/survey/6" element={<Demographics />} />
            <Route path="/quiz/results" element={<Results />} />
            <Route path="*" element={<Navigate to="/survey" replace />} />
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