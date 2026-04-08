import React, { useState } from 'react';
import UploadBox from '../components/UploadBox';
import '../App.css';

function B1FinderPage() {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const apiKey = import.meta.env.VITE_API_BACKEND_KEY;
  const [files, setFiles] = useState({ b1: [] });
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = (label, selected) => {
    const labelToKey = { 'Buyouts': 'b1' };
    const key = labelToKey[label];
    if (!key) { console.warn(`Unknown label: ${label}`); return; }
    setFiles(prev => ({ ...prev, [key]: selected }));
  };

  const handleSubmit = async () => {
    if (!files.b1.length) { alert('Please upload at least one buyout PDF.'); return; }
    const nonPdfFiles = files.b1.filter(file => file.type !== 'application/pdf');
    if (nonPdfFiles.length > 0) { alert('All uploaded files must be PDFs.'); return; }

    const formData = new FormData();
    files.b1.forEach(file => formData.append('buyout_files', file));

    try {
      setIsLoading(true);
      const response = await fetch(apiUrl + '/extract-b1s', {
        method: 'POST',
        headers: { 'x-api-key': apiKey },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate LOAs');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'B1s.zip';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Something went wrong while extracting B.1s: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>B.1 Finder</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
        Upload buyout PDFs and download the matching B.1 pages as a ZIP.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
        <UploadBox label="Buyouts" multiple={true} h={300} w={900} onFilesSelected={handleFileSelect} />
      </div>

      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <button className="btn-success" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Extract B.1s and Download ZIP'}
        </button>
      </div>

      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner" style={{ borderTopColor: 'var(--color-success)' }} />
          <p className="loading-message">Extracting B.1 pages... Please wait.</p>
        </div>
      )}
    </div>
  );
}

export default B1FinderPage;
