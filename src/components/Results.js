import React, { useState, useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';
import * as d3 from 'd3';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrthographicCamera, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei';
import { supabase } from '../supabaseClient';

const VARIABLES = {
  size: { name: 'Size' },
  loc: { name: 'Location' },
  vibe: { name: 'Vibe' },
  sust: { name: 'Sustainability' },
  dur: { name: 'Durability' }
};

const FILTER_VARIABLES = {
  buy_rent: { name: 'Buy vs Rent', values: ['rent', 'buy'] },
  age_range: { name: 'Age Range', values: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'] },
  gender_identity: { name: 'Gender Identity', values: ['Male', 'Female', 'Non-binary'] },
  profession: { name: 'Profession', values: [
    'Student',
    'Healthcare',
    'Technology',
    'Education',
    'Business',
    'Arts & Entertainment',
    'Service Industry',
    'Retired',
    'Other'
  ]}
};

function Scene({ data, xVar, yVar, zVar }) {
  const points = useMemo(() => {
    return data.map(point => ({
      // Map 0-10 to unit grid centered at 5
      x: (point[xVar] - 5) / 10,  // Now 0->-0.5, 5->0, 10->0.5
      y: (point[yVar] - 5) / 10,
      z: -(point[zVar] - 5) / 10,
      color: point.color
    }));
  }, [data, xVar, yVar, zVar]);

  return (
    <group>
      {points.map((point, index) => (
        <mesh key={index} position={[point.x, point.y, point.z]}>
          <sphereGeometry args={[0.015, 32, 32]} />
          <meshStandardMaterial color={point.color} metalness={0.5} roughness={0.2} />
        </mesh>
      ))}
      {/* Coordinate system */}
      <group>
        {/* X axis - red */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.0, 0.005, 0.005]} />
          <meshStandardMaterial color="#ff4444" opacity={0.2} transparent />
        </mesh>
        {/* Y axis - green */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.005, 1.0, 0.005]} />
          <meshStandardMaterial color="#44ff44" opacity={0.2} transparent />
        </mesh>
        {/* Z axis - blue */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.005, 0.005, 1.0]} />
          <meshStandardMaterial color="#4444ff" opacity={0.4} transparent />
        </mesh>
      </group>
    </group>
  );
}

function CameraRig({ mousePosition }) {
  const cameraRef = useRef();
  
  useFrame(() => {
    if (!cameraRef.current || !mousePosition) return;
    
    const radius = 1.5;
    
    // Start from isometric angles (45° from each axis)
    const baseTheta = Math.PI / 4; // 45 degrees
    const basePhi = Math.PI / 3; // ~54.7 degrees (arccos(1/√3))
    
    // Add mouse movement to base angles
    const phi = basePhi - (mousePosition.y * Math.PI/4);
    const theta = baseTheta + (mousePosition.x * Math.PI/2);
    
    // Convert spherical to cartesian coordinates
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    
    // Smooth camera movement
    cameraRef.current.position.x += (x - cameraRef.current.position.x) * 0.1;
    cameraRef.current.position.y += (y - cameraRef.current.position.y) * 0.1;
    cameraRef.current.position.z += (z - cameraRef.current.position.z) * 0.1;
    
    cameraRef.current.lookAt(0, 0, 0);
  });

  // Initial position should be isometric
  const isometricPosition = [
    1.5 * Math.sqrt(1/3),  // x = r * cos(45°) * sin(54.7°)
    1.5 * Math.sqrt(1/3),  // y = r * cos(54.7°)
    1.5 * Math.sqrt(1/3)   // z = r * sin(45°) * sin(54.7°)
  ];

  return (
    <OrthographicCamera
      ref={cameraRef}
      makeDefault
      position={isometricPosition}
      zoom={400}
      near={0.01}
      far={2000}
    />
  );
}

export default function Results() {
  const [rawData, setRawData] = useState({ left: [], right: [] });
  const [loading, setLoading] = useState(true);
  const [xVar, setXVar] = useState('size');
  const [yVar, setYVar] = useState('loc');
  const [zVar, setZVar] = useState('vibe');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [leftFilter, setLeftFilter] = useState('rent');
  const [rightFilter, setRightFilter] = useState('buy');
  const containerRef = useRef();

  const handleMouseMove = (event) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Normalize mouse position to [-1, 1]
    const x = (event.clientX - centerX) / (rect.width / 2);
    const y = (event.clientY - centerY) / (rect.height / 2);
    
    setMousePosition({ x, y });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: surveyData, error } = await supabase
          .from('survey_responses')
          .select('*');

        if (error) throw error;

        const colorScale = d3.scaleSequential(d3.interpolateViridis)
          .domain([0, 20]);

        const coloredData = surveyData.map(response => ({
          ...response,
          color: colorScale(response.sust + response.dur)
        }));

        setRawData({
          left: coloredData.filter(d => d.buy_rent === leftFilter),
          right: coloredData.filter(d => d.buy_rent === rightFilter)
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [leftFilter, rightFilter]);

  if (loading) return <LoadingText>Loading visualization...</LoadingText>;

  return (
    <FullScreenContainer 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePosition({ x: 0, y: 0 })}
    >
      <VisualizationRow>
        <VisualizationColumn>
          <VisualizationTitle>
            <Select value={leftFilter} onChange={(e) => setLeftFilter(e.target.value)}>
              {FILTER_VARIABLES.buy_rent.values.map(value => (
                <option key={value} value={value}>{value}</option>
              ))}
            </Select>
          </VisualizationTitle>
          <VisualizationContainer>
            <Canvas dpr={[1, 2]}>
              <CameraRig mousePosition={mousePosition} />
              <ambientLight intensity={1} />
              <pointLight position={[10, 10, 10]} intensity={1} />
              <Scene 
                data={rawData.left} 
                xVar={xVar} 
                yVar={yVar} 
                zVar={zVar}
              />
              <AdaptiveDpr pixelated />
              <AdaptiveEvents />
            </Canvas>
          </VisualizationContainer>
        </VisualizationColumn>

        <VisualizationColumn>
          <VisualizationTitle>
            <Select value={rightFilter} onChange={(e) => setRightFilter(e.target.value)}>
              {FILTER_VARIABLES.buy_rent.values.map(value => (
                <option key={value} value={value}>{value}</option>
              ))}
            </Select>
          </VisualizationTitle>
          <VisualizationContainer>
            <Canvas dpr={[1, 2]}>
              <CameraRig mousePosition={mousePosition} />
              <ambientLight intensity={1} />
              <pointLight position={[10, 10, 10]} intensity={1} />
              <Scene 
                data={rawData.right} 
                xVar={xVar} 
                yVar={yVar} 
                zVar={zVar}
              />
              <AdaptiveDpr pixelated />
              <AdaptiveEvents />
            </Canvas>
          </VisualizationContainer>
        </VisualizationColumn>
      </VisualizationRow>
      
      <ControlsContainer>
        <AxisControl>
          <Label>X:</Label>
          <Select value={xVar} onChange={(e) => setXVar(e.target.value)}>
            {Object.entries(VARIABLES).map(([key, { name }]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </Select>
        </AxisControl>
        
        <AxisControl>
          <Label>Y:</Label>
          <Select value={yVar} onChange={(e) => setYVar(e.target.value)}>
            {Object.entries(VARIABLES).map(([key, { name }]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </Select>
        </AxisControl>
        
        <AxisControl>
          <Label>Z:</Label>
          <Select value={zVar} onChange={(e) => setZVar(e.target.value)}>
            {Object.entries(VARIABLES).map(([key, { name }]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </Select>
        </AxisControl>
      </ControlsContainer>
    </FullScreenContainer>
  );
}

const FullScreenContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  display: flex;
  flex-direction: column;
`;

const VisualizationRow = styled.div`
  flex: 1;
  display: flex;
  gap: 1px;
  background: #333;
`;

const VisualizationColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #000;
`;

const VisualizationTitle = styled.h2`
  text-align: center;
  padding: 1rem;
  margin: 0;
  color: #0f0;
  font-size: clamp(1rem, 2vw, 1.5rem);
  border-bottom: 1px solid #333;
`;

const VisualizationContainer = styled.div`
  flex: 1;
  width: 100%;
`;

const ControlsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.9);
  border-top: 1px solid #333;
`;

const AxisControl = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-family: 'Press Start 2P', cursive;
  font-size: clamp(0.7rem, 1.5vw, 0.9rem);
  color: #fff;
`;

const Select = styled.select`
  background: #000;
  border: 1px solid #333;
  color: #fff;
  padding: 0.4rem 0.6rem;
  font-family: inherit;
  font-size: clamp(0.7rem, 1.5vw, 0.9rem);
  cursor: pointer;

  &:hover {
    border-color: #666;
  }

  option {
    background: #000;
    color: #fff;
  }
`;

const LoadingText = styled.h2`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #0f0;
  font-size: clamp(1.2rem, 2.5vw, 1.5rem);
`;

/* Commenting out FilterContainer styled component
const FilterContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.9);
  border-bottom: 1px solid #333;
`; 
*/ 