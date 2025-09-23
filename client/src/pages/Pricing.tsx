import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useTranslation } from '../hooks/useTranslation.ts';
import { 
  Check, 
  X, 
  Star
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://salesbuddy-production.up.railway.app';

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
    aiTips?: number;
  };
}

const Pricing: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const [searchParams] = useSearchParams();
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

  // Handle automatic subscription after registration
  useEffect(() => {
    const intendedPlan = searchParams.get('plan');
    if (intendedPlan && user && !loading) {
      // Small delay to ensure user is fully loaded
      const timer = setTimeout(() => {
        handleSubscribe(intendedPlan);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, searchParams, loading]);

  // Updated free plan to 3 conversations per month
  const plans: PricingPlan[] = [
    {
      name: language === 'et' ? 'Tasuta' : 'Free',
      price: 0,
      period: language === 'et' ? 'kuu' : 'month',
      features: [
        language === 'et' ? '3 AI Vestlust kuus' : '3 AI conversations per month',
        language === 'et' ? 'Põhimüügi stsenaariumid' : 'Basic sales scenarios',
        language === 'et' ? 'E-posti tugi' : 'Email support',
        language === 'et' ? 'Kokkuvõtted lukustatud (uuenda avamiseks)' : 'Summaries locked (upgrade to unlock)'
      ],
      buttonText: language === 'et' ? 'Alusta tasuta' : 'Get Started Free',
      buttonAction: 'subscribe',
      limits: { conversations: 3, aiTips: 0 }
    },
    {
      name: language === 'et' ? 'Põhi' : 'Basic',
      price: 49.99,
      period: language === 'et' ? 'kuu' : 'month',
      features: [
        language === 'et' ? '30 AI Vestlust kuus' : '30 AI conversations per month',
        language === 'et' ? '10 AI nõuannet kuus' : '10 AI Tips per month',
        language === 'et' ? 'Nõuanded ja õppetunnid' : 'Tips and Lessons',
        language === 'et' ? 'Põhimüügi stsenaariumid' : 'Basic sales scenarios',
        language === 'et' ? 'E-posti tugi' : 'Email support'
      ],
      buttonText: language === 'et' ? 'Vali plaan' : 'Get Plan',
      buttonAction: 'subscribe',
      limits: { conversations: 30, aiTips: 10 }
    },
    {
      name: 'Pro',
      price: 89.99,
      period: language === 'et' ? 'kuu' : 'month',
      features: [
        language === 'et' ? '50 AI Vestlust kuus' : '50 AI conversations per month',
        language === 'et' ? '25 AI nõuannet kuus' : '25 AI Tips per month',
        language === 'et' ? 'Nõuanded ja õppetunnid' : 'Tips and Lessons',
        language === 'et' ? 'Rohkem kliendi kohandamist' : 'More Client Customization',
        language === 'et' ? 'Isiklik kokkuvõtte tagasiside' : 'Personal Summary Feedback',
        language === 'et' ? 'Prioriteetne tugi' : 'Priority support'
      ],
      popular: true,
      buttonText: language === 'et' ? 'Vali plaan' : 'Get Plan',
      buttonAction: 'subscribe',
      limits: { conversations: 50, aiTips: 25 }
    },
    {
      name: language === 'et' ? 'Piiramatu' : 'Unlimited',
      price: 349,
      period: language === 'et' ? 'kuu' : 'month',
      features: [
        language === 'et' ? '200 AI Vestlust kuus' : '200 AI conversations per month',
        language === 'et' ? '50 AI nõuannet kuus' : '50 AI Tips per month',
        language === 'et' ? 'Nõuanded ja õppetunnid' : 'Tips and Lessons',
        language === 'et' ? 'Rohkem kliendi kohandamist' : 'More Client Customization',
        language === 'et' ? 'Isiklik kokkuvõtte tagasiside' : 'Personal Summary Feedback',
        language === 'et' ? 'Pühendatud tugi' : 'Dedicated support'
      ],
      buttonText: language === 'et' ? 'Vali plaan' : 'Get Plan',
      buttonAction: 'subscribe',
      limits: { conversations: 200, aiTips: 50 }
    },
    {
      name: language === 'et' ? 'Ettevõte' : 'Enterprise',
      price: null,
      period: language === 'et' ? 'kuu' : 'month',
      features: [
        language === 'et' ? '50 AI vestlusi päevas' : '50 AI conversations per day',
        language === 'et' ? '50 AI nõuannet kuus' : '50 AI Tips per month',
        language === 'et' ? 'Nõuanded ja õppetunnid' : 'Tips and Lessons',
        language === 'et' ? 'Rohkem kliendi kohandamist' : 'More Client Customization',
        language === 'et' ? 'Isiklik kokkuvõtte tagasiside' : 'Personal Summary Feedback',
        language === 'et' ? 'Täpsem meeskonna juhtimine' : 'Advanced Team Management',
        language === 'et' ? 'Ettevõtte edetabelid' : 'Company Leaderboards',
        language === 'et' ? 'SSO integratsioon' : 'SSO Integration',
        language === 'et' ? 'Kohandatud bränding' : 'Custom Branding',
        language === 'et' ? 'Täpsem analüütika armatuurlaud' : 'Advanced Analytics Dashboard',
        language === 'et' ? 'API juurdepääs' : 'API Access',
        language === 'et' ? 'Pühendatud konto haldur' : 'Dedicated Account Manager',
        language === 'et' ? 'Prioriteetne telefonitugi' : 'Priority Phone Support',
        language === 'et' ? 'Kohandatud koolitusprogrammid' : 'Custom Training Programs',
        language === 'et' ? 'Valge märgistusega lahendused' : 'White-label Solutions'
      ],
      buttonText: language === 'et' ? 'Võta ühendust müügiga' : 'Contact Sales',
      buttonAction: 'contact',
      limits: { conversations: 50, aiTips: 50 }
    }
  ];

  const renderPlanCard = (plan: PricingPlan, options?: { noScroll?: boolean }) => (
    <div
      key={plan.name}
      className={`relative overflow-visible bg-white dark:bg-dark-800 rounded-xl shadow-lg border-2 p-6 flex flex-col h-full ${
        plan.popular ? 'border-blue-500 scale-105' : 'border-gray-200 dark:border-dark-600'
      }`}
    >
      {plan.popular && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
           <span className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded-full text-xs md:text-sm font-semibold shadow whitespace-nowrap ring-1 ring-white/50">
             <Star className="w-4 h-4" />
             {language === 'et' ? 'Kõige populaarsem' : 'Most Popular'}
           </span>
        </div>
      )}

      <div className="text-center mb-4">
        <h3 className="text-xl font-bold mb-1 text-gray-900 dark:text-white">{plan.name}</h3>
        <div className="mb-3">
        {plan.price === null ? (
          <span className="text-2xl font-bold text-gray-900 dark:text-white">{language === 'et' ? 'Kohandatud' : 'Custom'}</span>
        ) : (
            <>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">${plan.price}</span>
              <span className="text-gray-600 dark:text-gray-400">/{plan.period}</span>
            </>
          )}
        </div>
        {plan.name === 'Enterprise' || plan.name === 'Ettevõte' ? (
          <p className="text-gray-600 dark:text-gray-400">{language === 'et' ? '50 Vestlust päevas' : '50 conversations/day'}</p>
        ) : plan.limits.conversations === -1 ? (
          <p className="text-gray-600 dark:text-gray-400">{language === 'et' ? 'Piiramatud vestlused' : 'Unlimited conversations'}</p>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">{language === 'et' ? `${plan.limits.conversations} Vestlust kuus` : `${plan.limits.conversations} conversations/month`}</p>
        )}
      </div>

      <ul className="space-y-3 mb-6">
        {(options?.noScroll ? plan.features.slice(0, 6) : plan.features).map((feature, featureIndex) => (
          <li key={featureIndex} className="flex items-start text-sm">
            <Check className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300 leading-snug">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => {
          if (!user) {
            // Store the intended plan in localStorage before redirecting to registration
            if (plan.name !== 'Free' && plan.name !== 'Tasuta') {
              localStorage.setItem('intendedPlan', plan.name.toLowerCase());
            }
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
            : 'bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-800 dark:text-gray-200'
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
      const planKey = planName.toLowerCase();
      console.log('Attempting to subscribe to plan:', { planName, planKey });
      
      const response = await axios.post(`${API_BASE_URL}/api/subscriptions/create-checkout-session`, {
        plan: planKey
      }, {
        withCredentials: true
      });
      
      console.log('Checkout session created:', response.data);
      
      // Redirect to Stripe checkout
      window.location.href = response.data.url;
    } catch (error: any) {
      console.error('Subscription error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to create checkout session';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterpriseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/api/enterprise/request`, formData, {
        withCredentials: true
      });
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
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
         <div className="text-center mb-16">
           <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
             {language === 'et' ? 'Vali oma plaan' : 'Choose Your Plan'}
           </h1>
           <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
             {language === 'et' ? 'Alusta meie tasuta tasemega ja uuenda kasvades. Kõik plaanid sisaldavad meie põhilisi AI koolitusfunktsioone.' : 'Start with our free tier and upgrade as you grow. All plans include our core AI training features.'}
           </p>
         </div>

        {/* Row 1: Free, Basic, Pro */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto items-stretch">
          {(language === 'et' ? ['Tasuta', 'Põhi', 'Pro'] : ['Free', 'Basic', 'Pro']).map(name => {
            const plan = plans.find(p => p.name === name)!;
            return renderPlanCard(plan);
          })}
        </div>

        {/* Row 2: Enterprise and Unlimited aligned, no scroll within cards */}
        <div className="max-w-6xl mx-auto mt-10">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {language === 'et' ? 'Ettevõte ja Piiramatu' : 'Enterprise & Unlimited'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {language === 'et' ? 'Soovid levitada SalesBuddy oma ettevõttes? Uuri Ettevõte plaan meeskonna funktsioonide, SSO ja prioriteetse toe jaoks. Eelistad piiranguid? Vali Piiramatu.' : 'Looking to roll out SalesBuddy across your company? Explore Enterprise for team features, SSO, and priority support. Prefer no limits? Choose Unlimited.'}
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {(() => {
              const enterprise = plans.find(p => p.name === (language === 'et' ? 'Ettevõte' : 'Enterprise'))!;
              return renderPlanCard(enterprise, { noScroll: true });
            })()}
            {(() => {
              const unlimited = plans.find(p => p.name === (language === 'et' ? 'Piiramatu' : 'Unlimited'))!;
              return renderPlanCard(unlimited, { noScroll: true });
            })()}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            {language === 'et' ? 'Korduma kippuvad küsimused' : 'Frequently Asked Questions'}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                {language === 'et' ? 'Kas saan plaanil muuta igal ajal?' : 'Can I change my plan anytime?'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {language === 'et' ? 'Jah, saad oma plaani igal ajal üles või alla muuta. Muudatused jõustuvad kohe.' : 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.'}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                {language === 'et' ? 'Mis juhtub, kui ületan oma limiidi?' : 'What happens if I exceed my limit?'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {language === 'et' ? 'Saad teate, kui oled limiidile lähedal. Uuenda oma plaani, et jätkata treeningut.' : 'You\'ll be notified when you\'re close to your limit. Upgrade your plan to continue training.'}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                {language === 'et' ? 'Kas teil on tasuta prooviversioon?' : 'Is there a free trial?'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {language === 'et' ? 'Jah! Alusta meie tasuta tasemega, mis sisaldab 10 vestlust kuus. Kokkuvõtted on lukustatud, kuni uuendad.' : 'Yes! Start with our free tier that includes 10 conversations per month. Summaries are locked until you upgrade.'}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                {language === 'et' ? 'Kas pakute tagasimakseid?' : 'Do you offer refunds?'}
              </h3>
               <p className="text-gray-600 dark:text-gray-400">
                 {language === 'et' ? 'Pakume 14-päevast raha tagasi garantiid kõigi tasuliste plaanide jaoks.' : 'We offer a 14-day money-back guarantee for all paid plans.'}
               </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Contact Modal */}
      {showEnterpriseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {language === 'et' ? 'Ettevõtte päring' : 'Enterprise Inquiry'}
                </h2>
                <button
                  onClick={() => setShowEnterpriseModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleEnterpriseSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'et' ? 'Eesnimi *' : 'First Name *'}
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'et' ? 'Perekonnanimi *' : 'Last Name *'}
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'et' ? 'E-post *' : 'Email *'}
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'et' ? 'Telefon' : 'Phone'}
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'et' ? 'Ettevõte *' : 'Company *'}
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'et' ? 'Ametikoht *' : 'Job Title *'}
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'et' ? 'Ettevõtte suurus *' : 'Company Size *'}
                    </label>
                    <select
                      name="companySize"
                      value={formData.companySize}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                    >
                      <option value="">{language === 'et' ? 'Vali suurus' : 'Select size'}</option>
                       <option value="1-10">{language === 'et' ? '1-10 töötajat' : '1-10 employees'}</option>
                       <option value="11-50">{language === 'et' ? '11-50 töötajat' : '11-50 employees'}</option>
                       <option value="51-200">{language === 'et' ? '51-200 töötajat' : '51-200 employees'}</option>
                       <option value="201-500">{language === 'et' ? '201-500 töötajat' : '201-500 employees'}</option>
                       <option value="500+">{language === 'et' ? '500+ töötajat' : '500+ employees'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'et' ? 'Tööstusharu *' : 'Industry *'}
                    </label>
                    <input
                      type="text"
                      name="industry"
                      value={formData.industry}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                       placeholder={language === 'et' ? 'nt. Tehnoloogia, Tervishoid' : 'e.g., Technology, Healthcare'}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'et' ? 'Peamine kasutusjuhtum *' : 'Primary Use Case *'}
                  </label>
                  <input
                    type="text"
                    name="useCase"
                    value={formData.useCase}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                     placeholder={language === 'et' ? 'nt. Müügimeeskonna treening, Klienditeenindus' : 'e.g., Sales team training, Customer service'}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'et' ? 'Oodatud kasutajad *' : 'Expected Users *'}
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'et' ? 'Eelarve vahemik *' : 'Budget Range *'}
                    </label>
                    <select
                      name="budget"
                      value={formData.budget}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                    >
                      <option value="">{language === 'et' ? 'Vali eelarve' : 'Select budget'}</option>
                      <option value="$500-$1000">$500-$1000</option>
                      <option value="$1000-$2500">$1000-$2500</option>
                      <option value="$2500-$5000">$2500-$5000</option>
                      <option value="$5000+">$5000+</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'et' ? 'Ajakava *' : 'Timeline *'}
                  </label>
                  <select
                    name="timeline"
                    value={formData.timeline}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                  >
                    <option value="">{language === 'et' ? 'Vali ajakava' : 'Select timeline'}</option>
                    <option value="Immediate">{language === 'et' ? 'Kohe' : 'Immediate'}</option>
                    <option value="1-2 weeks">{language === 'et' ? '1-2 nädalat' : '1-2 weeks'}</option>
                    <option value="1 month">{language === 'et' ? '1 kuu' : '1 month'}</option>
                    <option value="2-3 months">{language === 'et' ? '2-3 kuud' : '2-3 months'}</option>
                    <option value="3+ months">{language === 'et' ? '3+ kuud' : '3+ months'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'et' ? 'Täiendav teave' : 'Additional Information'}
                  </label>
                  <textarea
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleInputChange}
                    rows={4}
                    className="input-field"
                     placeholder={language === 'et' ? 'Räägi meile rohkem oma vajadustest...' : 'Tell us more about your needs...'}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEnterpriseModal(false)}
                    className="btn-secondary flex-1"
                  >
{language === 'et' ? 'Tühista' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1"
                  >
                    {loading ? (language === 'et' ? 'Saadan...' : 'Submitting...') : (language === 'et' ? 'Saada päring' : 'Submit Request')}
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