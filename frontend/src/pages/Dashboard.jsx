import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { imagesAPI } from '../api';

const Dashboard = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, etc.)');
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    setSelectedFile(file);
    setError('');
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setFilePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError('');
    
    try {
      const response = await imagesAPI.upload(selectedFile);
      setUploadResult(response.data);
      setSelectedFile(null);
      setFilePreview(null);
      
      // Clear file input
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const clearResults = () => {
    setUploadResult(null);
    setError('');
    setSelectedFile(null);
    setFilePreview(null);
    const fileInput = document.getElementById('file-upload');
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Image for Face Detection</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            {filePreview ? (
              <div className="mb-4">
                <img 
                  src={filePreview} 
                  alt="Preview" 
                  className="mx-auto max-h-48 object-contain rounded"
                />
                <p className="mt-2 text-sm text-gray-600">{selectedFile?.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile?.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="text-4xl mb-4">📷</div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Button as="span" variant="outline">
                    Choose Image
                  </Button>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>
              
              {selectedFile && (
                <div className="space-x-2">
                  <Button 
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Upload Image'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={clearResults}
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
            
            <p className="mt-4 text-sm text-gray-600">
              PNG, JPG, JPEG up to 10MB
            </p>
          </div>

          {uploading && (
            <div className="mt-4 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2">Processing image...</p>
            </div>
          )}

          {uploadResult && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-green-800">Detection Results</h3>
                  <p className="text-green-700">
                    Found {uploadResult.face_count} face(s) in the image
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={clearResults}>
                  Clear
                </Button>
              </div>
              
              {uploadResult.faces && uploadResult.faces.map((face, index) => (
                <div key={index} className="mt-3 p-3 bg-white rounded border">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Face {index + 1}</strong>
                    </div>
                    <div className="text-right">
                      Confidence: {(face.confidence * 100).toFixed(1)}%
                    </div>
                    <div>Gender: {face.gender || 'Unknown'}</div>
                    <div>Age: {face.age || 'Unknown'}</div>
                    <div>Quality: {(face.quality * 100).toFixed(1)}%</div>
                    <div>
                      BBox: {face.bbox?.join(', ') || 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;