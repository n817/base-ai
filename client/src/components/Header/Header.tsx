import { NavLink } from "react-router";

import { useAuth } from "../../contexts/AuthContext";
import Logo from "../../assets/logo.svg";

import "./Header.css";
import { useState } from "react";

type Props = {
  onMenuOpen: () => void;
  onMenuClose: () => void;
  isMobileMenuOpen: boolean;
};

export default function Header({
  onMenuOpen,
  onMenuClose,
  isMobileMenuOpen,
}: Props) {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  function getNavLinkClass({ isActive }: { isActive: boolean }) {
    return isActive
      ? "header__nav-link header__nav-link_active"
      : "header__nav-link";
  }

  return (
    <header
      className={isMobileMenuOpen ? "header header_type_mobile" : "header"}
    >
      <button
        type="button"
        className="header__menu-btn"
        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        aria-expanded={isMobileMenuOpen}
        onClick={isMobileMenuOpen ? onMenuClose : onMenuOpen}
      />
      <img src={Logo} alt="bioAI logo" className="header__logo" />
      <nav
        className={
          isMobileMenuOpen
            ? "header__nav header__nav_type_mobile"
            : "header__nav"
        }
      >
        {isAuthenticated && (
          <>
            <NavLink
              to="/library"
              className={getNavLinkClass}
              onClick={onMenuClose}
            >
              Library
            </NavLink>
            <NavLink
              to="/chat"
              className={getNavLinkClass}
              onClick={onMenuClose}
            >
              Chat
            </NavLink>
            <div className="header__dropdown">
              {isAccountMenuOpen && (
                <div
                  className="header__overlay"
                  onClick={() => setIsAccountMenuOpen(false)}
                />
              )}
              <button
                type="button"
                className="header__dropdown-btn"
                aria-haspopup="menu"
                aria-expanded={isAccountMenuOpen}
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
              >
                {currentUser?.name}'s Account
              </button>
              {isAccountMenuOpen && (
                <ul className="header__menu" role="menu">
                  <li role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className="header__logout-btn"
                      onClick={() => {
                        logout();
                        setIsAccountMenuOpen(false);
                      }}
                    >
                      Log out
                    </button>
                  </li>
                </ul>
              )}
            </div>
          </>
        )}
      </nav>
    </header>
  );
}
