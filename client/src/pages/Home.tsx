import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { 
  Brain, 
  MessageSquare, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  ArrowRight,
  Play,
  Star
} from 'lucide-react';

const Home: React.FC = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: 'AI-Powered Training',
      description: 'Practice with intelligent AI that adapts to your industry and experience level.'
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'Realistic Scenarios',
      description: 'Experience authentic customer interactions with common objections and concerns.'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Performance Analytics',
      description: 'Track your progress with detailed analytics and improvement suggestions.'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Team Management',
      description: 'Manage your sales team with enterprise features and collaboration tools.'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Sales Manager',
      company: 'TechCorp',
      content: 'SalesBuddy has transformed our sales training. Our team\'s confidence and close rates have improved dramatically.',
      rating: 5
    },
    {
      name: 'Mike Chen',
      role: 'Account Executive',
      company: 'GrowthStart',
      content: 'The AI scenarios are incredibly realistic. I feel much more prepared for real customer interactions.',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Sales Director',
      company: 'InnovateCo',
      content: 'The analytics help us identify areas for improvement. It\'s like having a personal sales coach.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-bg text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Master Sales with
            <span className="block text-yellow-300">AI-Powered Training</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Practice with intelligent AI that acts as your customer. Improve your sales skills with realistic scenarios and personalized feedback.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link to="/chat" className="btn-primary text-lg px-8 py-3 flex items-center justify-center">
                Start Practicing
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary text-lg px-8 py-3 flex items-center justify-center">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link to="/pricing" className="bg-white text-blue-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors duration-200 text-lg">
                  View Pricing
                </Link>
              </>
            )}
          </div>
          <div className="mt-12 flex justify-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center space-x-4">
              <Play className="w-6 h-6" />
              <span>Watch Demo</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose SalesBuddy?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to become a sales expert, powered by cutting-edge AI technology.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow duration-300">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Get started in minutes with our simple 3-step process</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Sign Up & Choose Plan</h3>
              <p className="text-gray-600">Create your account and select the plan that fits your needs.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Start Conversation</h3>
              <p className="text-gray-600">Begin chatting with our AI that acts as your potential customer.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Improve & Track Progress</h3>
              <p className="text-gray-600">Get feedback and track your improvement over time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-xl text-gray-600">Join thousands of sales professionals who trust SalesBuddy</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-lg">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-gray-600">{testimonial.role} at {testimonial.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-bg text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Sales Skills?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of sales professionals who are already improving their skills with SalesBuddy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link to="/chat" className="bg-white text-blue-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors duration-200 text-lg">
                Start Practicing Now
              </Link>
            ) : (
              <>
                <Link to="/register" className="bg-white text-blue-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors duration-200 text-lg">
                  Start Free Trial
                </Link>
                <Link to="/pricing" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 font-medium py-3 px-8 rounded-lg transition-colors duration-200 text-lg">
                  View Plans
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