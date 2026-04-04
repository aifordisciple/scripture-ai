import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initializeAdapters } from './adapters';
import { ErrorBoundary } from './components';
import './styles.css';

// Initialize adapters (database, storage) before rendering
initializeAdapters()
  .then(() => {
    console.log('Adapters initialized');
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
  })
  .catch((error) => {
    console.error('Failed to initialize adapters:', error);
    // Render anyway to show error state
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
  });