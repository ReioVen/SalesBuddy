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
  Star
} from 'lucide-react';

const Home: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

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

  return (
    <div className="min-h-screen">
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
    </div>
  );
};

export default Home; 