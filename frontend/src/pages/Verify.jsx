import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { facesAPI } from '../api';

const Verify = () => {
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [image1File, setImage1File] = useState(null);
  const [image2File, setImage2File] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleImageUpload = (event, setImage, setFile) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, etc.)');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setFile(file);
    setError('');
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCompare = async () => {
    if (!image1File || !image2File) {
      setError('Please upload both images first');
      return;
    }

    setComparing(true);
    setError('');
    
    try {
      const response = await facesAPI.compare(image1File, image2File);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Comparison failed. Please try again.');
      console.error('Comparison error:', err);
    } finally {
      setComparing(false);
    }
  };

  const clearImage = (setImage, setFile) => {
    setImage(null);
    setFile(null);
    setResult(null);
    setError('');
  };

  const clearAll = () => {
    setImage1(null);
    setImage2(null);
    setImage1File(null);
    setImage2File(null);
    setResult(null);
    setError('');
    
    // Clear file inputs
    document.getElementById('image1-upload').value = '';
    document.getElementById('image2-upload').value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Face Verification</h1>
        {(image1 || image2 || result) && (
          <Button variant="outline" onClick={clearAll}>
            Clear All
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* First Image */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">First Image</CardTitle>
            {image1 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => clearImage(setImage1, setImage1File)}
              >
                Remove
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center h-64 flex items-center justify-center">
              {image1 ? (
                <div className="w-full h-full flex flex-col">
                  <img 
                    src={image1} 
                    alt="First upload" 
                    className="flex-1 object-contain max-h-48"
                  />
                  <p className="text-xs text-gray-500 mt-2 truncate">
                    {image1File?.name}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="text-4xl mb-4">📷</div>
                  <label htmlFor="image1-upload" className="cursor-pointer">
                    <Button as="span" variant="outline" className="mt-4">
                      Choose Image 1
                    </Button>
                    <input
                      id="image1-upload"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, setImage1, setImage1File)}
                    />
                  </label>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Second Image */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Second Image</CardTitle>
            {image2 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => clearImage(setImage2, setImage2File)}
              >
                Remove
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center h-64 flex items-center justify-center">
              {image2 ? (
                <div className="w-full h-full flex flex-col">
                  <img 
                    src={image2} 
                    alt="Second upload" 
                    className="flex-1 object-contain max-h-48"
                  />
                  <p className="text-xs text-gray-500 mt-2 truncate">
                    {image2File?.name}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="text-4xl mb-4">📷</div>
                  <label htmlFor="image2-upload" className="cursor-pointer">
                    <Button as="span" variant="outline" className="mt-4">
                      Choose Image 2
                    </Button>
                    <input
                      id="image2-upload"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, setImage2, setImage2File)}
                    />
                  </label>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compare Button */}
      <div className="text-center">
        <Button 
          onClick={handleCompare}
          disabled={!image1File || !image2File || comparing}
          size="lg"
          className="px-8"
        >
          {comparing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Comparing...
            </>
          ) : (
            'Compare Faces'
          )}
        </Button>
      </div>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Comparison Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-6 rounded-lg ${
              result.match_status === 'MATCH' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-lg font-semibold ${
                    result.match_status === 'MATCH' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.match_status === 'MATCH' ? '✅ Faces Match' : '❌ Faces Do Not Match'}
                  </h3>
                  <p className={`mt-1 ${
                    result.match_status === 'MATCH' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    Similarity Score: <strong>{result.similarity_score}%</strong>
                  </p>
                  <p className={`text-sm ${
                    result.match_status === 'MATCH' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    Threshold: {result.threshold_used}%
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Confidence: {result.probe_confidence} (Probe), {result.candidate_confidence} (Candidate)
                  </p>
                </div>
                
                <div className="w-32">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className={`h-4 rounded-full transition-all duration-500 ${
                        result.match_status === 'MATCH' ? 'bg-green-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${Math.min(result.similarity_score, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 text-center">
                    {result.similarity_score}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Verify;