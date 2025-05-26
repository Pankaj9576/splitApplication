import React, { useState } from 'react';
import SplitScreenModal from './components/SplitScreenModal';
import './App.css';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leftUrl, setLeftUrl] = useState('');
  const [rightUrl, setRightUrl] = useState('');

  
  const GOOGLE_SHEET_URL = 'https://www.wipo.int/export/sites/www/sme/en/documents/pdf/ip_panorama_3_learning_points.pdf';
  const PATENT_URL = 'https://patents.google.com/patent/US7654321B2';

  const openModal = (url = '') => {
    setLeftUrl(url);
    setRightUrl('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setLeftUrl('');
    setRightUrl('');
  };
  
  const buttonStyle = {
    padding: '10px 20px',
    margin: '0 10px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#007bff',
    color: 'white',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    fontSize: '16px',
  };

  const linkStyle = {
    textDecoration: 'none',
    color: '#007bff',
    fontSize: '16px',
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Split Screen Viewer</h1>
      </header>
      
      <main className="app-content">
        <div className="button-group">
          <button 
            href="#"
            style={buttonStyle}
            onClick={(e) => {
              e.preventDefault();
              openModal(GOOGLE_SHEET_URL);
            }}
            // className="action-link"
          >
            View Google Sheet
          </button>

          <button 
            style={buttonStyle}
            onClick={() => openModal()}
            className="action-button"
          >
            New Split Screen
          </button>

          <button 
            style={buttonStyle}
            onClick={() => openModal(PATENT_URL)}
            className="action-button"
          >
            View Patent
          </button>
        </div>

        {isModalOpen && (
          <SplitScreenModal
            leftSrc={leftUrl}
            rightSrc={rightUrl}
            setLeftSrc={setLeftUrl}
            setRightSrc={setRightUrl}
            onClose={closeModal}
          />
        )}
      </main>
    </div>
  );
}

export default App;