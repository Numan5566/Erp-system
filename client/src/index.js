import React from 'react';
import ReactDOM from 'react-dom/client';
import "primereact/resources/themes/lara-light-blue/theme.css";     
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";                                         
import "primeflex/primeflex.css";
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Centralized Live API redirect monkey-patch
const originalFetch = window.fetch;
window.fetch = function (url, options) {
  if (typeof url === 'string' && url.includes('http://localhost:5000')) {
    const apiURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    url = url.replace('http://localhost:5000', apiURL);
  }
  return originalFetch(url, options);
};

import { PrimeReactProvider } from 'primereact/api';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <PrimeReactProvider>
      <App />
    </PrimeReactProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
