import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useChat } from "../hooks/useChat";

export default function ChatBot({ open, onOpen, onClose, onMessageCount }) {
  const { language, t } = useLanguage();
  const { messages, loading, sendMessage } = useChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  const starters = useMemo(
    () => [
      t("chat.starter1"),
      t("chat.starter2"),
      t("chat.starter3"),
      t("chat.starter4"),
      t("chat.starter5"),
    ],
    [t]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (onMessageCount) {
      onMessageCount(messages.length);
    }
  }, [messages.length, onMessageCount]);

  async function handleSend(e) {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    const text = input;
    setInput("");
    await sendMessage(text);
  }

  async function handleStarter(text) {
    if (loading) return;
    await sendMessage(text);
  }

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-colors hover:bg-primary-light"
        aria-label={t("chat.open")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-6 w-6"
          aria-hidden="true"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label={t("chat.closeOverlay")}
            onClick={onClose}
          />

          <aside className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl sm:w-[400px]">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  {t("chat.title")}
                </h2>
                <p className="text-xs text-text-secondary">
                  {t("chat.language", {
                    lang: language === "ko" ? "한국어" : "English",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-text-secondary hover:bg-gray-50"
                aria-label={t("chat.close")}
              >
                ✕
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-text-secondary">{t("chat.try")}</p>
                  {starters.map((starter) => (
                    <button
                      key={starter}
                      type="button"
                      onClick={() => handleStarter(starter)}
                      className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-sm text-text-primary hover:bg-gray-50"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((msg, index) => (
                <div
                  key={`${msg.role}-${index}`}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-accent text-white"
                        : "bg-gray-100 text-text-primary"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-gray-100 px-3 py-2">
                    <span className="inline-flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.2s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.1s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
                    </span>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} className="border-t border-border p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t("chat.placeholder")}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light disabled:opacity-50"
                >
                  {t("chat.send")}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </>
  );
}
