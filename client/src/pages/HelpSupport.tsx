import React, { useState } from 'react';
import { 
  LucideHelpCircle, 
  LucideMail, 
  LucideMessageSquare, 
  LucideBookOpen, 
  LucideVideo, 
  LucideFileText,
  LucideSearch,
  LucideChevronRight,
  LucideExternalLink,
  LucidePhone,
  LucideClock,
  LucideCheckCircle
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const HelpSupport: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const helpCategories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: LucideBookOpen,
      color: 'blue',
      items: [
        {
          title: 'Welcome to Nexora',
          description: 'Learn the basics of using Nexora for project management',
          type: 'article',
          readTime: '5 min read'
        },
        {
          title: 'Creating Your First Project',
          description: 'Step-by-step guide to setting up your first project',
          type: 'article',
          readTime: '3 min read'
        },
        {
          title: 'Inviting Team Members',
          description: 'How to invite and manage team members in your facility',
          type: 'article',
          readTime: '4 min read'
        }
      ]
    },
    {
      id: 'features',
      title: 'Features & Functionality',
      icon: LucideHelpCircle,
      color: 'green',
      items: [
        {
          title: 'Task Management',
          description: 'Master task creation, assignment, and tracking',
          type: 'article',
          readTime: '6 min read'
        },
        {
          title: 'Time Tracking',
          description: 'Learn how to log time and track productivity',
          type: 'article',
          readTime: '4 min read'
        },
        {
          title: 'Analytics & Reports',
          description: 'Understanding your data and generating reports',
          type: 'article',
          readTime: '7 min read'
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: LucideCheckCircle,
      color: 'orange',
      items: [
        {
          title: 'Login Issues',
          description: 'Common login problems and solutions',
          type: 'article',
          readTime: '3 min read'
        },
        {
          title: 'Performance Issues',
          description: 'Optimizing Nexora for better performance',
          type: 'article',
          readTime: '5 min read'
        },
        {
          title: 'Data Sync Problems',
          description: 'Resolving synchronization issues',
          type: 'article',
          readTime: '4 min read'
        }
      ]
    }
  ];

  const supportOptions = [
    {
      title: 'Contact Support',
      description: 'Get help from our support team',
      icon: LucideMessageSquare,
      action: 'contact',
      color: 'blue'
    },
    {
      title: 'Email Support',
      description: 'Send us an email and we\'ll get back to you',
      icon: LucideMail,
      action: 'email',
      color: 'green'
    },
    {
      title: 'Video Tutorials',
      description: 'Watch step-by-step video guides',
      icon: LucideVideo,
      action: 'videos',
      color: 'purple'
    },
    {
      title: 'Documentation',
      description: 'Comprehensive guides and API documentation',
      icon: LucideFileText,
      action: 'docs',
      color: 'gray'
    }
  ];

  const faqs = [
    {
      question: 'How do I reset my password?',
      answer: 'You can reset your password by clicking "Forgot Password" on the login page. We\'ll send you a secure link to create a new password.'
    },
    {
      question: 'Can I export my data?',
      answer: 'Yes! You can export your projects, tasks, and time logs in various formats including CSV and PDF from the Settings page.'
    },
    {
      question: 'How many team members can I invite?',
      answer: 'There\'s no limit on team members. You can invite as many people as needed to collaborate on your projects.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Absolutely. We use enterprise-grade security with encryption at rest and in transit. Your data is backed up regularly and stored securely.'
    }
  ];

  const handleSupportAction = (action: string) => {
    switch (action) {
      case 'contact':
        // Open contact form or chat
        console.log('Opening contact support');
        break;
      case 'email':
        window.location.href = 'mailto:support@nexora.com';
        break;
      case 'videos':
        // Open video tutorials
        console.log('Opening video tutorials');
        break;
      case 'docs':
        window.open('https://docs.nexora.com', '_blank');
        break;
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: isDarkMode ? 'bg-blue-900/20 text-blue-300 border-blue-700' : 'bg-blue-50 text-blue-700 border-blue-200',
      green: isDarkMode ? 'bg-green-900/20 text-green-300 border-green-700' : 'bg-green-50 text-green-700 border-green-200',
      orange: isDarkMode ? 'bg-orange-900/20 text-orange-300 border-orange-700' : 'bg-orange-50 text-orange-700 border-orange-200',
      purple: isDarkMode ? 'bg-purple-900/20 text-purple-300 border-purple-700' : 'bg-purple-50 text-purple-700 border-purple-200',
      gray: isDarkMode ? 'bg-gray-800 text-gray-300 border-gray-600' : 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
              <LucideHelpCircle className={`w-6 h-6 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Help & Support
              </h1>
              <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Find answers, get help, and learn how to use Nexora effectively
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <LucideSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="Search help articles, FAQs, and guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-brand transition-colors ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500'
              }`}
            />
          </div>
        </div>

        {/* Support Options */}
        <div className="mb-12">
          <h2 className={`text-2xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Get Help
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {supportOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleSupportAction(option.action)}
                  className={`p-6 rounded-lg border-2 transition-all duration-200 hover:shadow-lg hover:scale-105 text-left ${getColorClasses(option.color)}`}
                >
                  <Icon className="w-8 h-8 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{option.title}</h3>
                  <p className="text-sm opacity-80">{option.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Help Categories */}
        <div className="mb-12">
          <h2 className={`text-2xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Help Articles
          </h2>
          <div className="space-y-6">
            {helpCategories.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.id} className={`rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${getColorClasses(category.color)}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {category.title}
                      </h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {category.items.map((item, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border transition-colors cursor-pointer hover:shadow-md ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                              : 'bg-gray-50 border-gray-200 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {item.title}
                            </h4>
                            <LucideChevronRight className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          </div>
                          <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {item.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {item.readTime}
                            </span>
                            <LucideExternalLink className={`w-3 h-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <h2 className={`text-2xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Frequently Asked Questions
          </h2>
          <div className={`rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            {faqs.map((faq, index) => (
              <div key={index} className={`p-6 ${index !== faqs.length - 1 ? `border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}` : ''}`}>
                <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {faq.question}
                </h3>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Information */}
        <div className={`rounded-lg border p-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-2xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Still Need Help?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <LucideMail className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <div>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Email Support</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>support@nexora.com</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <LucideClock className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              <div>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Response Time</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Within 24 hours</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <LucidePhone className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              <div>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Phone Support</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>+1 (555) 123-4567</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;
