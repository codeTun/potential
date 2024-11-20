// FILE: components/potential-section.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  MessageCircle,
  Zap,
  Target,
  X,
  Send,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export function PotentialSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<
    { text: string; sender: "user" | "bot" }[]
  >([
    {
      text: "Hello! I'm your Abu Dhabi Open Data AI assistant. How can I help you today?",
      sender: "bot",
    },
  ]);
  const [input, setInput] = useState("");
  const [dataset, setDataset] = useState("");
  const [searchResultsIdentifiers, setSearchResultsIdentifiers] = useState<string[]>([]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delayChildren: 0.3, staggerChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  const MAX_HISTORY = 6;

  // System prompts
  const SYSTEM_PROMPT_LOCAL = {
    role: "system",
    content: `Your role as the Abu Dhabi Open Data Platform AI is as follows:
    
- **Query Evaluation and Refinement**: When you receive a prompt, assess if it is a search query.
  - If the query is suitable as provided, repeat it exactly as is.
  - If the query could be refined, modify it to improve relevance and respond only with the refined keywords.
  - Avoid unnecessary words such as "data," "dataset," or specific UAE city names, even if mentioned.
- **Re-query Generation for Enhanced Relevance**: If the user context suggests that previous results were unsatisfactory, generate a new query that better meets the user's needs based on the conversation context. Reply only with the new query.
- **Dataset Discussion**: If the user is asking questions or discussing a dataset they retrieved without requesting new information, reply only with "0" to indicate no new query is required.

**Important**:

- Focus exclusively on keywords relevant to the user's intent, avoiding filler words.
- Aim for keywords directly tied to the specific purpose (e.g., "finance," "public health," "citizen well-being"), keeping responses concise and to the point.`,
  };

  // Show the section after a delay
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Handle sending messages
  const handleSend = async () => {
    if (input.trim()) {
      const userMessage = { role: "user", content: input.trim() };
  
      // Retrieve chat history from local storage or initialize
      const chatHistory = JSON.parse(
        localStorage.getItem("chatHistory") || "[]"
      );
  
      // Append the user's message to chat history
      chatHistory.push(userMessage);
  
      // Limit chat history to MAX_HISTORY
      if (chatHistory.length > MAX_HISTORY) {
        chatHistory.shift(); // Remove the oldest message
      }
  
      try {
        // First GPT API call to generate/refine search query
        const localResponse = await fetch("/api/gpt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [SYSTEM_PROMPT_LOCAL, ...chatHistory],
          }),
        });
  
        const localData = await localResponse.json();
        const searchQuery = localData.choices?.[0]?.message?.content?.trim();
  
        // Update UI with user's message
        setMessages((prev) => [
          ...prev,
          { text: input.trim(), sender: "user" },
        ]);
        setInput(""); // Clear input field
  
        let chunks = ""; // Initialize chunks as an empty string
  
        // Proceed with search query only if valid and not "0"
        if (searchQuery && searchQuery !== "0") {
          // Call the AI search engine API
          const searchEngineResponse = await fetch("/api/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ search: searchQuery }),
          });
  
          const searchData = await searchEngineResponse.json();
          chunks =
            searchData?.value
              ?.map((doc: { chunk: string }) => doc.chunk)
              .join(" ") || ""; // Update chunks based on search results
        }
          // Create the global system prompt
          const SYSTEM_PROMPT_GLOBAL = {
            role: "system",
            content: `You are the Abu Dhabi's open data platform AI assistant. You are helpful and friendly, and you provide the best datasets from the open data platform based on user queries. This is the data from the search engine you have: ${chunks}. You only return your response in this structure "[[datasets_identifiers_separated_by_comma_each_in_a_list_you_only_put_the_first_identifier_of_each_dataset_in_case_you_wanted_to_return_more_than_one_dataset],your_response]"`,
          };

          // Second GPT API call to generate the assistant's reply
      const globalResponse = await fetch("/api/gpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [SYSTEM_PROMPT_GLOBAL, ...chatHistory],
        }),
      });

      const globalData = await globalResponse.json();
      const gptMessage = globalData.choices?.[0]?.message?.content || "";

      let datasetIdentifiers = [];
      let gptResponse = "";

      // Try to parse the GPT response as JSON
      try {
        const parsedResponse = JSON.parse(gptMessage);

        // If it's a valid JSON array with 2 items, we proceed
        if (Array.isArray(parsedResponse) && parsedResponse.length === 2) {
          datasetIdentifiers = parsedResponse[0]; // Dataset IDs
          gptResponse = parsedResponse[1]; // Assistant's response content
        } else {
          throw new Error("Response is not in the expected format.");
        }
      } catch (error) {
        // If parsing fails, treat it as plain text
        console.error("Error parsing GPT response:", error);
        gptResponse = gptMessage; // Fallback to raw GPT message if not JSON
      }

      // Store the dataset identifiers for later use
      setSearchResultsIdentifiers(datasetIdentifiers);

      // Append assistant's reply to chat history
      chatHistory.push({ role: "assistant", content: gptResponse });

      // Limit chat history to MAX_HISTORY
      if (chatHistory.length > MAX_HISTORY) {
        chatHistory.shift();
      }

      localStorage.setItem("chatHistory", JSON.stringify(chatHistory));

      // Update UI with assistant's reply
      if (gptResponse.trim()) {
        setMessages((prev) => [
          ...prev,
          { text: gptResponse.trim(), sender: "bot" },
        ]);
      } else {
        console.error("Received empty response from GPT.");
      }
    } catch (error) {
      console.error("Error occurred during the API calls:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "There was an error connecting to the server. Please try again.",
          sender: "bot",
        },
      ]);
    }
  }
};

  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl font-bold mb-4 text-gray-800">
            Test our powerful chatbot
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Harness the power of AI to elevate your conversations and boost
            productivity.
          </p>
        </motion.div>

        {/* Feature Cards */}
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
                <h3 className="text-xl font-semibold mb-2">
                  Intelligent Conversations
                </h3>
                <p className="text-gray-600">
                  Engage in meaningful dialogues with our advanced AI, capable
                  of understanding context and nuance.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="h-full">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Zap className="w-12 h-12 text-yellow-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Lightning-Fast Responses
                </h3>
                <p className="text-gray-600">
                  Get instant answers and solutions, powered by cutting-edge
                  language processing technology.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="h-full">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Target className="w-12 h-12 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Tailored to Your Needs
                </h3>
                <p className="text-gray-600">
                  Customize the AI to fit your specific requirements, ensuring
                  relevant and accurate assistance.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Get Started Button */}
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

      {/* Chatbot Popup */}
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
              {/* Chatbot Header */}
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

              {/* Chat Messages */}
              <ScrollArea className="h-96 p-6">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`mb-4 ${
                      message.sender === "user" ? "text-right" : "text-left"
                    }`}
                  >
                    <span
                      className={`inline-block p-3 rounded-2xl ${
                        message.sender === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {message.text}
                    </span>
                  </motion.div>
                ))}
              </ScrollArea>

              {/* Chat Input */}
              <div className="p-4 border-t border-gray-200">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
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
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6"
                  >
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
  );
}
