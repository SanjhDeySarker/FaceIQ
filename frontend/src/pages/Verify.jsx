import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Upload, GitCompare } from 'lucide-react'; // Changed from Compare to GitCompare

const Verify = () => {
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState(null);

  const handleImage1Upload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage1(URL.createObjectURL(file));
    }
  };

  const handleImage2Upload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage2(URL.createObjectURL(file));
    }
  };

  const handleCompare = async () => {
    if (!image1 || !image2) return;

    setComparing(true);
    
    // Simulate API call
    setTimeout(() => {
      setResult({
        similarity_score: 85.2,
        threshold_used: 75.0,
        match_status: 'MATCH',
        probe_confidence: 0.99,
        candidate_confidence: 0.97
      });
      setComparing(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Face Verification</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>First Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center h-64">
              {image1 ? (
                <img 
                  src={image1} 
                  alt="First upload" 
                  className="h-full w-full object-contain"
                />
              ) : (
                <>
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <label htmlFor="image1-upload" className="cursor-pointer">
                    <Button as="span" className="mt-4">Upload Image</Button>
                    <input
                      id="image1-upload"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleImage1Upload}
                    />
                  </label>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Second Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center h-64">
              {image2 ? (
                <img 
                  src={image2} 
                  alt="Second upload" 
                  className="h-full w-full object-contain"
                />
              ) : (
                <>
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <label htmlFor="image2-upload" className="cursor-pointer">
                    <Button as="span" className="mt-4">Upload Image</Button>
                    <input
                      id="image2-upload"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleImage2Upload}
                    />
                  </label>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button 
          onClick={handleCompare}
          disabled={!image1 || !image2 || comparing}
          size="lg"
          className="px-8"
        >
          <GitCompare className="w-4 h-4 mr-2" /> {/* Changed to GitCompare */}
          {comparing ? 'Comparing...' : 'Compare Faces'}
        </Button>
      </div>

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
                </div>
                
                <div className="w-32">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        result.match_status === 'MATCH' ? 'bg-green-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${result.similarity_score}%` }}
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