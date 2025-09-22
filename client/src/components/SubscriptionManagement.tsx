import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  CreditCard, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Clock,
  ArrowUpRight,
  Settings
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://salesbuddy-production.up.railway.app';

interface SubscriptionManagementProps {
  onClose?: () => void;
}

const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const subscription = user.subscription;
  const isActive = subscription?.status === 'active';
  const isCancelled = subscription?.cancelAtPeriodEnd;
  const isPastDue = subscription?.status === 'past_due';

  const getStatusIcon = () => {
    if (isPastDue) return <AlertCircle className="w-5 h-5 text-red-500" />;
    if (isCancelled) return <Clock className="w-5 h-5 text-orange-500" />;
    if (isActive) return <CheckCircle className="w-5 h-5 text-green-500" />;
    return <XCircle className="w-5 h-5 text-gray-500" />;
  };

  const getStatusColor = () => {
    if (isPastDue) return 'text-red-600';
    if (isCancelled) return 'text-orange-600';
    if (isActive) return 'text-green-600';
    return 'text-gray-600';
  };

  const getStatusText = () => {
    if (isPastDue) return t('pastDue');
    if (isCancelled) return t('cancelAtPeriodEnd');
    if (isActive) return t('active');
    return t('inactive');
  };

  const handleUpgrade = () => {
    window.location.href = '/pricing';
  };

  const handleManageSubscription = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/subscriptions/create-portal-session');
      window.location.href = response.data.url;
    } catch (error: any) {
      console.error('Portal session error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to open billing portal';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm(t('cancelSubscriptionConfirm'))) {
      return;
    }

    try {
      setLoading(true);
      // This would typically redirect to Stripe portal for cancellation
      // For now, we'll just redirect to the billing portal
      const response = await axios.post('/api/subscriptions/create-portal-session');
      window.location.href = response.data.url;
    } catch (error: any) {
      console.error('Cancel subscription error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to cancel subscription';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSetup = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/subscriptions/complete-setup');
      toast.success(response.data.message);
      
      // Refresh the page to show the updated subscription data
      window.location.reload();
    } catch (error: any) {
      console.error('Complete setup error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 503) {
        toast.error('Billing service is not available. Please contact support.');
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.message || 'Invalid request. Please try again.');
      } else {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to complete subscription setup';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePlan = async () => {
    try {
      setLoading(true);
      
      // Get available plan change options
      const response = await axios.get('/api/subscriptions/change-options');
      const { availablePlans } = response.data;
      
      if (availablePlans.length === 0) {
        toast.error('No other plans available for your current subscription');
        return;
      }
      
      // For now, redirect to pricing page with a note about plan changes
      // In the future, you could show a modal with plan options
      window.location.href = '/pricing?change=true';
    } catch (error: any) {
      console.error('Get change options error:', error);
      toast.error('Failed to get plan change options');
    } finally {
      setLoading(false);
    }
  };



  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          {t('subscriptionManagement')}
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Current Plan Info */}
      <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('currentPlan')}:</span>
            <span className="text-lg font-semibold capitalize text-gray-900 dark:text-white">
              {subscription?.plan || 'free'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
        </div>

        {subscription?.currentPeriodEnd && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Calendar className="w-4 h-4" />
            <span>{t('nextBillingDate')}: {formatDate(subscription.currentPeriodEnd)}</span>
          </div>
        )}
        
        {/* Usage Information */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-600">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">AI Conversations:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {user.usage?.aiConversations || 0} / {subscription?.plan === 'enterprise' ? (user.usage?.dailyLimit || '∞') : (user.usage?.monthlyLimit || '∞')}
            </span>
          </div>
          {subscription?.plan === 'enterprise' ? (
            user.usage?.dailyLimit && user.usage.dailyLimit > 0 && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 dark:bg-dark-600 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(100, ((user.usage?.aiConversations || 0) / user.usage.dailyLimit) * 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                  {Math.round(((user.usage?.aiConversations || 0) / user.usage.dailyLimit) * 100)}% used (daily)
                </div>
              </div>
            )
          ) : (
            user.usage?.monthlyLimit && user.usage.monthlyLimit > 0 && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 dark:bg-dark-600 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(100, ((user.usage?.aiConversations || 0) / user.usage.monthlyLimit) * 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                  {Math.round(((user.usage?.aiConversations || 0) / user.usage.monthlyLimit) * 100)}% used
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {subscription?.plan === 'free' && (
          <button
            onClick={handleUpgrade}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <ArrowUpRight className="w-4 h-4" />
            {t('upgradePlan')}
          </button>
        )}

        {isActive && subscription?.stripeCustomerId && subscription?.plan !== 'enterprise' && (
          <>
            <button
              onClick={handleManageSubscription}
              disabled={loading}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" />
              {loading ? t('loadingText') : 'Manage Payment Methods'}
            </button>

            <button
              onClick={handleChangePlan}
              disabled={loading}
              className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <ArrowUpRight className="w-4 h-4" />
              {loading ? t('loadingText') : 'Change Plan'}
            </button>
          </>
        )}

        {isActive && subscription?.plan === 'enterprise' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <p className="font-medium">{t('enterpriseSubscription')}</p>
                <p>{t('enterpriseSubscriptionDescription')}</p>
              </div>
            </div>
          </div>
        )}

        {isActive && !subscription?.stripeCustomerId && subscription?.plan !== 'enterprise' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Subscription Setup Incomplete</p>
                <p>Your subscription is active but billing management is not available. You need to complete setup and add a payment method first.</p>
              </div>
            </div>
            <button
              onClick={handleCompleteSetup}
              disabled={loading}
              className="mt-3 w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" />
              {loading ? t('loadingText') : 'Complete Setup & Add Payment Method'}
            </button>
            <p className="mt-2 text-xs text-yellow-700">
              This will create your billing account and allow you to add a payment method for future billing.
            </p>
          </div>
        )}

        {isPastDue && subscription?.stripeCustomerId && subscription?.plan !== 'enterprise' && (
          <button
            onClick={handleManageSubscription}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            {loading ? t('loadingText') : t('updatePaymentMethod')}
          </button>
        )}

        {isPastDue && !subscription?.stripeCustomerId && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <p className="font-medium">Payment Issue</p>
                <p>Your subscription has a payment issue but billing management is not available. Please contact support immediately.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Additional Info */}
      {isCancelled && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-orange-800">
              <p className="font-medium">{t('subscriptionCancelled')}</p>
              <p>{t('continueUntilDate')} {formatDate(subscription.currentPeriodEnd)}</p>
            </div>
          </div>
        </div>
      )}

      {isPastDue && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-800">
              <p className="font-medium">{t('paymentFailed')}</p>
              <p>{t('updatePaymentToContinue')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;
