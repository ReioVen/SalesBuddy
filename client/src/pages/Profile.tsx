import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useTranslation } from '../hooks/useTranslation.ts';
import SubscriptionManagement from '../components/SubscriptionManagement.tsx';
import { AlertTriangle, Trash2 } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      setDeleteError('Please type "DELETE" to confirm');
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

      {/* Delete Account Section */}
      <div className="mt-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-2">{t('deleteAccount')}</h3>
              <p className="text-red-800 mb-4">{t('deleteAccountDescription')}</p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4" />
                {t('deleteAccount')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">{t('confirmDeleteAccount')}</h3>
            </div>
            
            <div className="mb-4">
              <p className="text-red-800 text-sm mb-4">{t('deleteAccountWarning')}</p>
              <p className="text-gray-700 text-sm mb-4">{t('deleteAccountConfirmation')}</p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('typeDeleteToConfirm')}
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="DELETE"
                />
              </div>
              
              {deleteError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                  <p className="text-red-800 text-sm">{deleteError}</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={resetDeleteModal}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmation !== 'DELETE'}
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
                    {t('deleteAccountButton')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;


