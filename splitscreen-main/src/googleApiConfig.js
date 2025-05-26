// src/googleApiConfig.js
import { gapi } from 'gapi-script';

const CLIENT_ID = '268682723072-vpvr0q9dri3jdis5pl5be4b2fva5vdqp.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets';

export const initGoogleApi = () => {
  return new Promise((resolve, reject) => {
    gapi.load('client:auth2', () => {
      gapi.client.init({
        clientId: CLIENT_ID,
        scope: SCOPES,
      }).then(() => {
        resolve();
      }).catch((error) => {
        reject(error);
      });
    });
  });
};

export const signIn = () => {
  return gapi.auth2.getAuthInstance().signIn();
};

export const isSignedIn = () => {
  return gapi.auth2.getAuthInstance().isSignedIn.get();
};

export const uploadFileToGoogleDrive = async (file) => {
  const accessToken = gapi.auth.getToken().access_token;
  const metadata = {
    name: file.name,
    mimeType: 'application/vnd.google-apps.spreadsheet',
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
    body: form,
  });

  const result = await response.json();
  return result.id;
};