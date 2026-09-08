import { useCallback, useEffect, useState } from "react";
import { initSession } from "../utils/firebase";
import FeedbackPopup from "../components/FeedbackPopup";

const SEEN_KEY = "sokcho-feedback-seen";

function getSeenMap() {
  try {
    return JSON.parse(sessionStorage.getItem(SEEN_KEY) || "{}");
  } catch {
    return {};
  }
}

function markSeen(page) {
  const seen = getSeenMap();
  seen[page] = true;
  sessionStorage.setItem(SEEN_KEY, JSON.stringify(seen));
}

export function useFeedback() {
  const [sessionId, setSessionId] = useState(null);
  const [active, setActive] = useState(null);

  useEffect(() => {
    let cancelled = false;
    initSession()
      .then((uid) => {
        if (!cancelled) setSessionId(uid);
      })
      .catch(() => {
        if (!cancelled) setSessionId(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const triggerFeedback = useCallback((page, questions) => {
    if (!page || !questions?.length) return;
    const seen = getSeenMap();
    if (seen[page]) return;
    setActive({ page, questions });
  }, []);

  const closeFeedback = useCallback(
    (reason = "dismiss") => {
      // Only permanently hide after submit or manual dismiss — not auto-timeout
      if (active?.page && (reason === "submit" || reason === "dismiss")) {
        markSeen(active.page);
      }
      setActive(null);
    },
    [active]
  );

  const feedbackUI = active ? (
    <FeedbackPopup
      page={active.page}
      questions={active.questions}
      sessionId={sessionId}
      onClose={closeFeedback}
    />
  ) : null;

  return {
    sessionId,
    triggerFeedback,
    closeFeedback,
    feedbackUI,
    isOpen: Boolean(active),
  };
}

export default useFeedback;
