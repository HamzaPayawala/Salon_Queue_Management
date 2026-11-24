import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { initCloud } from './queue/queueStore.js'
import './index.css'

// Firestore is used only when .env is configured; otherwise local mode stays active.
initCloud()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
