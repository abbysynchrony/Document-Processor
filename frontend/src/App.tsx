import React from 'react';
import './App.css';
import FileUpload from './components/FileUpload';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1 className="text-3xl font-bold mb-8">Document Processor</h1>
        <FileUpload />
      </header>
    </div>
  );
}

export default App;
