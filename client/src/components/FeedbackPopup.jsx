import { useEffect, useRef, useState } from "react";
import { submitFeedback } from "../utils/api";
import { useLanguage } from "../context/LanguageContext";

/**
 * Props:
 * - page: string (stable instrument id)
 * - questions: [{ id, text, type, options?: [{value,label}] | string[] }]
 * - sessionId: string | null
 * - onClose: (reason) => void
 */
export default function FeedbackPopup({ page, questions, sessionId, onClose }) {
  const { language, t } = useLanguage();
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const touchedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (touchedRef.current || submitting) return;
      onClose("timeout");
    }, 45000);
    return () => clearTimeout(timer);
  }, [onClose, submitting]);

  function normalizeOptions(options = []) {
    return options.map((o) =>
      typeof o === "string" ? { value: o, label: o } : o
    );
  }

  function setAnswer(id, value, label) {
    touchedRef.current = true;
    setAnswers((prev) => ({
      ...prev,
      [id]: { value, label: label ?? String(value) },
    }));
  }

  function canSubmit() {
    return questions.every((q) => {
      if (q.type === "text") return true;
      const value = answers[q.id]?.value;
      return value !== undefined && value !== null && value !== "";
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit() || submitting) return;

    setSubmitting(true);
    setError("");

    const responses = questions.map((q) => {
      const ans = answers[q.id];
      const rawValue =
        q.type === "text" ? ans?.value ?? ans?.label ?? "" : ans?.value ?? "";
      const label = ans?.label ?? String(rawValue ?? "");
      return {
        questionId: q.id,
        questionType: q.type,
        question: q.text,
        answer: rawValue,
        answerLabel: label,
        answerCode:
          q.type === "stars"
            ? Number(rawValue)
            : q.type === "text"
              ? null
              : String(rawValue),
      };
    });

    try {
      await submitFeedback({
        instrument: page,
        page,
        sessionId: sessionId || "anonymous",
        language,
        platform: "sokcho-smart-city",
        surveyVersion: "1.0",
        responses,
      });
      onClose("submit");
    } catch (err) {
      setError(err.message || "Could not submit feedback");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 w-auto max-w-sm sm:left-auto sm:right-4 sm:w-[min(100%-2rem,22rem)] animate-[slideUp_0.3s_ease-out]">
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-border bg-white p-4 shadow-lg"
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-text-primary">
              {t("feedback.title")}
            </p>
            <p className="text-xs text-text-secondary">{t("feedback.subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={() => onClose("dismiss")}
            className="rounded p-1 text-text-secondary hover:bg-gray-50"
            aria-label={t("feedback.dismiss")}
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {questions.map((q) => {
            const options = normalizeOptions(q.options);
            return (
              <div key={q.id}>
                <p className="mb-2 text-sm text-text-primary">{q.text}</p>

                {q.type === "stars" && (
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setAnswer(q.id, star, String(star))}
                        className={`text-xl leading-none ${
                          answers[q.id]?.value >= star
                            ? "text-warning"
                            : "text-gray-300"
                        }`}
                        aria-label={`${star} stars`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                )}

                {q.type === "options" && (
                  <div className="flex flex-wrap gap-2">
                    {options.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setAnswer(q.id, option.value, option.label)
                        }
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          answers[q.id]?.value === option.value
                            ? "border-primary bg-primary text-white"
                            : "border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}

                {q.type === "text" && (
                  <input
                    type="text"
                    value={answers[q.id]?.label || answers[q.id]?.value || ""}
                    onChange={(e) =>
                      setAnswer(q.id, e.target.value, e.target.value)
                    }
                    placeholder={t("common.optional")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                )}
              </div>
            );
          })}
        </div>

        {error && <p className="mt-3 text-xs text-danger">{error}</p>}

        <button
          type="submit"
          disabled={!canSubmit() || submitting}
          className="mt-4 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? t("common.sending") : t("common.submit")}
        </button>
      </form>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
