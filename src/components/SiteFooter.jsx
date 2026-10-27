import {
  USEFUL_LINKS,
  OUR_SERVICES,
  SOCIALS,
  WHITE_LOGO_URL,
  PRIVACY_URL,
  TERMS_URL,
} from "../constants/links";

const YEAR = new Date().getFullYear();

const LinkList = ({ title, links, className }) => (
  <div className={`footer-section ${className}`}>
    <h3>{title}</h3>
    <ul>
      {links.map((l) => (
        <li key={l.label}><a href={l.href}>{l.label}</a></li>
      ))}
    </ul>
  </div>
);

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-section logo-section">
          <div className="logo">
            <img src={WHITE_LOGO_URL} alt="Royal Gulf Shipping Logo" />
          </div>
          <p>
            RSGL is an iconic and trustworthy service provider of freight and
            shipping services via ocean, air, rail, and truck freight.
          </p>
          <address id="address">
            21 6a St - Ras Al Khor Industrial Area 2 - Dubai - United Arab Emirates
          </address>
          <div className="social-icons">
            {SOCIALS.map((s) => (
              <a key={s.label} href={s.href} aria-label={s.label}>
                <i className={s.icon}></i>
              </a>
            ))}
          </div>
        </div>

        <LinkList title="Useful Links" links={USEFUL_LINKS} className="useful-links" />
        <LinkList title="Our Services" links={OUR_SERVICES} className="our-services" />

        <div className="footer-section get-in-touch">
          <h3>Get In Touch</h3>
          <div className="footer-contact-item">
            <i className="fas fa-headset footer-contact-icon"></i>
            <div>
              <div className="footer-contact-label">For Support &amp; Reservations</div>
              <div className="footer-contact-value">
                <a href="tel:+97143331785">+971 4 333 1785</a><br />
                <a href="tel:+971509724214">+971 50 972 4214</a>
              </div>
            </div>
          </div>
          <div className="footer-contact-item">
            <i className="fas fa-clock footer-contact-icon"></i>
            <div>
              <div className="footer-contact-label">The Office Hours</div>
              <div className="footer-contact-value">Mon - Sat 8am to 6pm</div>
            </div>
          </div>
          <div className="footer-contact-item">
            <i className="fas fa-envelope footer-contact-icon"></i>
            <div>
              <div className="footer-contact-label">Send Us Email</div>
              <div className="footer-contact-value">
                <a href="mailto:info@royalgulfshipping.com">info@royalgulfshipping.com</a><br />
                <a href="mailto:hassan@royalgulfshipping.com">hassan@royalgulfshipping.com</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          &copy; {YEAR} Royal Gulf Shipping &amp; Logistics LLC
          &nbsp;|&nbsp;
          <a href={PRIVACY_URL}>Privacy Policy</a> |{" "}
          <a href={TERMS_URL}>Terms &amp; Conditions</a>
        </p>
      </div>
    </footer>
  );
}
