import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Final demo mode: the app runs entirely on the local reference
// dataset in src/data/data.js — no network, database or API needed.
ReactDOM.createRoot(/** @type {HTMLElement} */ (document.getElementById('root'))).render(
  <App />
)
