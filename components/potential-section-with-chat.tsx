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
    { text: "Hello! I'm your AI assistant. How can I help you today?", sender: 'bot' }
  ])
  const [input, setInput] = useState('')

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

  const MAX_HISTORY = 6; // Define the maximum number of messages to store in history

  const SYSTEM_PROMPT = {
    role: "system",
    content: "You are the Abu Dhabi's open data platform AI assistant. You are helpful and friendly and you only respond to images that you receive and analyze or questions that you can help with in providing the best datasets from the open data platform. You are interactive to help the user get the best dataset he's searching for. You might receive an image from the user without context, analyze it along with the data you have in case the user intent is some data based on that image.\nThis is the data from the search engine you have:\nin the certificate of completion form.\",\r\n        \"descriptionlear\": \"إجمالي عدد المباني على الأرض المخصصة للبناء والمضمنة في شهادة نموذج الإنجاز.\",\r\n        \"issued\": \"2023-10-30T08:55:07+00:00\",\r\n        \"modified\": \"2024-08-23T06:19:47+00:00\",\r\n        \"license\": \"https://data.abudhabi/opendata/addata_open_license\",\r\n        \"licenselear\": \"https://data.abudhabi/opendata/node/6041?language=ar\",\r\n        \"publisher\": {\r\n            \"data\": {\r\n                \"@type\": \"org:Organization\",\r\n                \"name\": \"Department of Municipalities and Transport\"\r\n            }\r\n        },\r\n        \"publisherlear\": {\r\n            \"data\": {\r\n                \"@type\": \"org:Organization\",\r\n                \"name\": \"دائرة البلديات والنقل\"\r\n            }\r\n        },\r\n        \"contactPoint\": {\r\n            \"fn\": \"Mohamed Alzaabi\",\r\n            \"fnlear\": \"محمد الزعابي\",\r\n            \"hasEmail\": \"mohamed.alzaabi@dmt.gov.ae\"\r\n        },\r\n        \"theme\": [\r\n            {\r\n                \"data\": \"Economy\"\r\n            }\r\n        ],\r\n        \"themelear\": [\r\n            {\r\n                \"data\": \"الاقتصاد\"\r\n            }\r\n        ],\r\n        \"keyword\": [\r\n            {\r\n                \"data\": \"AbuDhabi\"\r\n            },\r\n            {\r\n                \"data\": \"Housing\"\r\n            }\r\n        ],\r\n        \"keywordlear\": [\r\n            {\r\n                \"data\": \"أبوظبي\"\r\n            },\r\n            {\r\n                \"data\": \"المساكن\"\r\n            }\r\n        ],\r\n        \"distribution\": [\r\n            {\r\n                \"data\": {\r\n                    \"descriptionlear\": null,\r\n                    \"format\": \"excel\",\r\n                    \"mediaType\": null,\r\n                    \"downloadURL\": \"https://data.abudhabi/opendata/sites/default/files/uploaded_resources/Number%20of%20Building%20Completion%20-%20Emirates%20of%20Abu%20Dhabi.xlsx\"\r\n                }\r\n            }\r\n        ]\r\n    },\r\n    {\r\n        \"title\": \"Number of Building completions by region\", }\r\n        },\r\n        \"publisherlear\": {\r\n            \"data\": {\r\n                \"@type\": \"org:Organization\",\r\n                \"name\": \"دائرة البلديات والنقل\"\r\n            }\r\n        },\r\n        \"contactPoint\": {\r\n            \"fn\": \"Mohamed Alzaabi\",\r\n            \"fnlear\": \"محمد الزعابي\",\r\n            \"hasEmail\": \"mohamed.alzaabi@dmt.gov.ae\"\r\n        },\r\n        \"theme\": [\r\n            {\r\n                \"data\": \"Economy\"\r\n            }\r\n        ],\r\n        \"themelear\": [\r\n            {\r\n                \"data\": \"الاقتصاد\"\r\n            }\r\n        ],\r\n        \"keyword\": [\r\n            {\r\n                \"data\": \"AbuDhabi\"\r\n            }\r\n        ],\r\n        \"keywordlear\": [\r\n            {\r\n                \"data\": \"أبوظبي\"\r\n            }\r\n        ],\r\n        \"distribution\": [\r\n            {\r\n                \"data\": {\r\n                    \"descriptionlear\": null,\r\n                    \"format\": \"excel\",\r\n                    \"mediaType\": null,\r\n                    \"downloadURL\": \"https://data.abudhabi/opendata/sites/default/files/uploaded_resources/Number%20of%20Building%20Completion%20by%20Region%20-%20Abu%20Dhabi.xlsx\"\r\n                }\r\n            }\r\n        ]\r\n    },\r\n    {\r\n        \"title\": \"Residential unit completions - Emirate of Abu Dhabi\",\r\n        \"titlear\": \" الوحدات السكنية المنجزة - إمارة أبوظبي\",\r\n        \"identifier\": \"74fdde80-b8ec-4289-8803-5d4e3db55476\",\r\n        \"description\": \"Residential units are residential buildings with different architectural forms and used for residential purposes.\\r\\n\",\r\n        \"descriptionlear\": \" المباني السكنية ذات الأشكال المعمارية المختلفة والمستخدمة للأغراض السكنية\",\r\n        \"issued\": \"2023-11-02T09:45:33+00:00\",\r\n        \"modified\": \"2024-08-23T06:22:15+00:00\",\r\n        \"license\": \"https://data.abudhabi/opendata/addata_open_license\",\r\n        \"licenselear\": \"https://data.abudhabi/opendata/node/6041?language=ar\",\r\n        \"publisher\": {\r\n            \"data\": {\r\n                \"@type\": \"org:Organization\",\nYou only return your response in this structure \"[[datasets_identifiers_separated_by_comma_each_in_a_list_you_only_put_the_first_identifier_of_each_dataset_in_case_you_wanted_to_return_more_than_one_dataset],your_response]\""
  };
  
  const handleSend = async () => {
    if (input.trim()) {
      // Create the user message with proper content structure (including type)
      const userMessage = {
        role: "user",
        content: input.trim()
      };
  
      // Retrieve chat history from local storage
      let chatHistory = JSON.parse(localStorage.getItem("chatHistory") || "[]");
  
      // Append the user's input to chat history
      chatHistory.push(userMessage);
  
      // Include the system prompt at the top of the chat history
      const fullChat = [SYSTEM_PROMPT, ...chatHistory, userMessage];
      setMessages((prev) => [...prev, { text: input, sender: 'user' }]);
      setInput(''); // Clear input field
  
      try {
        // Send the full chat (with system prompt) to the backend
        const response = await fetch('/api/gpt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: fullChat }),
        });
  
        const data = await response.json();
        const botReply = data.choices?.[0]?.message?.content || "Sorry, I couldn't process that. Try again.";
  
        // Append the assistant's response to chat history
        const botMessage = {
          role: "assistant",
          content: botReply
        };
        chatHistory.push(userMessage, botMessage);
if (chatHistory.length > MAX_HISTORY) {
  chatHistory.shift();
}
localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
        // Update the UI with the bot's response
        setMessages((prev) => [...prev, { text: botReply, sender: 'bot' }]);
      } catch (error) {
        // Handle errors gracefully
        setMessages((prev) => [
          ...prev,
          { text: "There was an error connecting to the server. Please try again.", sender: 'bot' },
        ]);
      }
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