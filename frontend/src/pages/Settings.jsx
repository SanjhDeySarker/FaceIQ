import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import Button from '../components/ui/button';
import { usersAPI } from '../api';

const Settings = () => {
  const [threshold, setThreshold] = useState(75);
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await usersAPI.getProfile();
      const user = response.data;
      setThreshold(user.threshold);
      setApiKey(user.api_key);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleSaveThreshold = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      await usersAPI.updateThreshold(threshold);
      setMessage('Threshold updated successfully!');
    } catch (error) {
      setMessage('Failed to update threshold');
    } finally {
      setSaving(false);
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setMessage('API key copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('success') || message.includes('copied') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Similarity Threshold</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Set minimum similarity score for face matches (70-90%)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="70"
                  max="90"
                  value={threshold}
                  onChange={(e) => setThreshold(parseInt(e.target.value))}
                  className="w-full"
                />
                <span className="text-lg font-semibold w-12">{threshold}%</span>
              </div>
            </div>
            <Button 
              onClick={handleSaveThreshold}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Threshold'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Key</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your unique API key for integration
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={apiKey}
                  readOnly
                  className="flex-1 rounded-l-md border border-gray-300 px-3 py-2 bg-gray-50"
                />
                <Button 
                  onClick={copyApiKey}
                  className="rounded-l-none"
                >
                  Copy
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Use this key to authenticate your API requests. Keep it secure!
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">24</div>
              <div className="text-sm text-blue-800">Images Processed</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">156</div>
              <div className="text-sm text-green-800">Successful Verifications</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">89%</div>
              <div className="text-sm text-purple-800">Success Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;