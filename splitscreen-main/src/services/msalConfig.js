import { PublicClientApplication } from '@azure/msal-browser';

const msalConfig = {
  auth: {
    clientId: 'YOUR_MICROSOFT_CLIENT_ID', // Replace with your Microsoft Entra ID Client ID
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: 'http://localhost:3000',
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

const msalInstance = new PublicClientApplication(msalConfig);

export  { msalInstance };