import React from 'react';
import ReactDOM from 'react-dom/client';
import "primereact/resources/themes/lara-light-blue/theme.css";     
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";                                         
import "primeflex/primeflex.css";
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { PrimeReactProvider } from 'primereact/api';

// Centralized Live API redirect and 401 response monkey-patch
const originalFetch = window.fetch;
window.fetch = async function (url, options) {
  if (typeof url === 'string' && url.includes('https://erp-backend-3rf8.onrender.com')) {
    const apiURL = process.env.REACT_APP_API_URL || 'https://erp-backend-3rf8.onrender.com';
    url = url.replace('https://erp-backend-3rf8.onrender.com', apiURL);
  }
  try {
    const response = await originalFetch(url, options);
    if (response.status === 401) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return response;
  } catch (err) {
    throw err;
  }
};

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
