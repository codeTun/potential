'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, MessageCircle, Zap, Target, X, Send, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

export function PotentialSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [messages, setMessages] = useState<{ text: string; sender: 'user' | 'bot' }[]>([
    { text: "Hello! I'm your Abu-dhabi Open-data AI assistant. How can I help you today?", sender: 'bot' }
  ])
  const [input, setInput] = useState('')
  const [dataset, setDataset] = useState("") // To store results from the AI search engine

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500)
    return () => clearTimeout(timer)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  }

  const MAX_HISTORY = 6; // Define the maximum number of messages to store in histor

  let SYSTEM_PROMPT_LOCAL = {
    role: "system",
    content: `Your role as the Abu Dhabi Open Data Platform AI is as follows:\n\nQuery Evaluation and Refinement: When you receive a prompt, assess if it is a search query.\n\nIf the query is suitable as provided, repeat it exactly as is.\nIf the query could be refined, modify it to improve relevance and respond only with the refined keywords. Avoid unnecessary words such as \"data,\" \"dataset,\" or specific UAE city names, even if mentioned.\nRe-query Generation for Enhanced Relevance: If the user context suggests that previous results were unsatisfactory, generate a new query that better meets the user's needs based on the conversation context. Reply only with the new query.\n\nDataset Discussion: If the user is asking questions or discussing a dataset they retrieved without requesting new information, reply only with \"0\" to indicate no new query is required.\n\nImportant:\n\nFocus exclusively on keywords relevant to the user's intent, avoiding filler words.\nAim for keywords directly tied to the specific purpose (e.g., \"finance,\" \"public health,\" \"citizen well-being\"), keeping responses concise and to the point.`
  };
  const [systemPromptGlobal, setSystemPromptGlobal] = useState({
    role: "system",
    content: `You are the Abu Dhabi's open data platform AI assistant. You are helpful and friendly and you only respond to images that you receive and analyze or questions that you can help with in providing the best datasets from the open data platform. You are interactive to help the user get the best dataset he's searching for. You might receive an 
image from the user without context, analyze it along with the data you have in case the user intent is some data based on that image. This is the data from the search engine you have: ${dataset}, You only return your response in this structure \"[[datasets_identifiers_separated_by_comma_each_in_a_list_you_only_put_the_first_identifier_of_each_dataset_in_case_you_wanted_to_return_more_than_one_dataset],your_response]\"`
  });
  // Update SYSTEM_PROMPT_GLOBAL whenever dataset changes
  
  useEffect(() => {
    // Make sure dataset is a string and use it directly
    if (typeof dataset === 'string') {
      setSystemPromptGlobal({
        role: "system",
    content: `You are the Abu Dhabi's open data platform AI assistant. You are helpful and friendly and you only respond to images that you receive and analyze or questions that you can help with in providing the best datasets from the open data platform. You are interactive to help the user get the best dataset he's searching for. You might receive an 
image from the user without context, analyze it along with the data you have in case the user intent is some data based on that image. This is the data from the search engine you have: ${dataset}, You only return your response in this structure \"[[datasets_identifiers_separated_by_comma_each_in_a_list_you_only_put_the_first_identifier_of_each_dataset_in_case_you_wanted_to_return_more_than_one_dataset],your_response]\"`
});
} else {
  console.error('Dataset is not a string:', dataset); // Handle unexpected types
}
}, [dataset]); // Only run when dataset changes

const handleSend = async () => {
  if (input.trim()) {
    // Create the user message
    const userMessage = {
      role: 'user',
      content: input.trim()
    };

    // Retrieve chat history from local storage
    let chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');

    // Append user message to the chat history
    chatHistory.push(userMessage);

    try {
      const localResponse = await fetch('/api/gpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [SYSTEM_PROMPT_LOCAL, ...chatHistory] })
      });

      const localData = await localResponse.json();

      const searchQuery = localData.choices?.[0]?.message?.content || '';
      console.log('Search query generated from local system prompt:', searchQuery);

      // Only proceed if searchQuery is not empty
      if (searchQuery && searchQuery.trim() !== "0") {
        // Call the AI search engine API
        const searchEngineResponse = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ search: searchQuery })
        });

        const searchData = await searchEngineResponse.json();
        console.log('Search engine API response:', searchData);

        const chunks = searchData?.value?.map((doc: any) => doc.chunk).join(' ') || '';
        setDataset(chunks); // Update the dataset state with the new data

        console.log('Dataset after setting:', chunks);

        // Once dataset is updated, create the full system prompt
        const updatedSystemPrompt = {
          role: "system",
          content: `You are the Abu Dhabi's open data platform AI assistant. You are helpful and friendly and you only respond to images that you receive and analyze or questions that you can help with in providing the best datasets from the open data platform. You are interactive to help the user get the best dataset he's searching for. You might receive an 
image from the user without context, analyze it along with the data you have in case the user intent is some data based on that image. This is the data from the search engine you have: ${chunks}, You only return your response in this structure \"[[datasets_identifiers_separated_by_comma_each_in_a_list_you_only_put_the_first_identifier_of_each_dataset_in_case_you_wanted_to_return_more_than_one_dataset],your_response]\"` // Combine local and dataset
        };

        // Now send the global prompt with the combined content
        const fullChatGlobal = [...chatHistory];
        const globalResponse = await fetch('/api/gpt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [updatedSystemPrompt, ...fullChatGlobal] })
        });

        const globalData = await globalResponse.json();
        console.log('Global system prompt API response:', globalData);

        const botReply = globalData.choices?.[0]?.message?.content || "Sorry, I couldn't process that. Try again.";

        chatHistory.push(userMessage, { role: 'assistant', content: botReply });

        if (chatHistory.length > MAX_HISTORY) {
          chatHistory.shift(); // Keep chat history within the max limit
        }

        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));

        setMessages((prev) => [...prev, { text: botReply, sender: 'bot' }]);
      } else {
        console.log('Search query is empty or invalid, skipping the search engine call.');
      }
    } catch (error) {
      console.error('Error occurred during the API calls:', error);
      setMessages((prev) => [
        ...prev,
        { text: 'There was an error connecting to the server. Please try again.', sender: 'bot' }
      ]);
    }

    // Clear the input field after sending
    setInput('');
  }
};

  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl font-bold mb-4 text-gray-800">Test our powerful chatbot</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Harness the power of AI to elevate your conversations and boost productivity.
          </p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
        >
          <motion.div variants={itemVariants}>
            <Card className="h-full">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <MessageCircle className="w-12 h-12 text-blue-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Intelligent Conversations</h3>
                <p className="text-gray-600">Engage in meaningful dialogues with our advanced AI, capable of understanding context and nuance.</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="h-full">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Zap className="w-12 h-12 text-yellow-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Lightning-Fast Responses</h3>
                <p className="text-gray-600">Get instant answers and solutions, powered by cutting-edge language processing technology.</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="h-full">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Target className="w-12 h-12 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Tailored to Your Needs</h3>
                <p className="text-gray-600">Customize the AI to fit your specific requirements, ensuring relevant and accurate assistance.</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <Button 
            onClick={() => setIsChatOpen(true)}
            className="text-lg px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all duration-300 transform hover:scale-105"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </div>

      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          >
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Bot className="w-8 h-8" />
                  <h2 className="text-2xl font-bold">AI Assistant</h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsChatOpen(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full"
                >
                  <X className="w-6 h-6" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>

              <ScrollArea className="h-96 p-6">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`mb-4 ${
                      message.sender === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    <span
                      className={`inline-block p-3 rounded-2xl ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      {message.text}
                    </span>
                  </motion.div>
                ))}
              </ScrollArea>

              <div className="p-4 border-t border-gray-200">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSend()
                  }}
                  className="flex space-x-2"
                >
                  <Input
                    type="text"
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-grow rounded-full"
                  />
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6">
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </Button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
    </section>
  )
}