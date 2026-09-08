import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { translate } from "../i18n/translations";

const LanguageContext = createContext(null);

const STORAGE_KEY = "sokcho-language";

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    if (typeof window === "undefined") return "en";
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "ko" || saved === "en" ? saved : "en";
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language === "ko" ? "ko" : "en";
  }, [language]);

  function setLanguage(next) {
    if (next !== "en" && next !== "ko") return;
    setLanguageState(next);
  }

  const t = useCallback(
    (key, vars) => translate(language, key, vars),
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}

export default LanguageContext;
