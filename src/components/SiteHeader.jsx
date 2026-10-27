import { useState } from "react";
import { MAIN_NAV, SERVICE_NAV, WHITE_LOGO_URL, QUOTE_URL } from "../constants/links";

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className="top-bar">
        <div className="top-bar-left">
          <a href="tel:+97143331785">
            <i className="fas fa-phone-alt"></i> +971 4 333 1785
          </a>
          <a href="mailto:info@royalgulfshipping.com">
            <i className="fas fa-envelope"></i> info@royalgulfshipping.com
          </a>
          <a href="#address">
            <i className="fas fa-map-marker-alt"></i> Ras Al Khor Industrial Area, Dubai
          </a>
        </div>
      </div>

      <header className="main-header">
        <div className="logo">
          <img src="/logo.jpeg" alt="Royal Gulf Shipping Logo" />
        </div>
        <nav className="main-nav">
          <div>
            {MAIN_NAV.map((l) => (
              <a key={l.label} href={l.href}>{l.label}</a>
            ))}
          </div>
        </nav>
        <input
          type="checkbox"
          id="mobile-menu-toggle"
          className="mobile-menu-toggle"
          checked={menuOpen}
          onChange={(e) => setMenuOpen(e.target.checked)}
        />
        <label htmlFor="mobile-menu-toggle">
          <span></span>
          <span></span>
          <span></span>
        </label>
      </header>

      {/* Mobile menu */}
      <nav className={`mobile-nav${menuOpen ? " active" : ""}`} id="mobileNav">
        <div className="mobile-logo">
          <img src={WHITE_LOGO_URL} alt="Royal Gulf Shipping Logo" />
        </div>
        <span className="close-btn" onClick={() => setMenuOpen(false)}>&times;</span>
        <ul>
          {[...MAIN_NAV, ...SERVICE_NAV].map((l) => (
            <li key={l.label}><a href={l.href}>{l.label}</a></li>
          ))}
        </ul>
      </nav>

      {/* Desktop sub menu */}
      <nav className="sub-menu-2">
        <ul className="sub-menu">
          {SERVICE_NAV.map((l) => (
            <li key={l.label} className="nav-items">
              <a href={l.href}>{l.label}</a>
            </li>
          ))}
        </ul>
      </nav>

      <div
        className="page-title-area"
        style={{ backgroundImage: 'url("/banner.png")' }}
      >
        <div className="container">
          <div className="page-title-content">
            <a id="getQuoteBtn" href={QUOTE_URL} className="search-btn">
              Get a Quote
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
