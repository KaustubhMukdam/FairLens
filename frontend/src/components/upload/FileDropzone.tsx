import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, AlertCircle } from 'lucide-react';
import { uploadDataset } from '../../api/upload';
import type { UploadResponse } from '../../types/audit';

interface FileDropzoneProps {
  onUploadSuccess: (data: UploadResponse) => void;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({ onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const data = await uploadDataset(file);
      onUploadSuccess(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to upload CSV');
    } finally {
      setIsUploading(false);
    }
  }, [onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-200
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
        ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center space-y-4">
        {isUploading ? (
          <div className="animate-pulse">
            <UploadCloud className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700">Uploading dataset...</p>
          </div>
        ) : (
          <>
            <UploadCloud className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700">
              {isDragActive ? "Drop the CSV here..." : "Drag & drop a CSV file here, or click to select"}
            </p>
            <p className="text-sm text-gray-500">Max file size: 50MB</p>
          </>
        )}
      </div>
      {error && (
        <div className="mt-4 flex items-center justify-center text-red-500 space-x-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
