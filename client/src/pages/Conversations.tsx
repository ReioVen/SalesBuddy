import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from '../hooks/useTranslation.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, MessageSquare, User, Building, Briefcase, FileText, Send, X, Star, Lightbulb, Volume2, VolumeX } from 'lucide-react';
import ConversationAIFeedback from '../components/ConversationAIFeedback.tsx';
import SpeechInput from '../components/SpeechInput.tsx';
import VoiceCommands from '../components/VoiceCommands.tsx';
import AITips from '../components/AITips.tsx';
import { useUniversalTextToSpeech } from '../hooks/useUniversalTextToSpeech.ts';
import { universalTtsService } from '../services/universalTtsService.ts';
import { enhancedTtsService } from '../services/enhancedTtsService.ts';

const API_BASE_URL = 'https://salesbuddy-production.up.railway.app';

interface ClientCustomization {
  name: string;
  scenario: string;
  personality: string;
  industry: string;
  role: string;
  customPrompt: string;
  difficulty: 'easy' | 'medium' | 'hard';
  selectedVoice?: SpeechSynthesisVoice | null;
  ttsVolume?: number;
  familySize?: number;
  income?: string;
  incomeRange?: string;
  priceSensitivity?: string;
  contentInterest?: string;
  familyType?: string;
  difficultyPhase?: string;
  challengingPhase?: string; // NEW: Specific challenging phase for challenging_moments
  // NEW: Layered personality modifiers
  moodModifier?: string;
  microTraits?: string[];
  timeContext?: string;
  decisionStyle?: string;
  randomEvents?: string[];
  // NEW: Persona depth attributes
  communicationStyle?: string;
  preferredChannel?: string;
  buyingHistory?: string;
  values?: string;
  // NEW: Advanced human-like characteristics
  energyLevel?: string;
  cognitiveBias?: string;
  timeContextNew?: string;
  communicationGlitches?: string;
  personalityShifts?: string;
  emotionalTriggers?: string;
  randomAddOns?: string;
  memoryRecall?: string;
  // NEW: Emotional algorithm attributes
  emotionalProfile?: {
    name: string;
    primaryNeeds: string[];
    painPoints: string[];
    emotionalTriggers: string[];
    buyingMotivation: string;
    resistanceLevel: string;
  };
  emotionalState?: {
    current: string;
    volatility: number;
    responsiveness: number;
    trustLevel: number;
    buyingUrgency: number;
  };
  painPoints?: Array<{
    category: string;
    points: string[];
    intensity: number;
  }>;
  buyingProgression?: {
    name: string;
    resistance: number;
    interest: number;
  };
  // Existing attributes
  personalityTraits?: string[];
  sellingPoints?: string[];
  problems?: string[];
  weakSpots?: string[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  scenario: string;
  conversationMode?: 'chat' | 'call'; // Track if it's a chat or call
  clientCustomization: ClientCustomization;
  messages: Message[];
  totalTokens?: number;
  duration?: number;
  rating?: number;
  feedback?: string;
  aiRatings?: {
    introduction: number;
    mapping: number;
    productPresentation: number;
    objectionHandling: number;
    close: number;
  };
  aiRatingFeedback?: string;
  createdAt?: string;
  updatedAt?: string;
}

const Conversations: React.FC = () => {
  const { t, language } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [showNewChatForm, setShowNewChatForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [endingConversation, setEndingConversation] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [voiceCommandsEnabled, setVoiceCommandsEnabled] = useState(true);
  const [handsFreeMode, setHandsFreeMode] = useState(false);
  const speakAIResponseRef = useRef<((response: string) => void) | null>(null); // Use ref only, not state
  const [ttsVolume, setTtsVolume] = useState(0.7); // Default volume at 70%
  const [conversationMode, setConversationMode] = useState<'chat' | 'call'>('chat'); // NEW: Track conversation mode
  
  // Enhanced text-to-speech functionality for voice selection
  const { voices, universalVoices, speak: testVoice, hasEstonianVoices, estonianVoices } = useUniversalTextToSpeech();
  
  // Function to reconstruct SpeechSynthesisVoice from saved data
  const reconstructVoice = useCallback((savedVoice: any) => {
    if (!savedVoice || !voices.length) return null;
    
    // Find the voice by name and language
    const voice = voices.find(v => 
      v.name === savedVoice.name && 
      v.lang === savedVoice.lang
    );
    
    return voice || null;
  }, [voices]);
  
  const [conversationHistory, setConversationHistory] = useState<Conversation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showConversationDetail, setShowConversationDetail] = useState(false);
  const [usageStatus, setUsageStatus] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Add flags to track if data has been loaded to prevent unnecessary re-fetching
  const [dataLoaded, setDataLoaded] = useState(false);
  const [usageStatusLoaded, setUsageStatusLoaded] = useState(false);
  
  // AI Tips state
  const [showAITips, setShowAITips] = useState(false);
  const [aiTipsMinimized, setAiTipsMinimized] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const conversationsPerPage = 5;
  
  // Pagination calculations
  const totalPages = Math.ceil(conversationHistory.length / conversationsPerPage);
  const startIndex = (currentPage - 1) * conversationsPerPage;
  const endIndex = startIndex + conversationsPerPage;
  const currentConversations = conversationHistory.slice(startIndex, endIndex);
  
  const [clientCustomization, setClientCustomization] = useState<ClientCustomization>({
    name: '',
    scenario: 'general',
    personality: '',
    industry: '',
    role: '',
    customPrompt: '',
    difficulty: 'medium',
    selectedVoice: null
  });

  // Track selected language for voice (separate from browser voice object)
  const [selectedVoiceLanguage, setSelectedVoiceLanguage] = useState<string>('random');

  // Initialize ttsVolume from clientCustomization when it changes
  useEffect(() => {
    if (clientCustomization.ttsVolume !== undefined) {
      setTtsVolume(clientCustomization.ttsVolume);
    }
  }, [clientCustomization.ttsVolume]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  // Add/remove CSS class to body when chat popups are open
  useEffect(() => {
    const isPopupOpen = showNewChatForm || currentConversation || showConversationDetail;
    
    if (isPopupOpen) {
      document.body.classList.add('chat-popup-open');
    } else {
      document.body.classList.remove('chat-popup-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('chat-popup-open');
    };
  }, [showNewChatForm, currentConversation, showConversationDetail]);

  // Load usage status only once when component mounts and user is authenticated
  useEffect(() => {
    const loadUsageStatus = async () => {
      if (!user || usageStatusLoaded) return;
      
      try {
        const response = await axios.get(`${API_BASE_URL}/api/subscriptions/status`, {
          withCredentials: true
        });
        setUsageStatus(response.data.usageStatus);
        setUsageStatusLoaded(true);
      } catch (error: any) {
        console.error('Failed to load usage status:', error);
      }
    };

    if (user && !usageStatusLoaded) {
      loadUsageStatus();
    }
  }, [user, usageStatusLoaded]);

  // Function to refresh usage status (used after actions that might change usage)
  const refreshUsageStatus = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/subscriptions/status`, {
        withCredentials: true
      });
      setUsageStatus(response.data.usageStatus);
    } catch (error: any) {
      console.error('Failed to refresh usage status:', error);
    }
  }, [user]);


  // Load conversation history only once when component mounts
  useEffect(() => {
    const loadHistory = async () => {
      if (!user || dataLoaded) return;
      
      // Check usage before loading conversation history
      if (usageStatus && usageStatus.monthlyLimit > 0 && usageStatus.currentUsage >= usageStatus.monthlyLimit) {
        toast.error('You have reached your monthly conversation limit. Please upgrade your plan to continue.');
        navigate('/pricing');
        return;
      }
      
      setLoadingHistory(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/ai/conversations`, {
          withCredentials: true
        });
        
        // Map _id to id for frontend compatibility
        const conversations = (response.data.conversations || []).map((conv: any) => ({
          ...conv,
          id: conv._id || conv.id
        }));
        setConversationHistory(conversations);
        setDataLoaded(true);
      } catch (error: any) {
        console.error('Failed to load conversation history:', error);
        toast.error('Failed to load conversation history');
      } finally {
        setLoadingHistory(false);
      }
    };

    if (user && !dataLoaded) {
      loadHistory();
    }
  }, [user, dataLoaded, usageStatus, navigate]);

  // Load conversation history when user first becomes able to use AI (only if not already loaded)
  useEffect(() => {
    const loadHistoryWhenReady = async () => {
      if (!user || !usageStatus || !usageStatus.canUseAI || dataLoaded) return;
      
      setLoadingHistory(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/ai/conversations`, {
          withCredentials: true
        });
        const conversations = (response.data.conversations || []).map((conv: any) => ({
          ...conv,
          id: conv._id || conv.id
        }));
        setConversationHistory(conversations);
        setDataLoaded(true);
      } catch (error: any) {
        console.error('Failed to load conversation history:', error);
        toast.error('Failed to load conversation history');
      } finally {
        setLoadingHistory(false);
      }
    };

    if (user && usageStatus && usageStatus.canUseAI && !dataLoaded) {
      loadHistoryWhenReady();
    }
  }, [user, usageStatus, dataLoaded]);

  // No automatic refresh - only refresh when user performs actions

  const handleStartConversation = async () => {
    if (!user) {
      toast.error('Please log in to start a conversation');
      return;
    }

    // Check usage before starting conversation
    if (usageStatus && usageStatus.monthlyLimit > 0 && usageStatus.currentUsage >= usageStatus.monthlyLimit) {
      toast.error('You have reached your monthly conversation limit. Please upgrade your plan to continue.');
      navigate('/pricing');
      return;
    }

    setLoading(true);
    try {
      const volumeToSend = clientCustomization.ttsVolume || ttsVolume;
      
      // Automatically enable hands-free mode for calls
      if (conversationMode === 'call') {
        setHandsFreeMode(true);
        setSpeechEnabled(true);
        setVoiceCommandsEnabled(true);
      }
      
      const response = await axios.post(`${API_BASE_URL}/api/ai/conversation`, {
        scenario: clientCustomization.scenario,
        clientName: clientCustomization.name || undefined,
        clientPersonality: clientCustomization.personality || undefined,
        clientIndustry: clientCustomization.industry || undefined,
        clientRole: clientCustomization.role || undefined,
        customPrompt: clientCustomization.customPrompt || undefined,
        difficulty: clientCustomization.difficulty,
        language: language,
        conversationMode: conversationMode, // NEW: Send conversation mode to backend
        selectedVoice: clientCustomization.selectedVoice ? {
          name: clientCustomization.selectedVoice.name,
          lang: clientCustomization.selectedVoice.lang,
          voiceURI: clientCustomization.selectedVoice.voiceURI
        } : undefined,
        ttsVolume: volumeToSend
      }, {
        withCredentials: true
      });

      toast.success(conversationMode === 'call' ? (language === 'et' ? 'Kõne algas!' : 'Call started!') : t('conversationStarted'));
      setShowNewChatForm(false);
      
      // Set the current conversation and open chat window
      setCurrentConversation({
        id: response.data.conversation.id,
        title: response.data.conversation.title,
        scenario: response.data.conversation.scenario,
        conversationMode: conversationMode, // Store the mode
        clientCustomization: response.data.conversation.clientCustomization,
        messages: response.data.conversation.messages || []
      });
      
      // For call mode, pre-initialize speech recognition
      if (conversationMode === 'call') {
        console.log('📞 Call mode: Microphone will auto-start');
        // The SpeechInput component will handle starting the microphone automatically
        // via its handsFreeMode effect
      }
      
      setClientCustomization({
        name: '',
        scenario: 'general',
        personality: '',
        industry: '',
        role: '',
        customPrompt: '',
        difficulty: 'medium',
        selectedVoice: null
      });

      // Refresh usage status after starting conversation
      refreshUsageStatus();
      // Manually add the new conversation to the history
      const newConversation = {
        id: response.data.conversation.id,
        title: response.data.conversation.title,
        scenario: response.data.conversation.scenario,
        clientCustomization: response.data.conversation.clientCustomization,
        messages: response.data.conversation.messages || []
      };
      setConversationHistory(prev => [newConversation, ...prev]);
      setCurrentPage(1); // Reset to first page when new conversation is added
    } catch (error: any) {
      const message = error.response?.data?.error || t('failedToStartConversation');
      
      // Check if user needs to upgrade their plan
      if (error.response?.data?.upgradeRequired) {
        toast.error('You have reached your conversation limit. Please upgrade your plan to continue.');
        navigate('/pricing');
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUseDefaultClient = () => {
    // Check usage before starting conversation
    if (usageStatus && usageStatus.monthlyLimit > 0 && usageStatus.currentUsage >= usageStatus.monthlyLimit) {
      toast.error('You have reached your monthly conversation limit. Please upgrade your plan to continue.');
      navigate('/pricing');
      return;
    }

    setClientCustomization({
      name: '',
      scenario: 'general',
      personality: '',
      industry: '',
      role: '',
      customPrompt: '',
      difficulty: 'medium'
    });
    handleStartConversation();
  };

  const handleSendMessage = async (messageText?: string) => {
    const messageToSend = messageText || (newMessage ? newMessage.trim() : '');
    if (!messageToSend || !currentConversation || sendingMessage) return;

    // Check usage before sending message
    if (usageStatus && usageStatus.monthlyLimit > 0 && usageStatus.currentUsage >= usageStatus.monthlyLimit) {
      toast.error('You have reached your monthly conversation limit. Please upgrade your plan to continue.');
      navigate('/pricing');
      return;
    }

    setSendingMessage(true);
    setNewMessage('');

    // Add user message to conversation
    const updatedConversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, {
        role: 'user' as const,
        content: messageToSend,
        timestamp: new Date()
      }]
    };
    setCurrentConversation(updatedConversation);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai/message`, {
        conversationId: currentConversation.id,
        message: messageToSend,
        language: language
      }, {
        withCredentials: true
      });

      // Add AI response to conversation
      const aiResponse = response.data.response;
      setCurrentConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, {
          role: 'assistant' as const,
          content: aiResponse,
          timestamp: new Date()
        }]
      } : null);

      // Speak AI response if hands-free mode or call mode is enabled
      const shouldSpeakResponse = (handsFreeMode || currentConversation?.conversationMode === 'call') 
        && speakAIResponseRef.current 
        && aiResponse 
        && aiResponse.trim();
      
      if (shouldSpeakResponse) {
        // Prevent speaking the same message multiple times
        const lastMessage = currentConversation?.messages[currentConversation.messages.length - 1];
        if (!lastMessage || lastMessage.content !== aiResponse) {
          console.log('🎙️ Speaking AI response in', currentConversation?.conversationMode || 'chat', 'mode');
          console.log('🎤 AI Response type:', typeof aiResponse, 'Length:', aiResponse?.length);
          console.log('🎤 AI Response content:', aiResponse?.substring(0, 100));
          console.log('🎤 Callback exists:', !!speakAIResponseRef.current);
          
          if (speakAIResponseRef.current) {
            try {
              speakAIResponseRef.current(aiResponse);
              console.log('✅ TTS callback executed');
            } catch (error) {
              console.error('❌ TTS callback error:', error);
            }
          } else {
            console.error('❌ TTS callback is null!');
          }
        } else {
          console.log('⚠️ Skipping duplicate AI response');
        }
      } else {
        console.log('⚠️ Not speaking AI response. Conditions:', {
          handsFreeMode,
          callMode: currentConversation?.conversationMode === 'call',
          hasCallback: !!speakAIResponseRef.current,
          hasResponse: !!aiResponse,
          responseNotEmpty: !!aiResponse?.trim()
        });
      }

      // No need to refresh conversation history after each message
      // The current conversation is already updated with the new message
    } catch (error: any) {
      console.error('❌ [CLIENT] Send message error:', error);
      console.error('❌ [CLIENT] Error response:', error.response?.data);
      
      const message = error.response?.data?.error || t('failedToSendMessage');
      const details = error.response?.data?.details;
      const errorType = error.response?.data?.type;
      
      if (details) {
        console.error('❌ [CLIENT] Error details:', details);
        toast.error(`${message}: ${details}`);
      } else {
        toast.error(message);
      }
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle voice commands
  const handleVoiceCommand = (command: string) => {
    switch (command) {
      case 'send':
        handleSendMessage();
        break;
      case 'clear':
        setNewMessage('');
        break;
      case 'new':
        setShowNewChatForm(true);
        break;
      case 'end':
        handleEndConversation();
        break;
      case 'help':
        toast.success('Voice commands: Send message, Clear text, New conversation, End conversation');
        break;
      default:
        break;
    }
  };

  const handleCloseChatWindow = async () => {
    if (!currentConversation || endingConversation) return;
    
    setEndingConversation(true);
    try {
      // End the conversation and generate AI ratings (same as "End Conversation" button)
      await axios.post(`${API_BASE_URL}/api/ai/conversation/${currentConversation.id}/end`, {}, {
        withCredentials: true
      });
      
      // Close the chat window
      setCurrentConversation(null);
      
      // Refresh usage status to show updated usage
      refreshUsageStatus();
      // Manually refresh conversation history to get AI ratings
      const refreshHistory = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/ai/conversations`, {
            withCredentials: true
          });
          const conversations = (response.data.conversations || []).map((conv: any) => ({
            ...conv,
            id: conv._id || conv.id
          }));
          setConversationHistory(conversations);
        } catch (error: any) {
          console.error('Failed to refresh conversation history:', error);
        }
      };
      refreshHistory();
    } catch (error: any) {
      console.error('Failed to end conversation:', error);
      // Still close the window even if end fails
      setCurrentConversation(null);
    } finally {
      setEndingConversation(false);
    }
  };

  const handleEndConversation = async () => {
    if (!currentConversation || endingConversation) return;
    
    // Check usage before ending conversation
    if (usageStatus && usageStatus.monthlyLimit > 0 && usageStatus.currentUsage >= usageStatus.monthlyLimit) {
      toast.error('You have reached your monthly conversation limit. Please upgrade your plan to continue.');
      navigate('/pricing');
      return;
    }
    
    setEndingConversation(true);
    try {
      await axios.post(`${API_BASE_URL}/api/ai/conversation/${currentConversation.id}/end`, {}, {
        withCredentials: true
      });
      toast.success(t('conversationEnded'));
      
      // Close the chat window by setting currentConversation to null
      setCurrentConversation(null);
      
      // Refresh usage status
      refreshUsageStatus();
      // Manually refresh conversation history to get AI ratings
      const refreshHistory = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/ai/conversations`, {
            withCredentials: true
          });
          const conversations = (response.data.conversations || []).map((conv: any) => ({
            ...conv,
            id: conv._id || conv.id
          }));
          setConversationHistory(conversations);
        } catch (error: any) {
          console.error('Failed to refresh conversation history:', error);
        }
      };
      refreshHistory();
      
    } catch (error: any) {
      const message = error.response?.data?.error || t('failedToEndConversation');
      toast.error(message);
    } finally {
      setEndingConversation(false);
    }
  };

  const handleViewConversation = async (conversationId: string) => {
    if (!conversationId || conversationId === 'undefined') {
      toast.error(t('invalidConversationId'));
      return;
    }
    
    // Check usage before viewing conversation
    if (usageStatus && usageStatus.monthlyLimit > 0 && usageStatus.currentUsage >= usageStatus.monthlyLimit) {
      toast.error('You have reached your monthly conversation limit. Please upgrade your plan to continue.');
      navigate('/pricing');
      return;
    }
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/ai/conversation/${conversationId}`, {
        withCredentials: true
      });
      // Map _id to id for frontend compatibility
      const conversation = {
        ...response.data.conversation,
        id: response.data.conversation._id || response.data.conversation.id
      };
      setSelectedConversation(conversation);
      setShowConversationDetail(true);
      
      // Refresh usage status after viewing conversation
      refreshUsageStatus();
    } catch (error: any) {
      console.error('Failed to load conversation details:', error);
      toast.error(t('failedToLoadConversationDetails'));
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '🟢';
      case 'medium': return '🟡';
      case 'hard': return '🔴';
      default: return '⚪';
    }
  };

  const calculateTotalPoints = (aiRatings: Conversation['aiRatings']) => {
    if (!aiRatings || typeof aiRatings !== 'object') return 0;
    try {
      // Only include the actual phase ratings, exclude metadata fields
      const validPhases = ['introduction', 'mapping', 'productPresentation', 'objectionHandling', 'close'];
      return Object.entries(aiRatings)
        .filter(([phase, rating]) => validPhases.includes(phase) && typeof rating === 'number')
        .reduce((sum, [phase, rating]) => sum + rating, 0);
    } catch (error) {
      console.error('Error calculating total points:', error);
      return 0;
    }
  };

  const getRatingColor = (rating: number) => {
    if (typeof rating !== 'number' || isNaN(rating)) return 'text-gray-600';
    if (rating >= 8) return 'text-green-600';
    if (rating >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriceSensitivityTranslation = (sensitivity: string) => {
    switch (sensitivity) {
      case 'very_high': return t('veryHigh');
      case 'high': return t('high');
      case 'medium': return t('medium');
      case 'low': return t('low');
      case 'very_low': return t('veryLow');
      case 'none': return t('none');
      default: return sensitivity;
    }
  };

  const getFamilyTypeTranslation = (familyType: string) => {
    return t(familyType) || familyType;
  };

  const getContentInterestTranslation = (contentInterest: string) => {
    return t(contentInterest) || contentInterest;
  };

  const getDifficultyPhaseColor = (phase: string) => {
    switch (phase) {
      case 'easy_flow': return 'bg-green-100 text-green-800';
      case 'moderate_resistance': return 'bg-yellow-100 text-yellow-800';
      case 'challenging_moments': return 'bg-orange-100 text-orange-800';
      case 'difficult_throughout': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyPhaseTranslation = (phase: string) => {
    switch (phase) {
      case 'easy_flow': return 'Easy Flow';
      case 'moderate_resistance': return 'Moderate Resistance';
      case 'challenging_moments': return 'Challenging Moments';
      case 'difficult_throughout': return 'Difficult Throughout';
      default: return phase;
    }
  };

  const getChallengingPhaseTranslation = (phase: string) => {
    switch (phase) {
      case 'needs_assessment': return 'Needs Assessment';
      case 'objection_handling': return 'Objection Handling';
      case 'closing': return 'Closing';
      case 'price_discussion': return 'Price Discussion';
      case 'timeline_pressure': return 'Timeline Pressure';
      default: return phase;
    }
  };

  const translateStageName = (stage: string) => {
    const stageTranslations = {
      'introduction': t('opening'),
      'mapping': t('discovery'),
      'productPresentation': t('presentation'),
      'objectionHandling': t('objectionHandling'),
      'close': t('closing')
    };
    return stageTranslations[stage as keyof typeof stageTranslations] || stage;
  };


  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{t('conversations')}</h1>
          <div className="rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-6 text-gray-600 dark:text-gray-300 text-center">
            {t('pleaseLogIn')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <div className="flex min-h-screen">
        {/* AI Tips Sidebar */}
        <AITips 
          isOpen={showAITips}
          onToggle={() => {
            console.log('AITips onToggle called, current state:', showAITips);
            setShowAITips(!showAITips);
          }}
          isMinimized={aiTipsMinimized}
          onToggleMinimize={() => setAiTipsMinimized(!aiTipsMinimized)}
        />
        
        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${showAITips && !aiTipsMinimized ? 'ml-80' : showAITips && aiTipsMinimized ? 'ml-12' : 'ml-0'}`}>
          <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('conversations')}</h1>
          {/* Usage Status in Header */}
          {usageStatus && usageStatus.monthlyLimit > 0 && (
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                usageStatus.usagePercentage >= 90 ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                usageStatus.usagePercentage >= 75 ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' :
                'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
              }`}>
                {usageStatus.usagePercentage}% used
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              console.log('AI Tips button clicked, current state:', showAITips);
              setShowAITips(!showAITips);
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              showAITips 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
            }`}
          >
            <Lightbulb className="w-5 h-5" />
            {t('aiTips') || 'AI Tips'}
          </button>
          <button
            onClick={() => {
              setConversationMode('chat');
              setShowNewChatForm(true);
            }}
            className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 px-6 py-3 rounded-lg transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            {t('startChat')}
          </button>
          <button
            onClick={() => {
              setConversationMode('call');
              setShowNewChatForm(true);
            }}
            className="bg-green-600 text-white hover:bg-green-700 flex items-center gap-2 px-6 py-3 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {t('startCall')}
          </button>
        </div>
      </div>

      {/* Usage Warning Banner */}
      {usageStatus && usageStatus.monthlyLimit > 0 && usageStatus.usagePercentage >= 80 && (
        <div className={`mb-6 p-4 rounded-lg border ${
          usageStatus.usagePercentage >= 90 ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`text-lg ${
                usageStatus.usagePercentage >= 90 ? 'text-red-600' : 'text-orange-600'
              }`}>
                {usageStatus.usagePercentage >= 90 ? '⚠️' : '⚠️'}
              </span>
              <div>
                <p className={`font-medium ${
                  usageStatus.usagePercentage >= 90 ? 'text-red-800' : 'text-orange-800'
                }`}>
                  {usageStatus.usagePercentage >= 90 
                    ? 'You have reached your monthly conversation limit!' 
                    : 'You are approaching your monthly conversation limit'
                  }
                </p>
                <p className={`text-sm ${
                  usageStatus.usagePercentage >= 90 ? 'text-red-700' : 'text-orange-700'
                }`}>
                  {usageStatus.usagePercentage >= 90 
                    ? 'Upgrade your plan to continue practicing with AI clients.'
                    : `You have ${usageStatus.remaining} conversations remaining this month.`
                  }
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/pricing')}
              className={`px-4 py-2 rounded-lg font-medium text-sm ${
                usageStatus.usagePercentage >= 90 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
            >
              {usageStatus.usagePercentage >= 90 ? 'Upgrade Now' : 'View Plans'}
            </button>
          </div>
        </div>
      )}

      {/* New Chat Form Modal */}
      {showNewChatForm && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-dark-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-[10000]">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {conversationMode === 'call' ? t('startNewCall') : t('startNewConversation')}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    conversationMode === 'call' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {conversationMode === 'call' ? '📞 ' + t('voiceCall') : '💬 ' + t('textChat')}
                  </span>
                </div>
                <button
                  onClick={() => setShowNewChatForm(false)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {conversationMode === 'call' && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-green-900 dark:text-green-300 mb-1">
                          {t('callModeActive')}
                        </h3>
                        <p className="text-sm text-green-700 dark:text-green-400">
                          {t('callModeDescription')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="text-center">
                  {conversationMode === 'call' ? (
                    <svg className="w-12 h-12 text-green-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  ) : (
                    <MessageSquare className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  )}
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {t('customizeClientDescription')}
                  </p>
                  
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      {t('clientName')} <span className="text-gray-400 dark:text-gray-500">({t('optional')})</span>
                    </label>
                    <input
                      type="text"
                      value={clientCustomization.name}
                      onChange={(e) => setClientCustomization(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Sarah Johnson"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <MessageSquare className="w-4 h-4 inline mr-2" />
                      {t('scenario')}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        { value: 'general', label: t('general'), description: t('generalDescription') },
                        { value: 'cold_call', label: t('coldCall'), description: t('coldCallDescription') },
                        { value: 'lead_call', label: t('leadCall'), description: t('leadCallDescription') },
                        { value: 'objection_handling', label: t('objectionHandling'), description: t('objectionHandlingDescription') }
                      ] as const).map((scenario) => (
                        <button
                          key={scenario.value}
                          type="button"
                          onClick={() => setClientCustomization(prev => ({ ...prev, scenario: scenario.value }))}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            clientCustomization.scenario === scenario.value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'border-gray-200 dark:border-dark-600 hover:border-gray-300 dark:hover:border-dark-500 bg-white dark:bg-dark-700'
                          }`}
                        >
                          <div className="font-medium text-gray-900 dark:text-white">{scenario.label}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {scenario.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('clientPersonality')} <span className="text-gray-400">({t('optional')})</span>
                    </label>
                    <input
                      type="text"
                      value={clientCustomization.personality}
                      onChange={(e) => setClientCustomization(prev => ({ ...prev, personality: e.target.value }))}
                      placeholder={t('examplePersonality')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Building className="w-4 h-4 inline mr-2" />
                      {t('clientIndustry')} <span className="text-gray-400">({t('optional')})</span>
                    </label>
                    <input
                      type="text"
                      value={clientCustomization.industry}
                      onChange={(e) => setClientCustomization(prev => ({ ...prev, industry: e.target.value }))}
                      placeholder={t('exampleIndustry')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Briefcase className="w-4 h-4 inline mr-2" />
                      {t('clientRole')} <span className="text-gray-400">({t('optional')})</span>
                    </label>
                    <input
                      type="text"
                      value={clientCustomization.role}
                      onChange={(e) => setClientCustomization(prev => ({ ...prev, role: e.target.value }))}
                      placeholder={t('exampleRole')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Star className="w-4 h-4 inline mr-2" />
                      {t('difficulty')}
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['easy', 'medium', 'hard'] as const).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setClientCustomization(prev => ({ ...prev, difficulty: level }))}
                          className={`p-3 rounded-lg border-2 text-center transition-all ${
                            clientCustomization.difficulty === level
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'border-gray-200 dark:border-dark-600 hover:border-gray-300 dark:hover:border-dark-500 bg-white dark:bg-dark-800'
                          }`}
                        >
                          <div className="text-2xl mb-1">{getDifficultyIcon(level)}</div>
                          <div className="font-medium text-gray-900 dark:text-white">{t(level)}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {level === 'easy' && t('difficultyEasy')}
                            {level === 'medium' && t('difficultyMedium')}
                            {level === 'hard' && t('difficultyHard')}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Voice Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <MessageSquare className="w-4 h-4 inline mr-2" />
                      {t('voiceSelection')} <span className="text-gray-400">({t('optional')})</span>
                    </label>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <select
                          value={selectedVoiceLanguage}
                          onChange={(e) => {
                            const selectedLangCode = e.target.value;
                            
                            // Update the selected language state
                            setSelectedVoiceLanguage(selectedLangCode);
                            
                            // Handle default selection
                            if (selectedLangCode === 'random') {
                              setClientCustomization(prev => ({ ...prev, selectedVoice: null }));
                              console.log('🎲 Random voice mode selected');
                              return;
                            }
                            
                            // Find browser voices for the selected language
                            const browserVoicesForLang = voices.filter(voice => 
                              voice.lang.startsWith(selectedLangCode + '-') || voice.lang === selectedLangCode
                            );
                            
                            if (browserVoicesForLang.length > 0) {
                              // Select a random browser voice for the language
                              const randomIndex = Math.floor(Math.random() * browserVoicesForLang.length);
                              const randomBrowserVoice = browserVoicesForLang[randomIndex];
                              setClientCustomization(prev => ({ ...prev, selectedVoice: randomBrowserVoice }));
                              console.log(`🎲 Random browser voice selected for ${selectedLangCode}:`, randomBrowserVoice.name);
                            } else {
                              // No browser voices available - will use cloud TTS for supported languages
                              const cloudTtsLanguages = ['et', 'lv', 'lt', 'fi', 'no', 'da', 'is', 'ga'];
                              if (cloudTtsLanguages.includes(selectedLangCode)) {
                                console.log(`☁️ Cloud TTS will be used for ${selectedLangCode} (no downloads needed)`);
                              } else {
                                console.log(`🔊 Default voice will be used for ${selectedLangCode}`);
                              }
                              setClientCustomization(prev => ({ ...prev, selectedVoice: null }));
                            }
                          }}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <option value="random">🎲 {t('randomVoice')}</option>
                          {(() => {
                            // Show only language names, not individual voices
                            const supportedLanguages = [
                              { code: 'et', name: 'Estonian', flag: '🇪🇪' },
                              { code: 'en', name: 'English', flag: '🇺🇸' },
                              { code: 'ru', name: 'Russian', flag: '🇷🇺' },
                              { code: 'es', name: 'Spanish', flag: '🇪🇸' },
                              { code: 'de', name: 'German', flag: '🇩🇪' },
                              { code: 'fr', name: 'French', flag: '🇫🇷' },
                              { code: 'it', name: 'Italian', flag: '🇮🇹' },
                              { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
                              { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
                              { code: 'pl', name: 'Polish', flag: '🇵🇱' }
                            ];
                            
                            console.log(`🎯 Showing ${supportedLanguages.length} supported languages`);
                            console.log('🎲 Random voice selection will be automatic for each language');
                            
                            return supportedLanguages.map((lang) => {
                              const isCurrentLanguage = lang.code === language;
                              
                              return (
                                <option key={lang.code} value={lang.code}>
                                  {lang.flag} {lang.name}
                                  {isCurrentLanguage ? ' 🎯' : ''}
                                </option>
                              );
                            });
                          })()}
                        </select>
                        <button
                          type="button"
                          onClick={async () => {
                            const testText = "Hello, this is a test of the selected voice.";
                            const currentVolume = clientCustomization.ttsVolume || ttsVolume;
                            
                            // Get the test language based on selected language or browser voice
                            let testLanguage: string;
                            
                            if (selectedVoiceLanguage === 'random') {
                              // Use interface language
                              testLanguage = `${language}-${language.toUpperCase()}`;
                            } else {
                              // Use selected language
                              testLanguage = `${selectedVoiceLanguage}-${selectedVoiceLanguage.toUpperCase()}`;
                            }
                            
                            console.log(`🎤 Testing voice for language: ${testLanguage}`);
                            
                            // Use enhanced TTS service for realistic, cloud-based speech
                            try {
                              await enhancedTtsService.speak(testText, {
                                language: testLanguage,
                                voice: clientCustomization.selectedVoice?.name,
                                rate: 1.3,
                                pitch: 0.98,
                                volume: currentVolume,
                                addPauses: true,
                                speakingStyle: 'professional'
                              });
                              console.log(`✅ Voice test completed for ${testLanguage}`);
                            } catch (error) {
                              console.error('Voice test error:', error);
                              // Fallback to old test voice if enhanced fails
                              if (clientCustomization.selectedVoice) {
                                testVoice(testText, { 
                                  voice: clientCustomization.selectedVoice, 
                                  volume: currentVolume,
                                  language: clientCustomization.selectedVoice.lang
                                });
                              } else {
                                testVoice(testText, { 
                                  volume: currentVolume,
                                  language: testLanguage
                                });
                              }
                            }
                          }}
                          className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          {t('testVoice')}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('voiceSelectionDescription')}
                      </p>
                      
                      {/* Show available browser voices for selected language */}
                      {selectedVoiceLanguage !== 'random' && (() => {
                        const voiceLang = selectedVoiceLanguage;
                        const browserVoicesForLang = voices.filter(voice => 
                          voice.lang.startsWith(voiceLang + '-') || voice.lang === voiceLang
                        );
                        
                        if (browserVoicesForLang.length > 0) {
                          return (
                            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Available browser voices for {voiceLang?.toUpperCase()}:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {browserVoicesForLang.map((voice, index) => (
                                  <button
                                    key={index}
                                    onClick={() => {
                                      setClientCustomization(prev => ({ ...prev, selectedVoice: voice }));
                                      console.log(`🎯 Browser voice selected: ${voice.name}`);
                                    }}
                                    className={`px-2 py-1 text-xs rounded ${
                                      clientCustomization.selectedVoice?.name === voice.name
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                  >
                                    {voice.name} ({voice.lang})
                                  </button>
                                ))}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Click a voice to select it specifically. These are real browser voices that will work.
                              </p>
                            </div>
                          );
                        } else {
                          // Check if this language is supported by cloud TTS
                          const cloudTtsLanguages = ['et', 'lv', 'lt', 'fi', 'no', 'da', 'is', 'ga'];
                          const usesCloudTts = cloudTtsLanguages.includes(voiceLang || '');
                          
                          if (usesCloudTts) {
                            return (
                              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-1">
                                  <span>☁️</span>
                                  <span>Cloud Voice Enabled for {voiceLang?.toUpperCase()}</span>
                                </p>
                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                  ✅ This language uses cloud-based text-to-speech. No downloads required! The voice will work instantly for all users.
                                </p>
                              </div>
                            );
                          } else {
                            return (
                              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Default voice will be used for {voiceLang?.toUpperCase()}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  The system will use your browser's default voice for this language.
                                </p>
                              </div>
                            );
                          }
                        }
                      })()}
                    </div>
                  </div>

                  {/* Volume Control */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Volume2 className="w-4 h-4 inline mr-2" />
                      {t('volumeControl')} <span className="text-gray-400">({t('optional')})</span>
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <VolumeX className="w-4 h-4 text-gray-400" />
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={clientCustomization.ttsVolume || ttsVolume}
                          onChange={(e) => {
                            const newVolume = parseFloat(e.target.value);
                            setTtsVolume(newVolume);
                            setClientCustomization(prev => ({ ...prev, ttsVolume: newVolume }));
                          }}
                          className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <Volume2 className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[3rem] text-center">
                          {Math.round((clientCustomization.ttsVolume || ttsVolume) * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('volumeControlDescription')}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <FileText className="w-4 h-4 inline mr-2" />
                      {t('customPrompt')} <span className="text-gray-400">({t('optional')})</span>
                    </label>
                    <textarea
                      value={clientCustomization.customPrompt}
                      onChange={(e) => setClientCustomization(prev => ({ ...prev, customPrompt: e.target.value }))}
                      placeholder={t('examplePrompt')}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleUseDefaultClient}
                    disabled={loading}
                    className="flex-1 btn-secondary py-3 disabled:opacity-50"
                  >
                    {t('useDefaultClient')}
                  </button>
                  <button
                    onClick={handleStartConversation}
                    disabled={loading}
                    className={`flex-1 py-3 disabled:opacity-50 rounded-lg font-medium transition-colors ${
                      conversationMode === 'call'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {loading 
                      ? t('starting') 
                      : conversationMode === 'call' 
                        ? `📞 ${t('startCall')}` 
                        : t('startChat')
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat/Call Window */}
      {currentConversation && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className={`rounded-xl w-full flex flex-col relative z-[10000] ${
            currentConversation.conversationMode === 'call'
              ? 'bg-gradient-to-br from-green-600 to-green-800 max-w-lg h-auto' // Call mode: compact, gradient
              : 'bg-white dark:bg-gray-800 max-w-4xl h-[80vh]' // Chat mode: full size
          }`}>
            {/* Header - Different for Call vs Chat */}
            {currentConversation.conversationMode === 'call' ? (
              /* Call Mode Header - Minimal, voice-focused */
              <div className="p-8 text-center text-white">
                <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full mx-auto mb-4 flex items-center justify-center backdrop-blur-sm">
                  <User className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  {currentConversation.clientCustomization.name || t('client')}
                </h2>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm backdrop-blur-sm">
                    {currentConversation.clientCustomization.industry || t('client')}
                  </span>
                  <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm backdrop-blur-sm">
                    {getDifficultyIcon(currentConversation.clientCustomization.difficulty)} {t(currentConversation.clientCustomization.difficulty)}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <div className="flex items-center gap-1 animate-pulse">
                    <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                    <span className="text-green-100">{language === 'et' ? 'KÕNE KÄIMAS' : 'CALL IN PROGRESS'}</span>
                  </div>
                </div>
                <button
                  onClick={handleEndConversation}
                  disabled={endingConversation}
                  className="mt-6 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                  {endingConversation ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {t('ending')}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.27 11.36 11.36 0 005.22 1.26 1 1 0 011 1v3.37a1 1 0 01-1 1A16.93 16.93 0 013 4.03a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 001.26 5.22 1 1 0 01-.27 1.11l-2.2 2.2z" />
                      </svg>
                      {t('endConversation')}
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Chat Mode Header - Traditional */
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {t('chatWith')} {currentConversation.clientCustomization.name || t('client')}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentConversation.clientCustomization.difficulty)}`}>
                        {getDifficultyIcon(currentConversation.clientCustomization.difficulty)} {t(currentConversation.clientCustomization.difficulty)}
                      </span>
                      {currentConversation.clientCustomization.industry && (
                        <span>• {t(currentConversation.clientCustomization.industry) || currentConversation.clientCustomization.industry}</span>
                      )}
                      {currentConversation.clientCustomization.role && (
                        <span>• {currentConversation.clientCustomization.role}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleEndConversation}
                    disabled={endingConversation}
                    className="btn-secondary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {endingConversation ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                        {t('ending')}
                      </>
                    ) : (
                      t('endConversation')
                    )}
                  </button>
                  <button
                    onClick={handleCloseChatWindow}
                    disabled={endingConversation}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            )}

            {/* Enhanced Client Profile Section - Only for Lead Calls */}
            {currentConversation.scenario === 'lead_call' ? (
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              {/* Basic Info Row */}
              <div className="flex flex-wrap gap-3 text-sm mb-3">
                {currentConversation.clientCustomization.familySize && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    👨‍👩‍👧‍👦 {currentConversation.clientCustomization.familySize} {t('familyMembers')}
                  </span>
                )}
                {currentConversation.clientCustomization.incomeRange && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    💰 {currentConversation.clientCustomization.incomeRange}
                  </span>
                )}
                {currentConversation.clientCustomization.priceSensitivity && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                    💸 {getPriceSensitivityTranslation(currentConversation.clientCustomization.priceSensitivity)} {t('priceSensitivity')}
                  </span>
                )}
                {currentConversation.clientCustomization.difficultyPhase && (
                  <span className={`px-2 py-1 rounded-full ${getDifficultyPhaseColor(currentConversation.clientCustomization.difficultyPhase)}`}>
                    ⚠️ {getDifficultyPhaseTranslation(currentConversation.clientCustomization.difficultyPhase)}
                    {currentConversation.clientCustomization.challengingPhase && currentConversation.clientCustomization.difficultyPhase === 'challenging_moments' && (
                      <span className="ml-1">({getChallengingPhaseTranslation(currentConversation.clientCustomization.challengingPhase)})</span>
                    )}
                  </span>
                )}
              </div>

              {/* Emotional Profile Section */}
              {currentConversation.clientCustomization.emotionalProfile && (
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">🧠 Emotional Profile</h4>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                      {currentConversation.clientCustomization.emotionalProfile.name}
                    </span>
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
                      {currentConversation.clientCustomization.emotionalProfile.buyingMotivation.replace('_', ' ')}
                    </span>
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full">
                      {currentConversation.clientCustomization.emotionalProfile.resistanceLevel} resistance
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <div><strong>Primary Needs:</strong> {currentConversation.clientCustomization.emotionalProfile.primaryNeeds.join(', ')}</div>
                    <div><strong>Pain Points:</strong> {currentConversation.clientCustomization.emotionalProfile.painPoints.join(', ')}</div>
                    <div><strong>Emotional Triggers:</strong> {currentConversation.clientCustomization.emotionalProfile.emotionalTriggers.join(', ')}</div>
                  </div>
                </div>
              )}

              {/* Current Emotional State */}
              {currentConversation.clientCustomization.emotionalState && (
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">😊 Current State</h4>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full">
                      {currentConversation.clientCustomization.emotionalState.current}
                    </span>
                    <span className="px-2 py-1 bg-teal-100 text-teal-800 rounded-full">
                      Trust: {(currentConversation.clientCustomization.emotionalState.trustLevel * 100).toFixed(0)}%
                    </span>
                    <span className="px-2 py-1 bg-cyan-100 text-cyan-800 rounded-full">
                      Urgency: {(currentConversation.clientCustomization.emotionalState.buyingUrgency * 100).toFixed(0)}%
                    </span>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                      Responsive: {(currentConversation.clientCustomization.emotionalState.responsiveness * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Buying Progression */}
              {currentConversation.clientCustomization.buyingProgression && (
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">📈 Buying Stage</h4>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {currentConversation.clientCustomization.buyingProgression.name.toUpperCase()}
                    </span>
                    <div className="flex-1">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Interest vs Resistance</div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <div className="text-xs text-green-600 dark:text-green-400">Interest</div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{width: `${currentConversation.clientCustomization.buyingProgression.interest * 100}%`}}
                            ></div>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-red-600 dark:text-red-400">Resistance</div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full" 
                              style={{width: `${currentConversation.clientCustomization.buyingProgression.resistance * 100}%`}}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pain Points */}
              {currentConversation.clientCustomization.painPoints && currentConversation.clientCustomization.painPoints.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">🎯 Active Pain Points</h4>
                  <div className="space-y-2">
                    {currentConversation.clientCustomization.painPoints.map((category, index) => (
                      <div key={index} className="text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{category.category}</span>
                          <span className="text-gray-500">{(category.intensity * 100).toFixed(0)}% intensity</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {category.points.map((point, pointIndex) => (
                            <span key={pointIndex} className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                              {point.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Personality Traits & Quirks */}
              {(currentConversation.clientCustomization.personalityTraits || 
                currentConversation.clientCustomization.microTraits || 
                currentConversation.clientCustomization.randomAddOns) && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">🎭 Personality & Quirks</h4>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {currentConversation.clientCustomization.personalityTraits?.map((trait, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                        {trait.replace('_', ' ')}
                      </span>
                    ))}
                    {currentConversation.clientCustomization.microTraits?.map((trait, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        {trait.replace('_', ' ')}
                      </span>
                    ))}
                    {currentConversation.clientCustomization.randomAddOns && currentConversation.clientCustomization.randomAddOns !== 'no_addon' && (
                      <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded-full">
                        {currentConversation.clientCustomization.randomAddOns.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>
              )}
              </div>
            ) : null}

            {/* Messages */}
            {/* Messages - Different for Call vs Chat */}
            {currentConversation.conversationMode === 'call' ? (
              /* Call Mode - Minimal voice-focused display */
              <div className="flex-1 p-8 flex flex-col items-center justify-center text-white min-h-[300px]">
                <div className="text-center w-full max-w-md">
                  <div className="bg-white bg-opacity-10 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="text-6xl mb-4">🎙️</div>
                    <p className="text-lg font-medium mb-2">
                      {language === 'et' ? 'Räägi vabalt' : language === 'es' ? 'Habla libremente' : language === 'ru' ? 'Говорите свободно' : 'Speak freely'}
                    </p>
                    <p className="text-sm text-green-100 opacity-90">
                      {language === 'et' 
                        ? 'Klient kuulab sind ja vastab' 
                        : language === 'es'
                        ? 'Cliente te escucha y responderá'
                        : language === 'ru'
                        ? 'Клиент слушает вас и ответит'
                        : 'Client is listening and will respond'
                      }
                    </p>
                    {currentConversation.messages.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white border-opacity-20">
                        <p className="text-xs text-green-100">
                          {currentConversation.messages.filter(m => m.role === 'user').length} {language === 'et' ? 'sõnumit vahetatud' : 'messages exchanged'}
                        </p>
                      </div>
                    )}
                    {/* Show thinking indicator inline without changing layout */}
                    {sendingMessage && (
                      <div className="mt-4 inline-flex items-center gap-2 bg-white bg-opacity-15 px-3 py-2 rounded-full animate-pulse">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs">
                          {language === 'et' ? 'Mõtleb...' : language === 'es' ? 'Pensando...' : language === 'ru' ? 'Думает...' : 'Thinking...'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Chat Mode - Traditional message list */
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentConversation.messages.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p>{t('startConversationIntro')}</p>
                  </div>
                ) : (
                  currentConversation.messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))
                )}
                {sendingMessage && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <div className="animate-spin w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-gray-600 dark:border-t-gray-400 rounded-full"></div>
                        {t('loading')}...
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Message Input - Only show for chat mode, call mode is voice-only */}
            {currentConversation.conversationMode !== 'call' && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                {speechEnabled && currentConversation ? (
                <SpeechInput
                  onSendMessage={handleSendMessage}
                  disabled={sendingMessage}
                  placeholder={t('typeMessage')}
                  language={(() => {
                    // Use selected voice language if available, otherwise use interface language
                    const savedVoice = currentConversation?.clientCustomization?.selectedVoice;
                    if (savedVoice?.lang) {
                      return savedVoice.lang; // e.g., 'et-EE', 'en-US'
                    }
                    // If selectedVoiceLanguage is set (not 'random'), use it
                    if (selectedVoiceLanguage && selectedVoiceLanguage !== 'random') {
                      return `${selectedVoiceLanguage}-${selectedVoiceLanguage.toUpperCase()}`; // e.g., 'et-ET', 'en-EN'
                    }
                    // Default to interface language
                    return language === 'en' ? 'en-US' : language === 'et' ? 'et-EE' : language === 'es' ? 'es-ES' : language === 'ru' ? 'ru-RU' : 'en-US';
                  })()}
                  handsFreeMode={handsFreeMode}
                  autoSendDelay={1000}
                  onAIResponse={(callback) => {
                    speakAIResponseRef.current = callback;
                  }}
                  selectedVoice={(() => {
                    const savedVoice = currentConversation?.clientCustomization?.selectedVoice;
                    const reconstructedVoice = reconstructVoice(savedVoice);
                    return reconstructedVoice;
                  })()}
                  ttsVolume={(() => {
                    const volume = currentConversation?.clientCustomization?.ttsVolume || 0.7;
                    return volume;
                  })()}
                />
              ) : (
                <div className="flex gap-3">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t('typeMessage')}
                    rows={2}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-500 dark:placeholder-gray-400"
                    disabled={sendingMessage}
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!newMessage.trim() || sendingMessage}
                    className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {t('sendMessage')}
                  </button>
                </div>
              )}
              
              {/* Speech Controls - Only show for chat mode, call mode has it built-in */}
              {currentConversation?.conversationMode !== 'call' && (
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <input
                        type="checkbox"
                        checked={speechEnabled}
                        onChange={(e) => setSpeechEnabled(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      {t('enableVoiceInput')}
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <input
                        type="checkbox"
                        checked={voiceCommandsEnabled}
                        onChange={(e) => setVoiceCommandsEnabled(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      {t('voiceCommands')}
                    </label>
                  </div>
                </div>
              )}
              
              {/* Call Mode Indicator - Show in call mode */}
              {currentConversation?.conversationMode === 'call' && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      {language === 'et' ? '📞 Kõnerežiim Aktiivne - Vabakäe režiim sisse lülitatud' : '📞 Call Mode Active - Hands-free enabled'}
                    </span>
                  </div>
                </div>
              )}
                
                {voiceCommandsEnabled && speechEnabled && currentConversation && currentConversation.messages.filter(msg => msg.role === 'user').length >= 2 && currentConversation.conversationMode !== 'call' && (
                  <VoiceCommands
                    isListening={false} // This will be managed by SpeechInput
                    onCommand={handleVoiceCommand}
                    className="relative"
                  />
                )}
              </div>
            )}
            
            {/* Call Mode - Hidden Voice Input (works in background) */}
            {currentConversation.conversationMode === 'call' && (
              <div className="hidden">
                <SpeechInput
                  onSendMessage={handleSendMessage}
                  disabled={sendingMessage}
                  placeholder=""
                  language={(() => {
                    // Use selected voice language if available, otherwise use interface language
                    const savedVoice = currentConversation?.clientCustomization?.selectedVoice;
                    if (savedVoice?.lang) {
                      return savedVoice.lang; // e.g., 'et-EE', 'en-US'
                    }
                    // If selectedVoiceLanguage is set (not 'random'), use it
                    if (selectedVoiceLanguage && selectedVoiceLanguage !== 'random') {
                      return `${selectedVoiceLanguage}-${selectedVoiceLanguage.toUpperCase()}`; // e.g., 'et-ET', 'en-EN'
                    }
                    // Default to interface language
                    return language === 'en' ? 'en-US' : language === 'et' ? 'et-EE' : language === 'es' ? 'es-ES' : language === 'ru' ? 'ru-RU' : 'en-US';
                  })()}
                  handsFreeMode={true}
                  autoSendDelay={1000}
                  onAIResponse={(callback) => {
                    speakAIResponseRef.current = callback;
                  }}
                  selectedVoice={(() => {
                    const savedVoice = currentConversation?.clientCustomization?.selectedVoice;
                    return reconstructVoice(savedVoice);
                  })()}
                  ttsVolume={currentConversation?.clientCustomization?.ttsVolume || ttsVolume}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Conversations List */}
      <div className="space-y-4">
        {loadingHistory ? (
          <div className="rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-8 text-center text-gray-600 dark:text-gray-300">
            <div className="animate-spin w-8 h-8 border-2 border-gray-300 dark:border-dark-600 border-t-blue-600 rounded-full mx-auto mb-4"></div>
            <p>Loading conversation history...</p>
          </div>
        ) : conversationHistory.length === 0 ? (
          <div className="rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-8 text-center text-gray-600 dark:text-gray-300">
            <MessageSquare className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">{t('noConversationsYet')}</h3>
            <p className="mb-4">{t('startFirstConversationDescription')}</p>
            <button
              onClick={() => setShowNewChatForm(true)}
              className="btn-primary"
            >
              {t('startNewConversation')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4">
              {currentConversations.map((conversation) => (
              <div
                key={conversation.id}
                className="rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleViewConversation(conversation.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{conversation.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(conversation.clientCustomization?.difficulty || 'medium')}`}>
                        {getDifficultyIcon(conversation.clientCustomization?.difficulty || 'medium')} {t(conversation.clientCustomization?.difficulty || 'medium')}
                      </span>
                      {conversation.clientCustomization?.industry && (
                        <span>• {conversation.clientCustomization.industry}</span>
                      )}
                      {conversation.duration && (
                        <span>• {Math.floor(conversation.duration / 60)}m {conversation.duration % 60}s</span>
                      )}
                    </div>
                    
                    {/* Client Profile Tags */}
                    {(conversation.clientCustomization?.familySize || 
                      conversation.clientCustomization?.incomeRange || 
                      conversation.clientCustomization?.priceSensitivity ||
                      conversation.clientCustomization?.contentInterest ||
                      conversation.clientCustomization?.familyType ||
                      conversation.clientCustomization?.difficultyPhase) && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {conversation.clientCustomization?.familySize && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            👨‍👩‍👧‍👦 {conversation.clientCustomization.familySize}
                          </span>
                        )}
                        {conversation.clientCustomization?.incomeRange && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            💰 {conversation.clientCustomization.incomeRange}
                          </span>
                        )}
                        {conversation.clientCustomization?.priceSensitivity && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                            💸 {getPriceSensitivityTranslation(conversation.clientCustomization.priceSensitivity)}
                          </span>
                        )}
                        {conversation.clientCustomization?.contentInterest && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                            📺 {getContentInterestTranslation(conversation.clientCustomization.contentInterest)}
                          </span>
                        )}
                        {conversation.clientCustomization?.familyType && (
                          <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded-full text-xs">
                            🏠 {getFamilyTypeTranslation(conversation.clientCustomization.familyType)}
                          </span>
                        )}
                        {conversation.clientCustomization?.difficultyPhase && (
                          <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyPhaseColor(conversation.clientCustomization.difficultyPhase)}`}>
                            ⚠️ {getDifficultyPhaseTranslation(conversation.clientCustomization.difficultyPhase)}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {conversation.aiRatings && (
                      <div className="mb-3">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-medium text-gray-700 dark:text-white">
                            {t('totalScore')}: <span className="text-lg font-bold text-blue-600 dark:text-blue-300">{calculateTotalPoints(conversation.aiRatings)}/50</span>
                          </span>
                          <div className="flex gap-2">
                        {conversation.aiRatings && Object.entries(conversation.aiRatings)
                          .filter(([phase, rating]) => {
                            const validPhases = ['introduction', 'mapping', 'productPresentation', 'objectionHandling', 'close'];
                            return validPhases.includes(phase) && typeof rating === 'number';
                          })
                          .map(([phase, rating]) => (
                            <span key={phase} className={`px-2 py-1 rounded text-xs font-medium ${getRatingColor(rating)}`}>
                              {translateStageName(phase)}: {rating}/10
                            </span>
                          ))}
                          </div>
                        </div>
                        {conversation.aiRatingFeedback && (
                          <ConversationAIFeedback
                            feedback={conversation.aiRatingFeedback}
                            language={language}
                            conversationIndex={conversationHistory.findIndex(conv => conv.id === conversation.id)}
                            totalConversations={conversationHistory.length}
                            className="mt-2"
                          />
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right text-sm text-gray-500">
                    {conversation.createdAt && (
                      <div>{new Date(conversation.createdAt).toLocaleDateString()}</div>
                    )}
                    <div className="text-xs">{conversation.messages?.length || 0} messages</div>
                  </div>
                </div>
              </div>
            ))}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Conversation Detail Modal */}
      {showConversationDetail && selectedConversation && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-dark-800 rounded-xl max-w-4xl w-full h-[90vh] flex flex-col relative z-[10000]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('conversationDetails')}</h2>
              <button
                onClick={() => {
                  setShowConversationDetail(false);
                  setSelectedConversation(null);
                }}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Summary Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('conversationSummary')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{t('title')}:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{selectedConversation.title}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{t('scenario')}:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{selectedConversation.scenario}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{t('difficulty')}:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(selectedConversation.clientCustomization?.difficulty || 'medium')}`}>
                        {getDifficultyIcon(selectedConversation.clientCustomization?.difficulty || 'medium')} {t(selectedConversation.clientCustomization?.difficulty || 'medium')}
                      </span>
                    </div>
                    {selectedConversation.duration && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{t('duration')}:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">{Math.floor(selectedConversation.duration / 60)}m {selectedConversation.duration % 60}s</span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{t('messages')}:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{selectedConversation.messages?.length || 0}</span>
                    </div>
                  </div>

                  {selectedConversation.aiRatings && (
                    <div className="space-y-3">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-white">{t('totalScore')}:</span>
                        <span className="ml-2 text-2xl font-bold text-blue-600 dark:text-blue-300">{calculateTotalPoints(selectedConversation.aiRatings)}/50</span>
                      </div>
                      <div className="space-y-2">
                        {selectedConversation.aiRatings && Object.entries(selectedConversation.aiRatings)
                          .filter(([phase, rating]) => {
                            const validPhases = ['introduction', 'mapping', 'productPresentation', 'objectionHandling', 'close'];
                            return validPhases.includes(phase) && typeof rating === 'number';
                          })
                          .map(([phase, rating]) => (
                            <div key={phase} className="flex items-center justify-between">
                              <span className="font-medium text-gray-700 dark:text-gray-300">{translateStageName(phase)}:</span>
                              <span className={`text-lg font-semibold ${getRatingColor(rating)}`}>{rating}/10</span>
                            </div>
                          ))}
                      </div>
                      {selectedConversation.aiRatingFeedback && (
                        <div className="mt-4 p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{t('aiFeedback')}:</span>
                          <ConversationAIFeedback
                            feedback={selectedConversation.aiRatingFeedback}
                            language={language}
                            conversationIndex={conversationHistory.findIndex(conv => conv.id === selectedConversation.id)}
                            totalConversations={conversationHistory.length}
                            className="mt-1"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Messages Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('fullConversation')}</h3>
                <div className="space-y-4">
                  {selectedConversation.messages?.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <div className="text-xs opacity-70 mt-1">
                          {message.role === 'user' ? t('you') : t('client')} • {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Conversations;


