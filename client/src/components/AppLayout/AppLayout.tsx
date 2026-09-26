import { useEffect, useState } from "react";
import { Outlet } from "react-router";

import Header from "../Header/Header";

import "./AppLayout.css";

export default function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // While the mobile menu is open: lock page scroll, close on Escape,
  // and close when the viewport grows past the mobile breakpoint.
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const desktopQuery = window.matchMedia("(min-width: 769px)");
    const close = () => setIsMobileMenuOpen(false);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    desktopQuery.addEventListener("change", close);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
      desktopQuery.removeEventListener("change", close);
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="app-layout">
      <Header
        onMenuOpen={() => setIsMobileMenuOpen(true)}
        onMenuClose={() => setIsMobileMenuOpen(false)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {isMobileMenuOpen && (
        <div
          className="app-layout__backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main className="app-layout__main">
        <Outlet context={{ isMobileMenuOpen, setIsMobileMenuOpen }} />
      </main>
    </div>
  );
}
