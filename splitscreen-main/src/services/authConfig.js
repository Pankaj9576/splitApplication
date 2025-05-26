// src/services/authConfig.js
export const msalConfig = {
  auth: {
    clientId: "268682723072-vpvr0q9dri3jdis5pl5be4b2fva5vdqp.apps.googleusercontent.com",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: "http://localhost:3001 ",
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["Files.ReadWrite", "Files.ReadWrite.All", "Sites.ReadWrite.All"],
};