import React from 'react';
import './App.css';
import FileUpload from './components/FileUpload';

function App() {
  const handleReset = () => {
    const confirmed = window.confirm('Are you sure you want to reset? This will clear your current session.');
    if (confirmed) {
      // Clear any stored data or state
      localStorage.clear();
      // Reload the page to reset the application state
      window.location.reload();
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="text-3xl font-bold mb-8">Document Processor</h1>
        <FileUpload />
        <button
          onClick={handleReset}
          className="mt-8 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Reset Session
        </button>
      </header>
    </div>
  );
}

export default App;
