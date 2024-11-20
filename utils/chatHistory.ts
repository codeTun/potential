const CHAT_HISTORY_KEY = "chatHistory";
const MAX_HISTORY = 6;

/**
 * Retrieve chat history from localStorage.
 * The system prompt is not included in the stored history.
 */
export const getChatHistory = (): { message: string; timestamp: number }[] => {
  if (typeof window === "undefined") return [];
  const history = localStorage.getItem(CHAT_HISTORY_KEY);
  return history ? JSON.parse(history) : [];
};

/**
 * Save a new chat message to localStorage.
 * Maintains a maximum of 6 chat history items.
 */
export const saveChatToHistory = (chat: { message: string; timestamp: number }): void => {
  if (typeof window === "undefined") return;

  const history = getChatHistory();
  history.push(chat);

  if (history.length > MAX_HISTORY) {
    history.shift(); // Remove the oldest chat if exceeding the limit
  }

  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
};

/**
 * Clear chat history.
 */
export const clearChatHistory = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CHAT_HISTORY_KEY);
};
