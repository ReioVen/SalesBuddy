import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useTranslation } from '../hooks/useTranslation.ts';
import SubscriptionManagement from '../components/SubscriptionManagement.tsx';
import { AlertTriangle, Trash2, XCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://salesbuddy-production.up.railway.app';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [showDangerZone, setShowDangerZone] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteStep, setDeleteStep] = useState(1); // Multi-step confirmation
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.')) {
      return;
    }

    try {
      setIsCancellingSubscription(true);
      // This would typically redirect to Stripe portal for cancellation
      // For now, we'll just redirect to the billing portal
      const response = await axios.post(`${API_BASE_URL}/api/subscriptions/create-portal-session`, {}, {
        withCredentials: true
      });
      window.location.href = response.data.url;
    } catch (error: any) {
      console.error('Cancel subscription error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to cancel subscription';
      toast.error(errorMessage);
    } finally {
      setIsCancellingSubscription(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== user?.email) {
      setDeleteError('Please enter your exact email address to confirm');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete account');
      }

      // Account deleted successfully
      localStorage.removeItem('token');
      logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  const resetDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirmation('');
    setDeleteError('');
    setDeleteStep(1);
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-6 text-gray-600 dark:text-gray-300">
          {t('pleaseLogIn')}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{t('profile')}</h1>
      <div className="rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500 dark:text-gray-400">{t('name')}</div>
            <div className="font-medium text-gray-900 dark:text-white">{user.firstName} {user.lastName}</div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-400">{t('email')}</div>
            <div className="font-medium text-gray-900 dark:text-white">{user.email}</div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-400">{t('company')}</div>
            <div className="font-medium text-gray-900 dark:text-white">{user.company || '-'}</div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-400">{t('plan')}</div>
            <div className="font-medium capitalize text-gray-900 dark:text-white">{user.subscription?.plan}</div>
          </div>
        </div>
      </div>

      {/* Subscription Management Section */}
      <div className="mt-6">
        <SubscriptionManagement />
      </div>

      {/* Advanced Settings Section */}
      <div className="mt-6">
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('advancedSettings')}</h3>
          
          {/* Danger Zone - Hidden behind a toggle */}
          <div className="border-t border-gray-200 dark:border-dark-600 pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('dangerZone')}</span>
              <button
                onClick={() => setShowDangerZone(!showDangerZone)}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showDangerZone ? t('hide') : t('show')}
              </button>
            </div>
            
            {showDangerZone && (
              <div className="space-y-4">
                {/* Cancel Subscription */}
                {user?.subscription?.status === 'active' && user?.subscription?.stripeCustomerId && user?.subscription?.plan !== 'enterprise' && (
                  <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
                    <div className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-red-900 dark:text-red-200 mb-1">Cancel Subscription</h4>
                        <p className="text-xs text-red-800 dark:text-red-300 mb-3">
                          Cancel your subscription. You'll keep access until the end of your current billing period.
                        </p>
                        <button
                          onClick={handleCancelSubscription}
                          disabled={isCancellingSubscription}
                          className="text-xs px-3 py-1.5 bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-600 transition-colors duration-200 disabled:opacity-50"
                        >
                          {isCancellingSubscription ? 'Processing...' : 'Cancel Subscription'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delete Account */}
                <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-red-900 dark:text-red-200 mb-1">Delete Account</h4>
                      <p className="text-xs text-red-800 dark:text-red-300 mb-3">
                        Permanently delete your account and all data. This cannot be undone.
                      </p>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="text-xs px-3 py-1.5 bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-600 transition-colors duration-200"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {deleteStep === 1 ? 'Confirm Account Deletion' : 'Final Confirmation'}
              </h3>
            </div>
            
            <div className="mb-6">
              {deleteStep === 1 ? (
                <>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                    <p className="text-red-800 dark:text-red-200 text-sm font-medium mb-2">
                      ⚠️ This action will permanently delete:
                    </p>
                    <ul className="text-red-700 dark:text-red-300 text-sm space-y-1">
                      <li>• Your account and profile</li>
                      <li>• All conversations and summaries</li>
                      <li>• All subscription data</li>
                      <li>• All associated data</li>
                    </ul>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
                    This action cannot be undone. Are you absolutely sure you want to continue?
                  </p>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type "DELETE" to confirm:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                      placeholder="DELETE"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                    <p className="text-red-800 dark:text-red-200 text-sm font-medium">
                      🚨 FINAL WARNING 🚨
                    </p>
                    <p className="text-red-700 dark:text-red-300 text-sm mt-2">
                      You are about to permanently delete your account. This is your last chance to cancel.
                    </p>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
                    Type your email address to confirm: <strong className="text-gray-900 dark:text-white">{user.email}</strong>
                  </p>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Enter your email address:
                    </label>
                    <input
                      type="email"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                      placeholder={user.email}
                    />
                  </div>
                </>
              )}
              
              {deleteError && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-200 text-sm">{deleteError}</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={resetDeleteModal}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-600 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-500 transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              {deleteStep === 1 ? (
                <button
                  onClick={() => {
                    if (deleteConfirmation === 'DELETE') {
                      setDeleteStep(2);
                      setDeleteConfirmation('');
                      setDeleteError('');
                    } else {
                      setDeleteError('Please type "DELETE" exactly to continue');
                    }
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 disabled:opacity-50"
                >
                  Continue to Final Step
                </button>
              ) : (
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmation !== user.email}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete My Account
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;


