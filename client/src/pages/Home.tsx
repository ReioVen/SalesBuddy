import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useTranslation } from '../hooks/useTranslation.ts';
import { 
  Brain, 
  MessageSquare, 
  TrendingUp, 
  Users, 
  ArrowRight,
  Play,
  Star,
  ChevronDown,
  ChevronUp,
  Mail,
  FileText,
  Shield
} from 'lucide-react';

const Home: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(null);
  const [isTermsOpen, setIsTermsOpen] = React.useState<boolean>(false);
  const [isFaqOpen, setIsFaqOpen] = React.useState<boolean>(false);

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: t('aiPoweredTrainingTitle'),
      description: t('aiPoweredTrainingDesc')
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: t('realisticScenariosTitle'),
      description: t('realisticScenariosDesc')
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: t('performanceAnalyticsTitle'),
      description: t('performanceAnalyticsDesc')
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: t('teamManagementTitle'),
      description: t('teamManagementDesc')
    }
  ];

  const testimonials = [
    {
      name: t('sarahJohnson'),
      role: t('salesManager'),
      company: t('techCorp'),
      content: t('sarahTestimonial'),
      rating: 5
    },
    {
      name: t('mikeChen'),
      role: t('accountExecutive'),
      company: t('growthStart'),
      content: t('mikeTestimonial'),
      rating: 5
    },
    {
      name: t('emilyRodriguez'),
      role: t('salesDirector'),
      company: t('innovateCo'),
      content: t('emilyTestimonial'),
      rating: 5
    }
  ];

  const faqItems = [
    {
      question: t('faqQuestion1'),
      answer: t('faqAnswer1')
    },
    {
      question: t('faqQuestion2'),
      answer: t('faqAnswer2')
    },
    {
      question: t('faqQuestion3'),
      answer: t('faqAnswer3')
    },
    {
      question: t('faqQuestion4'),
      answer: t('faqAnswer4')
    },
    {
      question: t('faqQuestion5'),
      answer: t('faqAnswer5')
    },
    {
      question: t('faqQuestion6'),
      answer: t('faqAnswer6')
    },
    {
      question: t('faqQuestion7'),
      answer: t('faqAnswer7')
    },
    {
      question: t('faqQuestion8'),
      answer: t('faqAnswer8')
    },
    {
      question: t('faqQuestion9'),
      answer: t('faqAnswer9')
    },
    {
      question: t('faqQuestion10'),
      answer: t('faqAnswer10')
    },
    {
      question: t('faqQuestion11'),
      answer: t('faqAnswer11')
    },
    {
      question: t('faqQuestion12'),
      answer: t('faqAnswer12')
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen">
      <style jsx>{`
        .terms-html-content h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .dark .terms-html-content h3 {
          color: #f9fafb;
        }
        .terms-html-content p {
          margin-bottom: 1rem;
          line-height: 1.6;
        }
        .terms-html-content ul {
          margin: 0.75rem 0;
          padding-left: 1.5rem;
        }
        .terms-html-content li {
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }
        .terms-html-content h3:first-child {
          margin-top: 0;
        }
      `}</style>
      {/* Hero Section */}
      <section className="gradient-bg text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            {t('masterSalesWithAi')}
            <span className="block text-yellow-300">{t('aiPoweredTraining')}</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            {t('homeHeroDescription')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link to="/chat" className="btn-primary text-lg px-8 py-3 flex items-center justify-center">
                {t('startPracticing')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary text-lg px-8 py-3 flex items-center justify-center">
                  {t('getStartedFree')}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link to="/pricing" className="bg-white text-blue-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors duration-200 text-lg">
                  {t('viewPricing')}
                </Link>
              </>
            )}
          </div>
          <div className="mt-12 flex justify-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center space-x-4">
              <Play className="w-6 h-6" />
              <span>{t('watchDemo')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-dark-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">{t('whyChooseSalesBuddy')}</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('homeFeaturesDescription')}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow duration-300 bg-gray-50 dark:bg-dark-700">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50 dark:bg-dark-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">{t('howItWorks')}</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">{t('howItWorksDescription')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{t('signUpChoosePlan')}</h3>
              <p className="text-gray-600 dark:text-gray-300">{t('signUpChoosePlanDesc')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{t('startConversation')}</h3>
              <p className="text-gray-600 dark:text-gray-300">{t('startConversationDesc')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{t('improveTrackProgress')}</h3>
              <p className="text-gray-600 dark:text-gray-300">{t('improveTrackProgressDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white dark:bg-dark-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">{t('whatOurUsersSay')}</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">{t('whatOurUsersSayDescription')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 dark:bg-dark-700 p-6 rounded-lg">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</p>
                  <p className="text-gray-600 dark:text-gray-400">{testimonial.role} at {testimonial.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-bg text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">{t('readyToTransform')}</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            {t('readyToTransformDesc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link to="/chat" className="bg-white text-blue-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors duration-200 text-lg">
                {t('startPracticingNow')}
              </Link>
            ) : (
              <>
                <Link to="/register" className="bg-white text-blue-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors duration-200 text-lg">
                  {t('startFreeTrial')}
                </Link>
                <Link to="/pricing" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 font-medium py-3 px-8 rounded-lg transition-colors duration-200 text-lg">
                  {t('viewPlans')}
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50 dark:bg-dark-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm">
              <button
                className="w-full px-8 py-8 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-dark-700 rounded-lg transition-colors duration-200"
                onClick={() => setIsFaqOpen(!isFaqOpen)}
              >
                <div>
                  <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">{t('frequentlyAskedQuestions')}</h2>
                  <p className="text-xl text-gray-600 dark:text-gray-300">
                    {t('faqDescription')}
                  </p>
                </div>
                {isFaqOpen ? (
                  <ChevronUp className="w-6 h-6 text-gray-500" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-500" />
                )}
              </button>
              {isFaqOpen && (
                <div className="px-8 pb-8">
                  <div className="space-y-6 mt-6">
                    {faqItems.map((item, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-dark-700 rounded-lg shadow-sm">
                        <button
                          className="w-full px-8 py-6 text-left flex justify-between items-center hover:bg-gray-100 dark:hover:bg-dark-600 rounded-lg transition-colors duration-200"
                          onClick={() => toggleFaq(index)}
                        >
                          <span className="font-semibold text-gray-900 dark:text-white pr-4">{item.question}</span>
                          {openFaqIndex === index ? (
                            <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          )}
                        </button>
                        {openFaqIndex === index && (
                          <div className="px-8 pb-6">
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                              {item.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Terms of Service Section */}
      <section className="py-20 bg-white dark:bg-dark-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">{t('termsOfService')}</h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                {t('termsDescription')}
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-dark-700 rounded-lg shadow-sm mb-8">
              <button
                className="w-full px-8 py-6 text-left flex justify-between items-center hover:bg-gray-100 dark:hover:bg-dark-600 rounded-lg transition-colors duration-200"
                onClick={() => setIsTermsOpen(!isTermsOpen)}
              >
                <div className="flex items-start space-x-4">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('termsTitle')}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('termsLastUpdated')}</p>
                  </div>
                </div>
                {isTermsOpen ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {isTermsOpen && (
                <div className="px-8 pb-8">
                  <div 
                    className="text-gray-600 dark:text-gray-300 leading-relaxed max-w-none terms-html-content"
                    dangerouslySetInnerHTML={{ __html: t('termsContent') }}
                  />
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <Shield className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('privacyPolicy')}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {t('privacyPolicyDescription')}
                </p>
              </div>
              
              <div className="text-center p-6 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('contactUs')}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                  {t('contactUsDescription')}
                </p>
                <a 
                  href={`mailto:${t('supportEmail')}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                >
                  {t('supportEmail')}
                </a>
              </div>
              
              <div className="text-center p-6 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <Star className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Customer Support</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Get help from our dedicated support team whenever you need assistance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 