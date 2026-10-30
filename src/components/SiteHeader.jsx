import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MAIN_NAV,
  SERVICE_NAV,
  WHITE_LOGO_URL,
  QUOTE_URL,
} from "../constants/links";

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

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
            <i className="fas fa-map-marker-alt"></i> Ras Al Khor Industrial
            Area, Dubai
          </a>
        </div>
      </div>

      <motion.header
        className={`main-header${scrolled ? " scrolled" : ""}`}
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <a className="logo" href="/" aria-label="Royal Gulf Shipping home">
          <img src="/logo.jpeg" alt="Royal Gulf Shipping Logo" />
        </a>
        <nav className="main-nav" aria-label="Main">
          {MAIN_NAV.map((l) => (
            <a key={l.label} href={l.href}>
              {l.label}
            </a>
          ))}
          <a className="nav-cta" href={QUOTE_URL}>
            Get a quote
          </a>
        </nav>
        <button
          type="button"
          className={`burger${menuOpen ? " open" : ""}`}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.nav
              className="mobile-nav"
              aria-label="Mobile"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 36 }}
            >
              <div className="mobile-logo">
                <img src={WHITE_LOGO_URL} alt="Royal Gulf Shipping Logo" />
              </div>
              <button
                type="button"
                className="close-btn"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              >
                &times;
              </button>
              <ul>
                {[...MAIN_NAV, ...SERVICE_NAV].map((l, i) => (
                  <motion.li
                    key={l.label}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + i * 0.03 }}
                  >
                    <a href={l.href} onClick={() => setMenuOpen(false)}>
                      {l.label}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      <nav className="sub-menu-2" aria-label="Services">
        <ul className="sub-menu">
          {SERVICE_NAV.map((l) => (
            <li key={l.label} className="nav-items">
              <a href={l.href}>{l.label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
