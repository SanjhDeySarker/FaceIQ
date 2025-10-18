import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Upload, Users, CheckCircle, XCircle } from 'lucide-react';

const Dashboard = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    
    // Simulate API call for now
    setTimeout(() => {
      setUploadResult({
        image_id: 'img_123',
        face_count: 2,
        faces: [
          { bbox: [100, 100, 200, 200], confidence: 0.98, age: 25, gender: 'male' },
          { bbox: [400, 150, 180, 180], confidence: 0.96, age: 30, gender: 'female' }
        ]
      });
      setUploading(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Images</p>
                <p className="text-2xl font-bold">24</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Successful Verifications</p>
                <p className="text-2xl font-bold">156</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Failed Verifications</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Image for Face Detection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <Button as="span">Choose Image</Button>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              PNG, JPG, JPEG up to 10MB
            </p>
          </div>

          {uploading && (
            <div className="mt-4 text-center">
              <p>Processing image...</p>
            </div>
          )}

          {uploadResult && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800">Detection Results</h3>
              <p className="text-green-700">
                Found {uploadResult.face_count} face(s) in the image
              </p>
              {uploadResult.faces.map((face, index) => (
                <div key={index} className="mt-2 text-sm">
                  Face {index + 1}: {face.gender || 'Unknown'}, {face.age || 'Unknown age'} 
                  (Confidence: {(face.confidence * 100).toFixed(1)}%)
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