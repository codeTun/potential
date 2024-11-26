import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Zap, Target, X, Send } from "lucide-react";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { AzureKeyCredential, DocumentAnalysisClient } from "@azure/ai-form-recognizer";  // Import Azure SDK

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAIBvTqAC7Wf2V-bk3CQfcDLroW0cuxZZ4",
  authDomain: "notyet4r.firebaseapp.com",
  projectId: "notyet4r",
  storageBucket: "notyet4r.appspot.com",
  messagingSenderId: "276781279558",
  appId: "1:276781279558:web:a757c62366721d89dd5d47",
  measurementId: "G-GSLSTGNCTP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);  // Initialize Firebase Storage with the app instance

interface Message {
  text: string;
  sender: "user" | "bot";
  imageUrl?: string;
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
    { text: "Hello! I'm your Abu Dhabi Open Data AI assistant. How can I help you today?", sender: "bot" },
  ]);
  const [input, setInput] = useState(externalQuery || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchResultsIdentifiers, setSearchResultsIdentifiers] = useState<string[]>([]);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [extractedContent, setExtractedContent] = useState<string>("");

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
      console.log("Sending message:", messageText.trim());
      setIsProcessing(true);
  
      // Step 1: Add the user message to the chat state
      setMessages((prev) => [
        ...prev,
        { text: messageText.trim(), sender: "user", imageUrl: uploadedImage ? URL.createObjectURL(uploadedImage) : undefined },
      ]);
      setInput(""); // Clear the input field after sending
  
      // Step 2: Retrieve and update chat history from localStorage
      let chatHistory = JSON.parse(localStorage.getItem("chatHistory") || "[]");
  
      // Ensure the new user message is appended
      chatHistory.push({ role: "user", content: messageText.trim() });
  
      if (chatHistory.length > MAX_HISTORY) {
        chatHistory = chatHistory.slice(-MAX_HISTORY); // Limit the chat history to the max allowed
      }
  
      try {
        let fileUrl = "";
        let extractedText = "";
  
        if (uploadedImage) {
          console.log("Uploading image:", uploadedImage.name);
          const imageRef = ref(storage, `images/${uploadedImage.name}`);
          await uploadBytes(imageRef, uploadedImage);
          fileUrl = await getDownloadURL(imageRef);
  
          console.log("Uploaded image URL:", fileUrl);
  
          if (fileUrl) {
            // Process the document using Azure Form Recognizer
            const endpoint = process.env.FORM_RECOGNIZER_ENDPOINT; // Your Azure endpoint
            const key = process.env.FORM_RECOGNIZER_KEY; // Your Azure key
            if (!endpoint || !key) {
              throw new Error("Azure Form Recognizer endpoint or key is not defined.");
            }
            const client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(key));
  
            const poller = await client.beginAnalyzeDocument("prebuilt-read", fileUrl);
            const { content, pages } = await poller.pollUntilDone();
  
            if (pages.length > 0) {
              extractedText = pages.map(page => page.lines.map(line => line.content).join(" ")).join(" ");
              console.log("Extracted content:", extractedText);
            } else {
              throw new Error("No pages extracted from the document.");
            }
          } else {
            throw new Error("Failed to upload image.");
          }
        }
  
        // Combine the extracted content with the user's input
        const finalInput = `${extractedText} ${messageText}`.trim();
  
        // Step 3: Send the message to the GPT API with updated chat history
        const localResponse = await fetch("/api/gpt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "system", content: `Your role as the Abu Dhabi Open Data Platform AI is as follows: - **Query Evaluation and Refinement**: When you receive a prompt, assess if it is a search query. - If the query is suitable as provided, repeat it exactly as is. - If the query could be refined, modify it to improve relevance and respond only with the refined keywords. - Avoid unnecessary words such as "data," "dataset," or specific UAE city names, even if mentioned. - **Re-query Generation for Enhanced Relevance**: If the user context suggests that previous results were unsatisfactory, generate a new query that better meets the user's needs based on the conversation context. Reply only with the new query. - **Dataset Discussion**: If the user is asking questions or discussing a dataset they retrieved without requesting new information, reply only with "0" to indicate no new query is required. **Important**: - Focus exclusively on keywords relevant to the user's intent, avoiding filler words. - Aim for keywords directly tied to the specific purpose (e.g., "finance," "public health," "citizen well-being"), keeping responses concise and to the point.` }, ...chatHistory, { role: "user", content: finalInput }],
          }),
        });
  
        const localData = await localResponse.json();
        const searchQuery = localData.choices?.[0]?.message?.content?.trim();
  
        let chunks = "";
        if (searchQuery && searchQuery !== "0") {
          console.log("Searching for data with query:", searchQuery);
          const searchEngineResponse = await fetch("/api/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ search: searchQuery }),
          });
  
          const searchData = await searchEngineResponse.json();
          chunks = searchData?.value
            ?.map((doc: any) => {
              const values: string[] = [];
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
                  values.push(obj.toString());
                }
              })(doc);
              return values.join(" ");
            })
            .join(" ") || "";
        }
  
        const SYSTEM_PROMPT_GLOBAL = {
          role: "system",
          content: `You are the Abu Dhabi's open data platform AI assistant. You are helpful and friendly, and you provide the best datasets from the open data platform based on user queries. If the user query is specific to something you only return the specific one else if it's general you return all the datasets you have else suggest an alternative and clarify why. This is the data from the search engine you have: ${chunks}. You only return your response in this structure and make it parse friendly"[[datasets_identifiers_separated_by_comma_each_in_a_list_you_only_put_the_first_identifier_of_each_dataset_in_case_you_wanted_to_return_more_than_one_dataset],your_response]" please do not forget your response structure if you do not find an identifier leave its array empty do not make out responses from your head example "[["8cbaa2c9-2a85-434e-bfc7-6a994b6eaa3d","8cbaa2c9-2a85-434e-bfc7-6a994b6eaa3d"],"we have this kind of dataset and explain it"]" these IDs are just an example for you to understand do not include it in your response`,
        };
  
        const globalResponse = await fetch("/api/gpt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [SYSTEM_PROMPT_GLOBAL, ...chatHistory, { role: "user", content: finalInput }],
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
  
        // Save updated chat history with the final content to localStorage
        localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  
        if (gptResponse.trim()) {
          setMessages((prev) => [
            ...prev,
            { text: gptResponse.trim(), sender: "bot" },
          ]);
        }
      } catch (error) {
        console.error("Error during message handling:", error);
        setMessages((prev) => [
          ...prev,
          { text: "There was an error connecting to the server. Please try again.", sender: "bot" },
        ]);
      } finally {
        setIsProcessing(false);
      }
    }
  };
  
  

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    handleSend(input);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedImage(file);
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
            visible: { opacity: 1, y: 0, transition: { delayChildren: 0.3, staggerChildren: 0.2 } },
          }}
        >
          <form
            className="space-y-4 col-span-2 bg-white p-4 rounded-lg shadow-lg border border-gray-200"
            onSubmit={handleFormSubmit}
          >
            <div className="space-y-4">
              <label htmlFor="chatInput" className="block font-medium text-gray-800">
                Ask me anything:
              </label>
              <Input
                type="text"
                id="chatInput"
                name="chatInput"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message here"
                className="p-3 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-4">
                <input
                  type="file"
                  onChange={handleImageUpload}
                  className="p-2 bg-gray-200 rounded-md cursor-pointer"
                />
                <Button
                  type="submit"
                  className="bg-blue-600 text-white p-3 rounded-md"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Sending..." : "Send"}
                </Button>
              </div>
            </div>
          </form>

          <div className="col-span-3 bg-white p-4 rounded-lg shadow-lg border border-gray-200 overflow-y-auto max-h-96">
            <ScrollArea className="h-full space-y-4">
              {messages.map((message, idx) => (
                <div key={idx} className={`p-3 ${message.sender === "user" ? "bg-blue-100" : "bg-gray-100"}`}>
                  <p className={`font-semibold ${message.sender === "user" ? "text-blue-600" : "text-gray-800"}`}>
                    {message.sender === "user" ? "You" : "Bot"}
                  </p>
                  <p className="mt-1">{message.text}</p>
                  {message.imageUrl && <img src={message.imageUrl} alt="Uploaded Content" className="mt-2 max-w-full" />}
                </div>
              ))}
            </ScrollArea>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
