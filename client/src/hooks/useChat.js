import { useCallback, useState } from "react";
import { sendChat } from "../utils/api";
import { useLanguage } from "../context/LanguageContext";

export function useChat() {
  const { t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendMessage = useCallback(
    async (content) => {
      const trimmed = content.trim();
      if (!trimmed || loading) return;

      const nextMessages = [...messages, { role: "user", content: trimmed }];
      setMessages(nextMessages);
      setLoading(true);
      setError("");

      try {
        const data = await sendChat(nextMessages);
        setMessages([
          ...nextMessages,
          { role: "assistant", content: data.reply || "No reply received." },
        ]);
      } catch (err) {
        setError(err.message || "Failed to get a reply");
        setMessages([
          ...nextMessages,
          {
            role: "assistant",
            content: t("chat.error"),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading, t]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError("");
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearChat,
  };
}

export default useChat;
