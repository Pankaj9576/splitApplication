import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import SplitScreen from './SplitScreen';
import GoogleSheetsUploader from './GoogleSheetsUploader';
import { useGoogleLogin } from '@react-oauth/google';
import BigQueryPatentFetcher from './BigQueryPatentFetcher';
import PatentViewer from './PatentViewer';
import { msalInstance } from '../services/msalConfig';
import ProxyContent from './ProxyContent';

const ModalBackground = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-in-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContent = styled.div`
  background: #ffffff;
  padding: 10px;
  borderRadius: 15px;
  width: 95%;
  max-width: 1400px;
  height: 95vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.4s ease-out;
  overflow: hidden;

  @keyframes slideIn {
    from { transform: translateY(-50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @media (max-width: 1024px) {
    width: 98%;
    max-width: 1200px;
    height: 90vh;
    padding: 10px;
  }

  @media (max-width: 768px) {
    width: 98%;
    height: 98vh;
    padding: 5px;
  }
`;

const CloseButton = styled.button`
  align-self: flex-end;
  background: #ff4d4f;
  color: white;
  border: none;
  padding: 12px 25px;
  borderRadius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s ease, transform 0.2s ease;
  font-size: 16px;

  &:hover {
    background: #e63946;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const HeaderContainer = styled.div`
  text-align: center;
  margin-bottom: 10px;
  padding: 5px 0;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
`;

const InputContainer = styled.div`
  margin: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #f5f5f5;
  padding: 10px;
  borderRadius: 8px;
  flex-shrink: 0;
  max-height: 200px;
  overflow-y: auto;
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: nowrap;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const StyledInput = styled.input`
  padding: 10px;
  border: 2px solid #e0e0e0;
  borderRadius: 8px;
  width: 45%;
  font-size: 14px;
  background: #ffffff;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:focus {
    border-color: #1a73e8;
    box-shadow: 0 0 10px rgba(26, 115, 232, 0.3);
    outline: none;
  }

  &::placeholder {
    color: #777;
  }

  @media (max-width: 600px) {
    width: 100%;
  }
`;

const FileInput = styled.input`
  padding: 10px;
  border: 2px solid #e0e0e0;
  borderRadius: 8px;
  width: 15%;
  font-size: 14px;
  background: #ffffff;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:focus {
    border-color: #1a73e8;
    box-shadow: 0 0 10px rgba(26, 115, 232, 0.3);
    outline: none;
  }

  &::placeholder {
    color: #777;
  }

  @media (max-width: 600px) {
    width: 100%;
  }
`;

const PatentInput = styled.input`
  padding: 10px;
  border: 2px solid #e0e0e0;
  borderRadius: 8px;
  width: 190px;
  font-size: 14px;
  background: #ffffff;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:focus {
    border-color: #4caf50;
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
    outline: none;
  }

  &::placeholder {
    color: #777;
  }
`;

const UploadButton = styled.button`
  padding: 10px 20px;
  background-color: #1a73e8;
  color: white;
  border: none;
  borderRadius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s ease, transform 0.2s ease;
  font-size: 14px;

  &:hover {
    background-color: #1557b0;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const PatentButton = styled.button`
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  borderRadius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s ease, transform 0.2s ease;
  font-size: 14px;

  &:hover {
    background-color: #45a049;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const LoginButton = styled.button`
  padding: 10px 20px;
  background-color: #4285f4;
  color: white;
  border: none;
  borderRadius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s ease, transform 0.2s ease;
  font-size: 14px;
  margin: 0 10px;

  &:hover {
    background-color: #357abd;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  &.microsoft {
    background-color: #00a1f1;
  }

  &.microsoft:hover {
    background-color: #008ad8;
  }
`;

const ScreenSelectButton = styled.select`
  padding: 10px;
  border: 2px solid #e0e0e0;
  width:150px;
  borderRadius: 8px;
  font-size: 14px;
  background: #ffffff;
  cursor: pointer;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:focus {
    border-color: #1a73e8;
    box-shadow: 0 0 10px rgba(26, 115, 232, 0.3);
    outline: none;
  }
`;

const ContentWrapper = styled.div`
  width: 100%;
  height: 100%;
  border: 1px solid #e0e0e0;
  borderRadius: 8px;
  overflow: auto;
  background: #ffffff;
  padding: 5px;
`;

const Iframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
  borderRadius: 8px;
`;

const ErrorMessage = styled.div`
  color: #ff4d4f;
  margin: 10px 0;
  padding: 10px;
  background: #ffe6e6;
  borderRadius: 8px;
  text-align: center;
  animation: fadeInError 0.3s ease-in-out;

  @keyframes fadeInError {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const SplitScreenModal = ({ leftSrc, rightSrc, setLeftSrc, setRightSrc, onClose }) => {
  const [patentData, setPatentData] = useState({});
  const [leftPatentInput, setLeftPatentInput] = useState('');
  const [rightPatentInput, setRightPatentInput] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [leftFile, setLeftFile] = useState(null);
  const [rightFile, setRightFile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [screenMode, setScreenMode] = useState('both'); // New state for screen mode

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      console.log('Google login success:', tokenResponse);
      setIsAuthenticated(true);
      setShowSuccess(true);
    },
    onError: (error) => console.error('Google login error:', error),
    flow: 'implicit',
  });

  const microsoftLogin = async () => {
    try {
      const loginRequest = {
        scopes: ['user.read'],
      };
      const response = await msalInstance.loginPopup(loginRequest);
      console.log('Microsoft login success:', response);
      setIsAuthenticated(true);
      setShowSuccess(true);
    } catch (error) {
      console.error('Microsoft login error:', error);
    }
  };

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const handleUploadComplete = async (side, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5001/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (side === 'left') {
        setLeftSrc(url);
      } else {
        setRightSrc(url);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(`Failed to process file: ${err.message}`);
    }
  };

  const fetchPatentData = async (patentNumber, side) => {
    const fetcher = new BigQueryPatentFetcher();
    setLoading(true);
    try {
      console.log(`Fetching patent data for ${patentNumber} on ${side}...`);
      setError(null);
      const data = await fetcher.fetchPatentData(patentNumber, isAuthenticated);
      setPatentData((prev) => ({ ...prev, [side]: data }));
      if (side === 'left') {
        setLeftSrc(`patent:${patentNumber}`);
      } else {
        setRightSrc(`patent:${patentNumber}`);
      }
    } catch (error) {
      console.error('Error fetching patent data:', error);
      setError(`Error fetching patent data: ${error.message || 'Unknown error. Login may be required for this action.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePatentFetch = (side) => {
    const patentNumber = side === 'left' ? leftPatentInput : rightPatentInput;
    if (patentNumber) {
      fetchPatentData(patentNumber, side);
    }
  };

  const renderContent = (src, side) => {
    console.log(`Rendering content for ${side} with urin:`, src);
    if (!src) {
      return <div style={{ color: '#666', textAlign: 'center' }}>Enter a URL, upload a file, or enter a patent number to view content</div>;
    }
    if (src.startsWith('patent:')) {
      const patentNumber = src.split('patent:')[1];
      return patentData[side] ? <PatentViewer patentNumber={patentNumber} /> : <div style={{ color: '#666', textAlign: 'center' }}>Loading patent...</div>;
    }
    if (src.includes('patents.google.com/patent/')) {
      const patentNumber = src.match(/patent\/([^\/]+)\//)?.[1] || 'unknown';
      return (
        <ContentWrapper>
          <ProxyContent url={src} />
          <div style={{ padding: 10, textAlign: 'right' }}>
            <button
              onClick={() => window.open(src, '_blank')}
              style={{
                background: '#4285f4',
                color: '#ffffff',
                border: 'none',
                padding: '8px 15px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background 0.3s ease',
              }}
              onMouseOver={(e) => (e.target.style.background = '#3267d6')}
              onMouseOut={(e) => (e.target.style.background = '#4285f4')}
            >
              Open in New Tab
            </button>
            {patentData[side] ? (
              <PatentViewer patentNumber={patentNumber} />
            ) : (
              <div style={{ padding: 10 }} />
            )}
          </div>
        </ContentWrapper>
      );
    }
    try {
      return <ProxyContent url={src} />;
    } catch (err) {
      console.error(`Error rendering ${src}:`, err);
      return (
        <ContentWrapper>
          <div style={{ color: '#ff4d4f', textAlign: 'center', padding: 15 }}>
            Failed to render URL. Click to download or try another link.
            <br />
            <a href={src} download style={{ color: '#1a73e8', textDecoration: 'none' }}>
              Download File
            </a>
          </div>
        </ContentWrapper>
      );
    }
  };

  return (
    <ModalBackground onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>Close</CloseButton>
        <HeaderContainer>
          {!isAuthenticated && (
            <>
              <LoginButton onClick={() => googleLogin()}>Login with Google</LoginButton>
              <LoginButton className="microsoft" onClick={microsoftLogin}>Login with Microsoft</LoginButton>
            </>
          )}
          {showSuccess && <div style={{ color: '#4caf50', fontSize: '14px' }}>Logged in successfully!</div>}
          
        </HeaderContainer>
        <InputContainer>
          <InputWrapper>
            <StyledInput
              type="text"
              placeholder="Enter left URL"
              value={leftSrc}
              onChange={(e) => setLeftSrc(e.target.value)}
            />
            <FileInput
              type="file"
              onChange={(e) => setLeftFile(e.target.files[0])}
            />
            <UploadButton onClick={() => handleUploadComplete('left', leftFile)}>
              Upload File
            </UploadButton>
            <PatentInput
              type="text"
              placeholder="Enter patent number"
              value={leftPatentInput}
              onChange={(e) => setLeftPatentInput(e.target.value)}
            />
            <PatentButton onClick={() => handlePatentFetch('left')} disabled={loading}>
              {loading && leftPatentInput ? 'Fetching...' : 'Fetch Patent'}
            </PatentButton>
          </InputWrapper>
          <InputWrapper>
            <StyledInput
              type="text"
              placeholder="Enter right URL"
              value={rightSrc}
              onChange={(e) => setRightSrc(e.target.value)}
            />
            <FileInput
              type="file"
              onChange={(e) => setRightFile(e.target.files[0])}
            />
            <UploadButton onClick={() => handleUploadComplete('right', rightFile)}>
              Upload File
            </UploadButton>
            <PatentInput
              type="text"
              placeholder="Enter patent number"
              value={rightPatentInput}
              onChange={(e) => setRightPatentInput(e.target.value)}
            />
            <PatentButton onClick={() => handlePatentFetch('right')} disabled={loading}>
              {loading && rightPatentInput ? 'Fetching...' : 'Fetch Patent'}
            </PatentButton>
          </InputWrapper>
          <ScreenSelectButton
            value={screenMode}
            onChange={(e) => setScreenMode(e.target.value)}
          >
            <option value="both">Both Screen</option>
            <option value="left">Left Screen</option>
            <option value="right">Right Screen</option>
          </ScreenSelectButton>
        </InputContainer>
        {error && <ErrorMessage>{error}</ErrorMessage>}
       
        <SplitScreen leftWidth={1} rightWidth={1} screenMode={screenMode}>
          {leftSrc && renderContent(leftSrc, 'left')}
          {rightSrc && renderContent(rightSrc, 'right')}
        </SplitScreen>
        
      </ModalContent>
      
    </ModalBackground>
  );
};

export default SplitScreenModal;