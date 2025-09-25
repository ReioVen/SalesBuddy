import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';

interface FeedbackData {
  type: 'bug' | 'issue' | 'feature' | 'other';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  userAgent: string;
  url: string;
  timestamp: string;
}

const BetaFeedback: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackData>({
    type: 'bug',
    priority: 'medium',
    title: '',
    description: '',
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString()
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Debug authentication
    const token = localStorage.getItem('token');
    console.log('🔍 [FEEDBACK] Submitting feedback:', {
      hasToken: !!token,
      tokenLength: token?.length,
      user: user ? `${user.firstName} ${user.lastName}` : 'No user',
      userEmail: user?.email,
      userId: user?._id,
      feedback: feedback
    });
    
    // Check if user is authenticated
    if (!user || !token) {
      console.log('⚠️ [FEEDBACK] User not authenticated, using anonymous feedback');
      // Continue with anonymous feedback
    }

    try {
      // Use the correct API base URL
      const API_BASE_URL = 'https://salesbuddy-production.up.railway.app';
      
      // Test if server is running updated code
      console.log('🔍 [FEEDBACK] Testing server with:', `${API_BASE_URL}/api/test`);
      const testResponse = await fetch(`${API_BASE_URL}/api/test`);
      if (testResponse.ok) {
        const testResult = await testResponse.json();
        console.log('✅ [FEEDBACK] Server test successful:', testResult);
      } else {
        console.log('❌ [FEEDBACK] Server test failed:', testResponse.status);
      }
      
      // Submit feedback to main route (now handles both authenticated and anonymous)
      console.log('🔍 [FEEDBACK] Making request to:', `${API_BASE_URL}/api/feedback`);
      const response = await fetch(`${API_BASE_URL}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...feedback,
          userId: user?._id || null,
          userEmail: user?.email || 'anonymous@example.com',
          userName: user ? `${user.firstName} ${user.lastName}` : 'Anonymous'
        })
      });
      
      console.log('🔍 [FEEDBACK] Request body:', {
        ...feedback,
        userId: user?._id || null,
        userEmail: user?.email || 'anonymous@example.com',
        userName: user ? `${user.firstName} ${user.lastName}` : 'Anonymous'
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [FEEDBACK] Feedback submitted successfully:', result);
        alert('Thank you for your feedback! We\'ll review it soon.');
        setFeedback({
          type: 'bug',
          priority: 'medium',
          title: '',
          description: '',
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString()
        });
        setIsOpen(false);
      } else {
        const errorText = await response.text();
        console.error('❌ [FEEDBACK] Server error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        // If main route fails, show error
        if (response.status === 405) {
          console.log('❌ [FEEDBACK] Main route failed with 405 - route not found');
        }
        
        throw new Error(`Failed to submit feedback: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FeedbackData, value: string) => {
    setFeedback(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900';
      case 'low': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900';
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 group"
        title="Report Bug or Issue"
      >
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" 
          />
        </svg>
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          β
        </span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Beta Feedback
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Help us improve by reporting bugs or issues
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    What type of feedback is this?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'bug', label: 'Bug Report', icon: '🐛' },
                      { value: 'issue', label: 'Issue', icon: '⚠️' },
                      { value: 'feature', label: 'Feature Request', icon: '💡' },
                      { value: 'other', label: 'Other', icon: '📝' }
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          feedback.type === option.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="type"
                          value={option.value}
                          checked={feedback.type === option.value}
                          onChange={(e) => handleInputChange('type', e.target.value)}
                          className="sr-only"
                        />
                        <span className="text-2xl mr-3">{option.icon}</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Priority Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority Level
                  </label>
                  <div className="flex space-x-3">
                    {[
                      { value: 'low', label: 'Low', color: 'green' },
                      { value: 'medium', label: 'Medium', color: 'yellow' },
                      { value: 'high', label: 'High', color: 'red' }
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-center px-4 py-2 border rounded-lg cursor-pointer transition-colors ${
                          feedback.priority === option.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="priority"
                          value={option.value}
                          checked={feedback.priority === option.value}
                          onChange={(e) => handleInputChange('priority', e.target.value)}
                          className="sr-only"
                        />
                        <div className={`w-3 h-3 rounded-full mr-2 ${
                          option.color === 'red' ? 'bg-red-500' :
                          option.color === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}></div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={feedback.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Brief description of the issue"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={feedback.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Please provide detailed information about the issue, steps to reproduce, and any error messages you saw."
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* System Info */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    System Information (automatically included)
                  </h4>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <div><strong>URL:</strong> {feedback.url}</div>
                    <div><strong>Browser:</strong> {feedback.userAgent.split(' ').slice(-2).join(' ')}</div>
                    <div><strong>Timestamp:</strong> {new Date(feedback.timestamp).toLocaleString()}</div>
                    {user && (
                      <div><strong>User:</strong> {user.firstName} {user.lastName} ({user.email})</div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !feedback.title || !feedback.description}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BetaFeedback;
