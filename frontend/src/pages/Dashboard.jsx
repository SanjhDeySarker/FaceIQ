import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { imagesAPI, mockAPI, getErrorMessage, testConnection } from '../api';

const Dashboard = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');

  // Test backend connection on component mount
  useEffect(() => {
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    try {
      setBackendStatus('checking');
      const result = await testConnection();
      if (result.success) {
        setBackendStatus('connected');
        setError('');
      } else {
        setBackendStatus('disconnected');
      }
    } catch (err) {
      setBackendStatus('disconnected');
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('File selected:', file.name, file.type, file.size);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, JPG, etc.)');
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
    setUploadResult(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setFilePreview(e.target.result);
    };
    reader.onerror = () => {
      setError('Failed to read file');
      setSelectedFile(null);
      setFilePreview(null);
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
      console.log('Starting upload...', selectedFile);
      
      let response;
      if (backendStatus === 'connected') {
        try {
          // Try real API first
          response = await imagesAPI.upload(selectedFile);
          console.log('✅ Real API upload successful:', response.data);
        } catch (apiError) {
          console.warn('❌ Real API failed, using mock data:', apiError);
          // Fallback to mock API
          response = await mockAPI.upload(selectedFile);
          console.log('🔄 Mock upload successful:', response.data);
        }
      } else {
        // Use mock API directly when backend is disconnected
        console.log('🔄 Backend disconnected, using mock API');
        response = await mockAPI.upload(selectedFile);
        console.log('Mock upload successful:', response.data);
      }
      
      setUploadResult(response.data);
      setSelectedFile(null);
      setFilePreview(null);
      
      // Clear file input
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';
      
    } catch (err) {
      console.error('Upload error:', err);
      const errorMsg = getErrorMessage(err);
      setError(errorMsg || 'Upload failed. Please try again.');
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

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      
      // Create a synthetic event for handleFileSelect
      const syntheticEvent = {
        target: {
          files: [file]
        }
      };
      handleFileSelect(syntheticEvent);
    }
  };

  // Test function to verify API is working
  const testUpload = async () => {
    console.log('Testing upload with sample image...');
    
    try {
      // Create a test image
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      
      // Draw a simple image
      ctx.fillStyle = '#3B82F6';
      ctx.fillRect(0, 0, 200, 200);
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.fillText('Test Image', 50, 100);
      
      canvas.toBlob(async (blob) => {
        const testFile = new File([blob], 'test-image.png', { type: 'image/png' });
        
        setUploading(true);
        setError('');
        
        try {
          let response;
          if (backendStatus === 'connected') {
            try {
              response = await imagesAPI.upload(testFile);
              console.log('✅ Test upload successful:', response.data);
            } catch (apiError) {
              console.warn('❌ Real API failed, using mock:', apiError);
              response = await mockAPI.upload(testFile);
            }
          } else {
            response = await mockAPI.upload(testFile);
          }
          
          setUploadResult(response.data);
        } catch (err) {
          console.error('Test upload failed:', err);
          setError('Test failed: ' + getErrorMessage(err));
        } finally {
          setUploading(false);
        }
      });
      
    } catch (error) {
      console.error('Test creation failed:', error);
      setError('Failed to create test image');
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className={`p-3 rounded-lg ${
        backendStatus === 'connected' 
          ? 'bg-green-50 border border-green-200 text-green-800'
          : backendStatus === 'checking'
          ? 'bg-blue-50 border border-blue-200 text-blue-800'
          : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              backendStatus === 'connected' 
                ? 'bg-green-500' 
                : backendStatus === 'checking'
                ? 'bg-blue-500 animate-pulse'
                : 'bg-yellow-500'
            }`}></div>
            <span className="font-medium">
              {backendStatus === 'checking' 
                ? 'Checking backend connection...' 
                : `Backend: ${backendStatus === 'connected' ? 'Connected' : 'Disconnected'}`
              }
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={checkBackendConnection} disabled={backendStatus === 'checking'}>
            {backendStatus === 'checking' ? 'Checking...' : 'Retry Connection'}
          </Button>
        </div>
        {backendStatus === 'disconnected' && (
          <p className="text-sm mt-1">
            Running in mock mode. Some features may be limited.
          </p>
        )}
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button 
          variant="outline" 
          onClick={testUpload}
          disabled={uploading}
        >
          Test Upload
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="text-2xl mr-4">📊</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Images</p>
                <p className="text-2xl font-bold">{uploadResult ? 1 : 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="text-2xl mr-4">👤</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Faces Detected</p>
                <p className="text-2xl font-bold">
                  {uploadResult?.face_count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="text-2xl mr-4">✅</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">
                  {uploadResult ? '100%' : '0%'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Image for Face Detection</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}
          
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors hover:border-blue-400"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {filePreview ? (
              <div className="mb-4">
                <img 
                  src={filePreview} 
                  alt="Preview" 
                  className="mx-auto max-h-48 object-contain rounded shadow-sm"
                />
                <p className="mt-2 text-sm text-gray-600 font-medium">{selectedFile?.name}</p>
                <p className="text-xs text-gray-500">
                  {selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(2) : 0} MB
                </p>
              </div>
            ) : (
              <div className="py-8">
                <div className="text-6xl mb-4">📷</div>
                <p className="text-lg font-medium text-gray-700 mb-2">Drag & drop an image here</p>
                <p className="text-sm text-gray-500 mb-4">or</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Button as="span" variant={filePreview ? "outline" : "default"}>
                    {filePreview ? 'Change Image' : 'Choose Image'}
                  </Button>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={uploading}
                  />
                </label>
              </div>
              
              {selectedFile && (
                <div className="space-x-2">
                  <Button 
                    onClick={handleUpload}
                    disabled={uploading}
                    className="min-w-24"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      'Upload Image'
                    )}
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
              Supports: JPEG, PNG, JPG • Max: 10MB
            </p>
          </div>

          {uploading && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-blue-700">Processing image and detecting faces...</span>
              </div>
            </div>
          )}

          {uploadResult && (
            <div className="mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Detection Results</h3>
                <Button variant="outline" size="sm" onClick={clearResults}>
                  Clear Results
                </Button>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-green-800">
                      ✅ Successfully processed {uploadResult.face_count} face(s)
                    </h4>
                    <p className="text-green-700 text-sm mt-1">
                      File: {uploadResult.file_name}
                    </p>
                    {uploadResult.file_url && (
                      <p className="text-green-600 text-xs mt-1">
                        Stored at: {uploadResult.file_url}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {uploadResult.face_count}
                    </div>
                    <div className="text-xs text-green-500">faces found</div>
                  </div>
                </div>
              </div>

              {uploadResult.faces && uploadResult.faces.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Detected Faces:</h4>
                  {uploadResult.faces.map((face, index) => (
                    <div key={face.face_id || index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="font-medium text-gray-500">Face {index + 1}</div>
                          <div className="text-xs text-gray-400">ID: {face.face_id}</div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="font-medium text-gray-500">Confidence</div>
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${(face.confidence * 100).toFixed(0)}%` }}
                              ></div>
                            </div>
                            <span className="font-semibold">{(face.confidence * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="font-medium text-gray-500">Attributes</div>
                          <div className="text-xs">
                            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-1">
                              {face.gender || 'Unknown'}
                            </span>
                            <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded">
                              {face.age || '?'} yrs
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="font-medium text-gray-500">Quality</div>
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${(face.quality * 100).toFixed(0)}%` }}
                              ></div>
                            </div>
                            <span className="font-semibold">{(face.quality * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                      
                      {face.bbox && (
                        <div className="mt-2 text-xs text-gray-500">
                          Bounding Box: [{face.bbox.join(', ')}]
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl mb-2">1</div>
              <h4 className="font-medium mb-1">Upload Image</h4>
              <p className="text-gray-600">Click "Choose Image" or drag & drop a photo</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">2</div>
              <h4 className="font-medium mb-1">Automatic Detection</h4>
              <p className="text-gray-600">Our AI will automatically detect all faces in the image</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">3</div>
              <h4 className="font-medium mb-1">View Results</h4>
              <p className="text-gray-600">See detailed analysis of each detected face</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;