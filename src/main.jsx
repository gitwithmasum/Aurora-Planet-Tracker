import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.jsx';
import AppErrorBoundary from './AppErrorBoundary.jsx';
import {LanguageProvider} from './i18n.jsx';
import './style.css';
import './sw-register.js';
createRoot(document.getElementById('root')).render(<React.StrictMode><AppErrorBoundary><LanguageProvider><App/></LanguageProvider></AppErrorBoundary></React.StrictMode>);
