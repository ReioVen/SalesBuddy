import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { 
  Check, 
  X, 
  Star
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface PricingPlan {
  name: string;
  price: number | null;
  period: string;
  features: string[];
  popular?: boolean;
  buttonText: string;
  buttonAction: 'subscribe' | 'contact';
  limits: {
    conversations: number;
  };
}

const Pricing: React.FC = () => {
  const { user } = useAuth();
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    jobTitle: '',
    phone: '',
    companySize: '',
    industry: '',
    useCase: '',
    expectedUsers: '',
    budget: '',
    timeline: '',
    additionalInfo: ''
  });

  const plans: PricingPlan[] = [
    {
      name: 'Free',
      price: 0,
      period: 'month',
      features: [
        '10 AI conversations per month',
        'Basic sales scenarios',
        'Email support'
      ],
      buttonText: 'Get Started Free',
      buttonAction: 'subscribe',
      limits: { conversations: 10 }
    },
    {
      name: 'Basic',
      price: 49.99,
      period: 'month',
      features: [
        '200 AI conversations per month',
        'Tips and Lessons',
        'Basic sales scenarios',
        'Email support'
      ],
      buttonText: 'Get Plan',
      buttonAction: 'subscribe',
      limits: { conversations: 200 }
    },
    {
      name: 'Pro',
      price: 89.99,
      period: 'month',
      features: [
        '500 AI conversations per month',
        'Tips and Lessons',
        'More Client Customization',
        'Personal Summary Feedback',
        'Priority support'
      ],
      popular: true,
      buttonText: 'Get Plan',
      buttonAction: 'subscribe',
      limits: { conversations: 500 }
    },
    {
      name: 'Unlimited',
      price: 349,
      period: 'month',
      features: [
        'Unlimited AI conversations',
        'Tips and Lessons',
        'Summary',
        'More Client Customization',
        'Personal Summary Feedback',
        'Dedicated support'
      ],
      buttonText: 'Get Plan',
      buttonAction: 'subscribe',
      limits: { conversations: -1 }
    },
    {
      name: 'Enterprise',
      price: null,
      period: 'month',
      features: [
        'Unlimited AI conversations',
        'Tips and Lessons',
        'Summary',
        'More Client Customization',
        'Personal Summary Feedback',
        'Team management',
        'Dedicated support'
      ],
      buttonText: 'Contact Sales',
      buttonAction: 'contact',
      limits: { conversations: -1 }
    }
  ];

  const renderPlanCard = (plan: PricingPlan, options?: { noScroll?: boolean }) => (
    <div
      key={plan.name}
      className={`relative overflow-visible bg-white rounded-xl shadow-lg border-2 p-6 flex flex-col h-full ${
        plan.popular ? 'border-blue-500 scale-105' : 'border-gray-200'
      }`}
    >
      {plan.popular && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
          <span className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded-full text-xs md:text-sm font-semibold shadow whitespace-nowrap ring-1 ring-white/50">
            <Star className="w-4 h-4" />
            Most Popular
          </span>
        </div>
      )}

      <div className="text-center mb-4">
        <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
        <div className="mb-3">
          {plan.price === null ? (
            <span className="text-2xl font-bold text-gray-900">Custom</span>
          ) : (
            <>
              <span className="text-3xl font-bold">${plan.price}</span>
              <span className="text-gray-600">/{plan.period}</span>
            </>
          )}
        </div>
        {plan.limits.conversations === -1 ? (
          <p className="text-gray-600">Unlimited conversations</p>
        ) : (
          <p className="text-gray-600">{plan.limits.conversations} conversations/month</p>
        )}
      </div>

      <ul className={`space-y-3 mb-6 ${options?.noScroll ? '' : 'max-h-40 overflow-auto pr-2'}`}>
        {(options?.noScroll ? plan.features.slice(0, 6) : plan.features).map((feature, featureIndex) => (
          <li key={featureIndex} className="flex items-start text-sm">
            <Check className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
            <span className="text-gray-700 leading-snug">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => {
          if (!user) {
            window.location.href = '/register';
            return;
          }
          if (plan.buttonAction === 'contact') {
            setShowEnterpriseModal(true);
          } else {
            handleSubscribe(plan.name);
          }
        }}
        disabled={loading}
        className={`w-full py-2.5 px-6 rounded-lg font-medium transition-colors duration-200 mt-auto ${
          plan.popular
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
        }`}
      >
        {loading ? 'Loading...' : plan.buttonText}
      </button>
    </div>
  );

  const handleSubscribe = async (planName: string) => {
    if (!user) {
      toast.error('Please log in to subscribe');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/subscriptions/create-checkout-session', {
        plan: planName.toLowerCase()
      });
      
      // Redirect to Stripe checkout
      window.location.href = response.data.url;
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error.response?.data?.error || 'Failed to create checkout session');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterpriseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('/api/enterprise/request', formData);
      toast.success('Enterprise request submitted successfully! We\'ll contact you soon.');
      setShowEnterpriseModal(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        company: '',
        jobTitle: '',
        phone: '',
        companySize: '',
        industry: '',
        useCase: '',
        expectedUsers: '',
        budget: '',
        timeline: '',
        additionalInfo: ''
      });
    } catch (error: any) {
      console.error('Enterprise request error:', error);
      toast.error(error.response?.data?.error || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start with our free tier and upgrade as you grow. All plans include our core AI training features.
          </p>
        </div>

        {/* Row 1: Free, Basic, Pro */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto items-stretch">
          {['Free', 'Basic', 'Pro'].map(name => {
            const plan = plans.find(p => p.name === name)!;
            return renderPlanCard(plan);
          })}
        </div>

        {/* Row 2: Enterprise and Unlimited aligned, no scroll within cards */}
        <div className="max-w-6xl mx-auto mt-10">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold">Enterprise & Unlimited</h2>
            <p className="text-gray-600 mt-1">Looking to roll out SalesBuddy across your company? Explore Enterprise for team features, SSO, and priority support. Prefer no limits? Choose Unlimited.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {(() => {
              const enterprise = plans.find(p => p.name === 'Enterprise')!;
              return renderPlanCard(enterprise, { noScroll: true });
            })()}
            {(() => {
              const unlimited = plans.find(p => p.name === 'Unlimited')!;
              return renderPlanCard(unlimited, { noScroll: true });
            })()}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-2">Can I change my plan anytime?</h3>
              <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">What happens if I exceed my limit?</h3>
              <p className="text-gray-600">You'll be notified when you're close to your limit. Upgrade your plan to continue training.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-gray-600">Yes! Start with our free tier that includes 10 conversations per month.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Do you offer refunds?</h3>
              <p className="text-gray-600">We offer a 30-day money-back guarantee for all paid plans.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Contact Modal */}
      {showEnterpriseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Enterprise Inquiry</h2>
                <button
                  onClick={() => setShowEnterpriseModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleEnterpriseSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company *
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      name="jobTitle"
                      value={formData.jobTitle}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Size *
                    </label>
                    <select
                      name="companySize"
                      value={formData.companySize}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                    >
                      <option value="">Select size</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="500+">500+ employees</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Industry *
                    </label>
                    <input
                      type="text"
                      name="industry"
                      value={formData.industry}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                      placeholder="e.g., Technology, Healthcare"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Use Case *
                  </label>
                  <input
                    type="text"
                    name="useCase"
                    value={formData.useCase}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                    placeholder="e.g., Sales team training, Customer service"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expected Users *
                    </label>
                    <input
                      type="number"
                      name="expectedUsers"
                      value={formData.expectedUsers}
                      onChange={handleInputChange}
                      required
                      min="1"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Budget Range *
                    </label>
                    <select
                      name="budget"
                      value={formData.budget}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                    >
                      <option value="">Select budget</option>
                      <option value="$500-$1000">$500-$1000</option>
                      <option value="$1000-$2500">$1000-$2500</option>
                      <option value="$2500-$5000">$2500-$5000</option>
                      <option value="$5000+">$5000+</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timeline *
                  </label>
                  <select
                    name="timeline"
                    value={formData.timeline}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                  >
                    <option value="">Select timeline</option>
                    <option value="Immediate">Immediate</option>
                    <option value="1-2 weeks">1-2 weeks</option>
                    <option value="1 month">1 month</option>
                    <option value="2-3 months">2-3 months</option>
                    <option value="3+ months">3+ months</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Information
                  </label>
                  <textarea
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleInputChange}
                    rows={4}
                    className="input-field"
                    placeholder="Tell us more about your needs..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEnterpriseModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1"
                  >
                    {loading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pricing; 