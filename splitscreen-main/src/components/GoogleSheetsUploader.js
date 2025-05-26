import React, { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const UploadWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const UploadButton = styled.button`
  padding: 10px 20px;
  background-color: #1a73e8;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s ease, transform 0.2s ease;

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

const ErrorText = styled.p`
  color: #ff4d4f;
  margin: 5px 0;
`;

const GoogleSheetsUploader = ({ onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setError(null);
  };

  const uploadFile = async () => {
    if (!file) {
      setError('No file selected');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Upload file to your proxy server
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { fileUrl } = response.data; // Expect a URL or data URI from server
      onUploadComplete(fileUrl);
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(`Error uploading file: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <UploadWrapper>
      <input
        type="file"
        onChange={handleFileChange}
        accept=".pdf,.xlsx,.xls" // Restrict to PDF and Excel files
      />
      <UploadButton onClick={uploadFile} disabled={!file || uploading}>
        {uploading ? 'Uploading...' : 'Upload File'}
      </UploadButton>
      {error && <ErrorText>{error}</ErrorText>}
    </UploadWrapper>
  );
};

export default GoogleSheetsUploader;