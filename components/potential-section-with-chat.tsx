"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Zap, Target, X, Send } from "lucide-react";

interface Message {
  text: string;
  sender: "user" | "bot";
}

interface PotentialSectionProps {
  externalQuery: string;
  onDatasetsChange: (identifiers: string[]) => void;
}

export function PotentialSection({
  externalQuery,
  onDatasetsChange,
}: PotentialSectionProps) {
  const [isVisible] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hello! I'm your Abu Dhabi Open Data AI assistant. How can I help you today?",
      sender: "bot",
    },
  ]);
  const [input, setInput] = useState(externalQuery || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchResultsIdentifiers, setSearchResultsIdentifiers] = useState<
    string[]
  >([]);

  const MAX_HISTORY = 6;

  useEffect(() => {
    if (externalQuery.trim()) {
      setIsChatOpen(true);
      handleSend(externalQuery);
    }
  }, [externalQuery]);

  useEffect(() => {
    if (searchResultsIdentifiers.length > 0) {
      onDatasetsChange(searchResultsIdentifiers);
    }
  }, [searchResultsIdentifiers, onDatasetsChange]);

  const handleSend = async (messageText: string) => {
    if (messageText.trim() && !isProcessing) {
      setIsProcessing(true);
      setMessages((prev) => [
        ...prev,
        { text: messageText.trim(), sender: "user" },
      ]);
      setInput("");

      let chatHistory = JSON.parse(localStorage.getItem("chatHistory") || "[]");
      chatHistory.push({ role: "user", content: messageText.trim() });

      if (chatHistory.length > MAX_HISTORY) {
        chatHistory = chatHistory.slice(-MAX_HISTORY);
      }

      try {
        // First API Call
        const localResponse = await fetch("/api/gpt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content: `Your role as the Abu Dhabi Open Data Platform AI is as follows: - **Query Evaluation and Refinement**: When you receive a prompt, assess if it is a search query. - If the query is suitable as provided, repeat it exactly as is. - If the query could be refined, modify it to improve relevance and respond only with the refined keywords. - Avoid unnecessary words such as "data," "dataset," or specific UAE city names, even if mentioned. - **Re-query Generation for Enhanced Relevance**: If the user context suggests that previous results were unsatisfactory, generate a new query that better meets the user's needs based on the conversation context. Reply only with the new query. - **Dataset Discussion**: If the user is asking questions or discussing a dataset they retrieved without requesting new information, reply only with "0" to indicate no new query is required. **Important**: - Focus exclusively on keywords relevant to the user's intent, avoiding filler words. - Aim for keywords directly tied to the specific purpose (e.g., "finance," "public health," "citizen well-being"), keeping responses concise and to the point.`,
              },
              ...chatHistory,
            ],
          }),
        });

        const localData = await localResponse.json();
        const searchQuery = localData.choices?.[0]?.message?.content?.trim();

        let chunks = "";

        if (searchQuery && searchQuery !== "0") {
          // Search API Call
          const searchEngineResponse = await fetch("/api/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ search: searchQuery }),
          });
        
          const searchData = await searchEngineResponse.json();
        
          // Iterate through the 'value' array and extract all values
          chunks = searchData?.value
            ?.map((doc: any) => {
              const values = [];
              (function extractValues(obj) {
                if (typeof obj === "object" && obj !== null) {
                  if (Array.isArray(obj)) {
                    obj.forEach((item) => extractValues(item));
                  } else {
                    for (const key in obj) {
                      extractValues(obj[key]);
                    }
                  }
                } else if (typeof obj === "string" || typeof obj === "number") {
                  values.push(obj);
                }
              })(doc);
        
              return values.join(" ");
            })
            .join(" ") || "";
        }

        // Second API Call
        const SYSTEM_PROMPT_GLOBAL = {
          role: "system",
          content: `You are the Abu Dhabi's open data platform AI assistant. You are helpful and friendly, and you provide the best datasets from the open data platform based on user queries. This is the data from the search engine you have: ${chunks}. You only return your response in this structure and make it parse friendly"[[datasets_identifiers_separated_by_comma_each_in_a_list_you_only_put_the_first_identifier_of_each_dataset_in_case_you_wanted_to_return_more_than_one_dataset],your_response]" please do not forget your response structure if you do not find an identifier leave its array empty do not make out responses from your head example "[["8cbaa2c9-2a85-434e-bfc7-6a994b6eaa3d","8cbaa2c9-2a85-434e-bfc7-6a994b6eaa3d"],"we have this kind of dataset and explain it"]" these IDs are just an example for you to understand do not include it in your response`,
        };

        const globalResponse = await fetch("/api/gpt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [SYSTEM_PROMPT_GLOBAL, ...chatHistory],
          }),
        });

        const globalData = await globalResponse.json();
        const gptMessage = globalData.choices?.[0]?.message?.content || "";

        let datasetIdentifiers: string[] = [];
        let gptResponse = "";

        try {
          const parsedResponse = JSON.parse(gptMessage);

          if (Array.isArray(parsedResponse) && parsedResponse.length === 2) {
            datasetIdentifiers = parsedResponse[0];
            gptResponse = parsedResponse[1];
          } else {
            throw new Error("Invalid response format");
          }
        } catch {
          gptResponse = gptMessage;
        }

        setSearchResultsIdentifiers(datasetIdentifiers);
        chatHistory.push({ role: "assistant", content: gptResponse });

        if (chatHistory.length > MAX_HISTORY) {
          chatHistory = chatHistory.slice(-MAX_HISTORY);
        }

        localStorage.setItem("chatHistory", JSON.stringify(chatHistory));

        if (gptResponse.trim()) {
          setMessages((prev) => [
            ...prev,
            { text: gptResponse.trim(), sender: "bot" },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            text: "There was an error connecting to the server. Please try again.",
            sender: "bot",
          },
        ]);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
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
          <h2 className="text-4xl font-bold mb-4 text-gray-800">
            Experience Our AI-Powered Chatbot
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock the power of AI to enhance your conversations and boost
            productivity with our cutting-edge chatbot.
          </p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-8"
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { delayChildren: 0.3, staggerChildren: 0.2 },
            },
          }}
        >
          {/* Cards */}
          <motion.div
            variants={{
              hidden: { y: 20, opacity: 0 },
              visible: { y: 0, opacity: 1 },
            }}
          >
            <Card className="h-full transform hover:scale-105 transition-transform duration-300">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="bg-blue-100 p-4 rounded-full mb-4">
                  <MessageCircle className="w-12 h-12 text-blue-500" />
                </div>
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

          <motion.div
            variants={{
              hidden: { y: 20, opacity: 0 },
              visible: { y: 0, opacity: 1 },
            }}
          >
            <Card className="h-full transform hover:scale-105 transition-transform duration-300">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="bg-green-100 p-4 rounded-full mb-4">
                  <Zap className="w-12 h-12 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Instant Results</h3>
                <p className="text-gray-600">
                  Get real-time answers and recommendations without waiting.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            variants={{
              hidden: { y: 20, opacity: 0 },
              visible: { y: 0, opacity: 1 },
            }}
          >
            <Card className="h-full transform hover:scale-105 transition-transform duration-300">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="bg-red-100 p-4 rounded-full mb-4">
                  <Target className="w-12 h-12 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Personalized Service
                </h3>
                <p className="text-gray-600">
                  Experience tailor-made suggestions based on your preferences.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {isChatOpen ? (
          <ChatWindow
            messages={messages}
            input={input}
            isProcessing={isProcessing}
            onClose={() => setIsChatOpen(false)}
            onInputChange={(e) => setInput(e.target.value)}
            onFormSubmit={handleFormSubmit}
          />
        ) : (
          <ChatToggleButton onClick={() => setIsChatOpen(true)} />
        )}
      </div>
    </section>
  );
}

function ChatWindow({
  messages,
  input,
  isProcessing,
  onClose,
  onInputChange,
  onFormSubmit,
}: {
  messages: Message[];
  input: string;
  isProcessing: boolean;
  onClose: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFormSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-5 right-5 z-50 w-96 bg-white rounded-lg shadow-2xl overflow-hidden"
    >
      <div className="bg-blue-500 text-white p-4 flex justify-between items-center">
        <h3 className="font-semibold">Potential Assistant</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-blue-600"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="h-[400px] p-4">
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`${
                  msg.sender === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-800"
                } p-3 rounded-lg max-w-[80%] shadow`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 bg-gray-50">
        <form onSubmit={onFormSubmit} className="flex items-center space-x-2">
          <Input
            value={input}
            onChange={onInputChange}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className="bg-blue-500 text-white hover:bg-blue-600"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </motion.div>
  );
}

function ChatToggleButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-5 right-5 z-50"
    >
      <Button
        onClick={onClick}
        className="bg-blue-500 text-white hover:bg-blue-600 rounded-full p-4 shadow-lg"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </motion.div>
  );
}
