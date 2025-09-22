// Test file to verify API configuration
import apiClient from '../config/axios';

export const testAPI = async () => {
  try {
    console.log('Testing API connection...');
    console.log('API Base URL:', apiClient.defaults.baseURL);
    
    const response = await apiClient.get('/api/health');
    console.log('API Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API Test Failed:', error);
    return null;
  }
};

// Test on page load
if (typeof window !== 'undefined') {
  testAPI();
}
