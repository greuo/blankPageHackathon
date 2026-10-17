import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import DoctorMessagePage from './doctor/DoctorMessagePage';
import { MotionConfig } from 'motion/react';
import './fonts.css';
import './styles.css';
// Cloudflare serves index.html for every path (SPA fallback), so the public
// doctor-link page from the backend's emails is routed here by pathname.
const isDoctorMessage = location.pathname.replace(/\/+$/, '') === '/doctor-message';
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      {isDoctorMessage ? <DoctorMessagePage /> : <App />}
    </MotionConfig>
  </React.StrictMode>,
);
