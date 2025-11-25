import React, { useState, useRef, useEffect } from 'react';
import { FaTimes, FaPaperPlane, FaRobot, FaSpinner } from 'react-icons/fa';
import { Button } from './ui/button';
import { useTranslation } from 'react-i18next';
import { API } from '../App';
import axios from 'axios';

const AIChatPopup = ({ 
  isOpen, 
  onClose, 
  endpoint, 
  title, 
  placeholder,
  initialMessage = '',
  onInsert = null, // Optional: callback when user wants to insert result
  showInsertButton = false // Show "Insert" button
}) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState(initialMessage);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && initialMessage) {
      setInput(initialMessage);
    }
  }, [isOpen, initialMessage]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await axios.post(`${API}${endpoint}`, {
        query: userMessage
      });

      const aiResponse = response.data.response || response.data.recipe;
      
      // Add AI response
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: typeof aiResponse === 'string' ? aiResponse : JSON.stringify(aiResponse, null, 2),
        data: aiResponse // Store raw data for insert functionality
      }]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { 
        role: 'error', 
        content: t('ai.error', 'Der opstod en fejl. Prøv igen.')
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInsert = () => {
    const lastAIMessage = messages.filter(m => m.role === 'assistant').pop();
    if (lastAIMessage && onInsert) {
      onInsert(lastAIMessage.data || lastAIMessage.content);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
          <div className="flex items-center space-x-2">
            <FaRobot className="text-2xl" />
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <FaRobot className="text-6xl mx-auto mb-4 text-blue-400" />
              <p>{t('ai.welcomeMessage', 'Stil mig et spørgsmål...')}</p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.role === 'error'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {message.content}
                </pre>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 p-3 rounded-lg">
                <FaSpinner className="animate-spin text-blue-500" />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-white rounded-b-lg">
          {showInsertButton && messages.some(m => m.role === 'assistant') && (
            <div className="mb-2">
              <Button
                onClick={handleInsert}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
              >
                {t('ai.insertResult', 'Indsæt resultat')}
              </Button>
            </div>
          )}
          
          <div className="flex space-x-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="flex-1 p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              disabled={loading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6"
            >
              <FaPaperPlane />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatPopup;
