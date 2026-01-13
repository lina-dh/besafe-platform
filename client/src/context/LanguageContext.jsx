import PropTypes from "prop-types";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const LanguageContext = createContext(null);

const STORAGE_KEY = "ps_lang";

function langToDir(lang) {
  return lang === "he" ? "rtl" : "ltr";
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "he" ? "he" : "en";
  });

  const dir = useMemo(() => langToDir(lang), [lang]);

  useEffect(() => {
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", dir);

    document.documentElement.classList.toggle("lang-he", lang === "he");
    document.documentElement.classList.toggle("lang-en", lang !== "he");

    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang, dir]);

  const toggleLanguage = () => setLang((prev) => (prev === "he" ? "en" : "he"));

  const value = useMemo(
    () => ({ lang, dir, setLang, toggleLanguage }),
    [lang, dir]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

LanguageProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within <LanguageProvider>");
  }
  return ctx;
}
