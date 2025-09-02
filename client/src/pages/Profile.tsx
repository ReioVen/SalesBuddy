import React from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useTranslation } from '../hooks/useTranslation.ts';
import SubscriptionManagement from '../components/SubscriptionManagement.tsx';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-600">
          {t('pleaseLogIn')}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-4">{t('profile')}</h1>
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500">{t('name')}</div>
            <div className="font-medium">{user.firstName} {user.lastName}</div>
          </div>
          <div>
            <div className="text-gray-500">{t('email')}</div>
            <div className="font-medium">{user.email}</div>
          </div>
          <div>
            <div className="text-gray-500">{t('company')}</div>
            <div className="font-medium">{user.company || '-'}</div>
          </div>
          <div>
            <div className="text-gray-500">{t('plan')}</div>
            <div className="font-medium capitalize">{user.subscription?.plan}</div>
          </div>
        </div>
      </div>

      {/* Subscription Management Section */}
      <div className="mt-6">
        <SubscriptionManagement />
      </div>
    </div>
  );
};

export default Profile;


