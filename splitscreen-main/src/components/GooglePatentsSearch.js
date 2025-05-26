import React, { useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { uploadFileToOneDrive } from '../services/oneDriveService'; // Ensure this path matches your project structure

const UploadWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const UploadButton = styled.button`
  padding: 10px 20px;
  background-color: ${props => props.oneDrive ? '#00a4ef' : '#1a73e8'};
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: ${props => props.oneDrive ? '#0088cc' : '#1557b0'};
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

const GoogleSheetsUploader = ({ accessToken, onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setError(null);
  };

  const uploadFile = async (toOneDrive = false) => {
    if (!file) {
      setError('No file selected');
      return;
    }
    if (!accessToken && !toOneDrive) {
      setError('Please sign in first');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      if (toOneDrive) {
        const viewUrl = await uploadFileToOneDrive(file);
        if (!viewUrl) {
          throw new Error('Failed to upload to OneDrive');
        }
        onUploadComplete(viewUrl);
      } else {
        // Google Drive upload
        const formData = new FormData();
        formData.append(
          'metadata',
          new Blob(
            [
              JSON.stringify({
                name: file.name,
                mimeType: file.type || 'application/octet-stream',
              }),
            ],
            { type: 'application/json' }
          )
        );
        formData.append('file', file);

        const uploadResponse = await axios.post(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
          formData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        const fileId = uploadResponse.data.id;

        await axios.post(
          `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
          { type: 'anyone', role: 'reader' },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        let viewUrl;
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (fileExtension === 'pdf') {
          viewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
        } else if (['xlsx', 'xls'].includes(fileExtension)) {
          viewUrl = `https://docs.google.com/spreadsheets/d/${fileId}/edit?usp=sharing`;
        } else {
          viewUrl = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
        }

        onUploadComplete(viewUrl);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(`Error uploading file: ${error.response?.data?.error?.message || error.message}`);
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
      <UploadButton onClick={() => uploadFile(false)} disabled={!file || uploading}>
        {uploading ? 'Uploading...' : 'Upload to Google Drive'}
      </UploadButton>
      {/* Uncomment below for OneDrive support */}
      {/* <UploadButton oneDrive onClick={() => uploadFile(true)} disabled={!file || uploading}>
        {uploading ? 'Uploading...' : 'Upload to OneDrive'}
      </UploadButton> */}
      {error && <ErrorText>{error}</ErrorText>}
    </UploadWrapper>
  );
};

export default GoogleSheetsUploader;