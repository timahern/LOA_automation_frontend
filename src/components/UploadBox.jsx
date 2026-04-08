import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

function UploadBox({ label, multiple = false, h, w, onFilesSelected }) {
  const [selectedFiles, setSelectedFiles] = useState([]);

  const onDrop = useCallback((acceptedFiles) => {
    if (multiple) {
      const newFiles = [...selectedFiles, ...acceptedFiles];
      setSelectedFiles(newFiles);
      onFilesSelected(label, newFiles);
    } else {
      const singleFile = acceptedFiles[0];
      setSelectedFiles([singleFile]);
      onFilesSelected(label, singleFile);
    }
  }, [label, multiple, onFilesSelected, selectedFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    accept: { 'application/pdf': ['.pdf'] },
  });

  const removeFile = (fileToRemove) => {
    const newFiles = selectedFiles.filter(file => file !== fileToRemove);
    setSelectedFiles(newFiles);
    onFilesSelected(label, multiple ? newFiles : null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        {...getRootProps()}
        className={`upload-box${isDragActive ? ' drag-active' : ''}`}
        style={{ width: w, height: h }}
      >
        <input {...getInputProps()} />
        <strong className="upload-label">{label}</strong>
        <p className="upload-hint">
          {isDragActive ? 'Drop files here...' : `Click or drag PDF${multiple ? 's' : ''}`}
        </p>
      </div>

      {selectedFiles.length > 0 && (
        <div style={{ marginTop: '8px', width: w, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {selectedFiles.map((file, index) => (
            <div key={index} className="file-bubble">
              <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '130px' }}>
                {file.name}
              </span>
              <button
                className="file-bubble-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UploadBox;
