import React from "react";

/**
 * Aggie UX slim footer, mirroring the library.tamu.edu production footer.
 * Library links are absolute because this site is not served from
 * library.tamu.edu. Styles come from app/styles/aux-chrome.css (scoped to
 * `.aux-chrome`); icons come from the AUX sprite loaded by
 * assets/aux-sprite.js.
 */

const LIB = "https://library.tamu.edu";

const social = [
  { href: "https://twitter.com/tamulibraries", icon: "aux_x-twitter", name: "X" },
  { href: "https://www.facebook.com/profile.php?id=61577442545402", icon: "aux_facebook", name: "Facebook" },
  { href: "https://www.instagram.com/tamulibraries", icon: "aux_instagram", name: "Instagram" },
  { href: "https://m.youtube.com/tamulibraries", icon: "aux_youtube", name: "YouTube" },
  { href: "https://linkedin.com/company/tamulibraries", icon: "aux_linkedin", name: "LinkedIn" },
];

const quickLinks = [
  { href: `${LIB}/about/index.html`, label: "About the Libraries" },
  { href: `${LIB}/about/phone.html`, label: "Quick Phone & Mailing List" },
  { href: `${LIB}/directory/`, label: "Directory" },
  { href: `${LIB}/about/employment.html`, label: "Employment" },
  { href: `${LIB}/sitemap.html`, label: "Site Map" },
];

const compliance = [
  { href: "https://www.tamu.edu/statements/index.html", label: "Statement" },
  { href: "https://itaccessibility.tamu.edu/", label: "Accessibility" },
];

const Icon = ({ name }: { name: string }) => (
  <svg aria-hidden="true" focusable="false">
    <use xlinkHref={`#${name}`} />
  </svg>
);

export default function TAMUFooter() {
  return (
    <div className="aux-chrome">
      <footer className="footer--slim">
        <div className="footer__container">
          <div className="footer__columns">
            <div className="footer__column footer__column--identity">
              <div className="identity identity--stacked">
                <a href={`${LIB}/index.html`}>
                  <div className="identity__logo">
                    <img alt="Texas A&amp;M University" src="https://cache.cloud.tamu.edu/web-assets/logos/TAM-LogoBox.png" />
                  </div>
                  <div className="identity__wordmark">
                    <span className="wordmark__small">Texas A&amp;M University</span>
                    <span className="wordmark__large">Libraries</span>
                  </div>
                </a>
              </div>
            </div>

            <div className="footer__column column__links">
              <span className="column__header">Follow Us!</span>
              <div className="social-list">
                <ul>
                  {social.map(({ href, icon, name }) => (
                    <li key={icon}>
                      <a href={href}>
                        <Icon name={icon} />
                        @tamulibraries
                        {/* Production reads every link as just "@tamulibraries" (icons are
                            aria-hidden); name the platform for screen readers. */}
                        <span className="sr-only"> on {name}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="footer__column column__links">
              <span className="column__header">Quick Links</span>
              <div className="link-list link-list--leading">
                <ul>
                  {quickLinks.map(({ href, label }) => (
                    <li key={label}>
                      <a href={href}>{label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="footer__column column__links">
              <span className="column__header">Contact Us</span>
              {/* Cushing Memorial Library & Archives contact block (production markup). */}
              <address>
                <div>
                  <div>
                    <p>
                      <strong>Mailing Address:</strong>
                      <br />
                      Cushing Memorial Library &amp; Archives
                      <br />
                      TAMU 5000
                      <br />
                      College Station, TX 77843-5000
                    </p>
                    <p>
                      <strong>Physical Address:</strong>
                      <br />
                      400 Spence St.
                      <br />
                      Main Campus near the Central Campus Garage
                    </p>
                  </div>
                  <div></div>
                </div>
                <br />
                <a className="btn btn--cta" href={`${LIB}/about/giving/index.html`}>
                  Give to the Libraries <Icon name="aux_angles-right" />
                </a>
              </address>
            </div>
          </div>
        </div>

        <div className="footer__compliance-wrapper">
          <div className="footer__compliance">
            <ul className="compliance__list">
              <li>
                © {new Date().getFullYear()} <a href="https://www.tamu.edu">Texas A&amp;M University</a>
              </li>
              {compliance.map(({ href, label }) => (
                <li key={label}>
                  <a href={href}>{label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
