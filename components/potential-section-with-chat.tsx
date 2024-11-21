"use client";

import { useState, useEffect } from "react";
import { SearchResultsComponent } from "./search-results";
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

export function PotentialSection({
  externalQuery,
  onDatasetsChange,  // Add this prop to the function signature
}: {
  externalQuery: string;
  onDatasetsChange: (identifiers: string[]) => void; // Expecting a callback function
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<{
    text: string;
    sender: "user" | "bot";
  }[]>([
    {
      text: "Hello! I'm your Abu Dhabi Open Data AI assistant. How can I help you today?",
      sender: "bot",
    },
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchResultsIdentifiers, setSearchResultsIdentifiers] = useState<string[]>([]);

  // Call onDatasetsChange whenever searchResultsIdentifiers is updated
  useEffect(() => {
    if (onDatasetsChange && searchResultsIdentifiers.length > 0) {
      onDatasetsChange(searchResultsIdentifiers);  // Notify parent of the dataset change
    }
  }, [searchResultsIdentifiers, onDatasetsChange]);

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

  // Handle external query changes from HeroSection
  useEffect(() => {
    if (typeof externalQuery === "string" && externalQuery.trim()) {
      setInput(externalQuery); // Update input field with the external query
      setIsChatOpen(true); // Open chat automatically
    }
  }, [externalQuery]);

  // Automatically send the query if externalQuery is set
  useEffect(() => {
    if (input.trim() && !isProcessing) {
      handleSend(); // Call handleSend when input is updated
    }
  }, [input]);

  const handleSend = async () => {
    if (input.trim() && !isProcessing) {
      setIsProcessing(true); // Set processing flag to true
      const userMessage = { role: "user", content: input.trim() };

      // Retrieve chat history from local storage or initialize
      const chatHistory = JSON.parse(localStorage.getItem("chatHistory") || "[]");

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
            messages: [
              { role: "system", content: `Your role as the Abu Dhabi Open Data Platform AI is as follows: - **Query Evaluation and Refinement**: When you receive a prompt, assess if it is a search query. - If the query is suitable as provided, repeat it exactly as is. - If the query could be refined, modify it to improve relevance and respond only with the refined keywords. - Avoid unnecessary words such as "data," "dataset," or specific UAE city names, even if mentioned. - **Re-query Generation for Enhanced Relevance**: If the user context suggests that previous results were unsatisfactory, generate a new query that better meets the user's needs based on the conversation context. Reply only with the new query. - **Dataset Discussion**: If the user is asking questions or discussing a dataset they retrieved without requesting new information, reply only with "0" to indicate no new query is required. **Important**: - Focus exclusively on keywords relevant to the user's intent, avoiding filler words. - Aim for keywords directly tied to the specific purpose (e.g., "finance," "public health," "citizen well-being"), keeping responses concise and to the point.` },
              ...chatHistory,
            ],
          }),
        });

        const localData = await localResponse.json();
        const searchQuery = localData.choices?.[0]?.message?.content?.trim();
        console.log("First API result (local system prompt):", localData);
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
          content: `You are the Abu Dhabi's open data platform AI assistant. You are helpful and friendly, and you provide the best datasets from the open data platform based on user queries. This is the data from the search engine you have: ${chunks}. You only return your response in this structure and make it parse friendly"[[datasets_identifiers_separated_by_comma_each_in_a_list_you_only_put_the_first_identifier_of_each_dataset_in_case_you_wanted_to_return_more_than_one_dataset],your_response]" please do not forget your response structure if you do not find an identifier leave its array empty do not make out responses from your head example "[["8cbaa2c9-2a85-434e-bfc7-6a994b6eaa3d","8cbaa2c9-2a85-434e-bfc7-6a994b6eaa3d"],"we have this kind of dataset and explain it"]"`,
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

        // Ensure datasetIdentifiers is a list of strings
        setSearchResultsIdentifiers(datasetIdentifiers.map((id: any) => String(id))); // Ensure all identifiers are strings
        console.log("Extracted dataset identifiers:", datasetIdentifiers);
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
      } finally {
        setIsProcessing(false); // Reset processing flag after the operation is done
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
                <Zap className="w-12 h-12 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Instant Results</h3>
                <p className="text-gray-600">
                  Get real-time answers and recommendations without waiting.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="h-full">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Target className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Personalized Service</h3>
                <p className="text-gray-600">
                  Experience tailor-made suggestions based on your preferences.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Chat Input */}
        {isChatOpen && (
  <div
    className="mt-10 flex flex-col fixed bottom-5 right-5 z-50 w-80 bg-white rounded-lg shadow-lg"
    style={{ width: "300px", height: "auto", maxHeight: "calc(100vh - 80px)" }}
  >
    <ScrollArea className="h-[400px] mb-4">
      <div className="space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`${
                msg.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
              } p-3 rounded-lg max-w-xs`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
    <div className="flex items-center p-2 bg-gray-100 rounded-b-lg">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 p-2 border-none rounded-l-lg"
      />
      <Button
        onClick={handleSend}
        disabled={isProcessing || !input.trim()}
        className="bg-blue-500 text-white rounded-r-lg px-4 py-2"
      >
        Send
      </Button>
    </div>
  </div>
)}
      </div>
    </section>
  );
}
