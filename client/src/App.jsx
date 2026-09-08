import { useCallback, useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ChatBot from "./components/ChatBot";
import { useFeedback } from "./hooks/useFeedback";
import CityPulse from "./pages/CityPulse.jsx";
import Home from "./pages/Home.jsx";
import InternationalNavigator from "./pages/InternationalNavigator.jsx";
import Opportunities from "./pages/Opportunities.jsx";
import TourismMap from "./pages/TourismMap.jsx";
import { buildChatQuestions } from "./i18n/surveyQuestions";

function AppShell() {
  const [chatOpen, setChatOpen] = useState(false);
  const { t } = useLanguage();
  const { triggerFeedback, feedbackUI } = useFeedback();

  const chatQuestions = useMemo(() => buildChatQuestions(t), [t]);

  const handleMessageCount = useCallback(
    (count) => {
      if (count >= 5) {
        triggerFeedback("chatbot", chatQuestions);
      }
    },
    [triggerFeedback, chatQuestions]
  );

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans pb-20 sm:pb-0">
      <Navbar onOpenChat={() => setChatOpen(true)} />
      <main className="flex-1 pt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/city-pulse" element={<CityPulse />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/tourism-map" element={<TourismMap />} />
          <Route
            path="/international-navigator"
            element={<InternationalNavigator />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <ChatBot
        open={chatOpen}
        onOpen={() => setChatOpen(true)}
        onClose={() => setChatOpen(false)}
        onMessageCount={handleMessageCount}
      />
      {feedbackUI}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </LanguageProvider>
  );
}
