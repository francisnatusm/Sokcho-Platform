import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

function linkClass({ isActive }) {
  return [
    "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-primary/10 text-primary"
      : "text-text-secondary hover:bg-gray-50 hover:text-primary",
  ].join(" ");
}

export default function Navbar({ onOpenChat }) {
  const { language, setLanguage, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const NAV_LINKS = [
    { to: "/", label: t("nav.home"), end: true },
    { to: "/city-pulse", label: t("nav.cityPulse") },
    { to: "/opportunities", label: t("nav.opportunities") },
    { to: "/tourism-map", label: t("nav.tourismMap") },
    { to: "/international-navigator", label: t("nav.navigator") },
  ];

  function toggleLanguage() {
    setLanguage(language === "en" ? "ko" : "en");
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-border bg-surface shadow-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="shrink-0 text-lg font-bold text-primary"
          onClick={closeMenu}
        >
          Sokcho <span className="font-semibold">속초</span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={linkClass}
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLanguage}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            aria-label={t("nav.toggleLang")}
          >
            {language === "en" ? "KR" : "EN"}
          </button>

          <button
            type="button"
            onClick={onOpenChat}
            className="hidden rounded-lg bg-primary p-2 text-white transition-colors hover:bg-primary-light sm:inline-flex"
            aria-label={t("nav.openChat")}
          >
            <ChatIcon />
          </button>

          <button
            type="button"
            className="inline-flex rounded-lg border border-gray-300 p-2 text-gray-700 lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={t("nav.menu")}
            aria-expanded={menuOpen}
          >
            <MenuIcon open={menuOpen} />
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="border-t border-border bg-surface px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={linkClass}
                onClick={closeMenu}
              >
                {link.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={() => {
                closeMenu();
                onOpenChat?.();
              }}
              className="mt-2 rounded-lg bg-primary px-3 py-2 text-left text-sm font-medium text-white"
            >
              {t("chat.title")}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

function ChatIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function MenuIcon({ open }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      {open ? (
        <path d="M18 6 6 18M6 6l12 12" />
      ) : (
        <path d="M4 6h16M4 12h16M4 18h16" />
      )}
    </svg>
  );
}
