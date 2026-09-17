// --- Security: Global Console Suppression ---
// This ensures no sensitive info or technical logs are ever visible in the browser console.
// MUST RUN BEFORE ANY OTHER IMPORTS
if (import.meta.env.PROD) {
  console.log   = () => {};
  console.debug = () => {};
  console.info  = () => {};
  console.warn  = () => {};
  console.error = () => {};
}
// ---------------------------------------------

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './i18n/i18n' // Import i18n initialization
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle'
import './index.css'
import { I18nextProvider } from 'react-i18next'
import i18n from './i18n/i18n'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </React.StrictMode>
)