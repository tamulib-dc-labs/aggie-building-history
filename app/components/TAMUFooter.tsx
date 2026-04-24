import React from "react";

const linkStyle: React.CSSProperties = { color: "#fff", textDecoration: "none" };

const navLinks = [
  { href: "https://library.tamu.edu/about/", label: "About the Libraries" },
  { href: "https://library.tamu.edu/about/phone", label: "Quick Phone & Mailing List" },
  { href: "https://library.tamu.edu/directory/", label: "Directory" },
  { href: "https://library.tamu.edu/about/employment/", label: "Employment" },
];

const contactLinks = [
  { href: "https://library.tamu.edu/askus/index", label: "Chat with Us" },
  { href: "https://library.tamu.edu/about/phone", label: "Call Us" },
  { href: "sms:9792561091", label: "Text Us @ 979-256-1091" },
  { href: "https://library.tamu.edu/askus/contact-us.php", label: "Email Us" },
];

const socialLinks = [
  { href: "https://www.facebook.com/profile.php?id=61577442545402", icon: "fa-brands fa-facebook", label: "Facebook" },
  { href: "https://www.instagram.com/tamulibraries", icon: "fa-brands fa-instagram", label: "Instagram" },
  { href: "https://twitter.com/tamulibraries", icon: "fa-brands fa-square-x-twitter", label: "Twitter" },
  { href: "https://www.youtube.com/user/tamulibrary", icon: "fa-brands fa-youtube", label: "YouTube" },
  { href: "https://linkedin.com/company/tamulibraries", icon: "fa-brands fa-linkedin", label: "LinkedIn" },
];

const utilityLinks = [
  { href: "https://howdy.tamu.edu", label: "howdy.tamu.edu" },
  { href: "https://library.tamu.edu/services/off-campus_access", label: "Off-Campus Access" },
  { href: "https://www.tamu.edu", label: "Texas A&M University" },
  { href: "https://library.tamu.edu/site-policies", label: "Site Policies" },
  { href: "https://www.tamu.edu/accessibility/", label: "Accessibility" },
  { href: "https://library.tamu.edu/texas-crews", label: "Texas CREWS" },
  { href: "https://library.tamu.edu/askus/contact-us.php", label: "Comments" },
  { href: "https://library.tamu.edu/services-status", label: "Services Status" },
];

export default function TAMUFooter() {
  return (
    <>
      <footer
        aria-label="giving and organization information"
        style={{
          background: "#500000",
          color: "#fff",
          fontFamily: "var(--font-sans, sans-serif)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "2.5rem 1.5rem",
            display: "grid",
            gridTemplateColumns: "1fr 2fr 1fr",
            gap: "2rem",
            alignItems: "start",
          }}
        >
          {/* Support button */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "0.5rem" }}>
            <a
              href="https://library.tamu.edu/about/giving/"
              style={{
                display: "block",
                padding: "1rem 1.5rem",
                border: "3px solid #fff",
                color: "#fff",
                textDecoration: "none",
                fontWeight: "700",
                fontSize: "1rem",
                textAlign: "center",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Support the Libraries
            </a>
          </div>

          {/* AskUs */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
              <img
                alt="Ask Us"
                src="https://library.tamu.edu/assets/bootstrap/images/askus_white.png"
                width={80}
                height={76}
              />
              <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: "700", lineHeight: 1.2, textTransform: "uppercase" }}>
                AskUs Anything<br />at any time.
              </h2>
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {contactLinks.map(({ href, label }) => (
                <li key={label}>
                  <a href={href} style={linkStyle}>
                    <i className="fas fa-arrow-circle-right" aria-hidden="true" style={{ marginRight: "0.5rem" }} />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Nav + Social */}
          <div>
            <ul style={{ listStyle: "none", margin: "0 0 1.5rem 0", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {navLinks.map(({ href, label }) => (
                <li key={label}><a href={href} style={linkStyle}>{label}</a></li>
              ))}
              <li>
                <a href="https://library.tamu.edu/sitemap" style={linkStyle}>Site Map</a>
                <span style={{ margin: "0 0.35rem" }}>|</span>
                <a href="https://library.tamu.edu/search/site" style={linkStyle}>Site Search</a>
              </li>
            </ul>
            <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem", fontWeight: "700" }}>Follow Us</h3>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", gap: "0.85rem" }}>
              {socialLinks.map(({ href, icon, label }) => (
                <li key={label}>
                  <a href={href} aria-label={`Follow us on ${label}`} style={{ ...linkStyle, fontSize: "1.5rem" }}>
                    <i className={icon} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </footer>

      {/* Utility bar */}
      <div
        style={{
          background: "#3b0000",
          borderTop: "1px solid rgba(255,255,255,0.15)",
          color: "#ccc",
          fontSize: "0.8rem",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0.75rem 1.5rem",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.4rem 1.5rem",
            justifyContent: "center",
          }}
        >
          {utilityLinks.map(({ href, label }) => (
            <a key={label} href={href} style={{ color: "#ccc", textDecoration: "none" }}>{label}</a>
          ))}
        </div>
      </div>
    </>
  );
}
