import React from "react";
import { SearchPanelTeaserResults } from "@canopy-iiif/app/ui/server";
import { withBasePath } from "@canopy-iiif/app/base-path";

/**
 * Aggie UX site header, mirroring the library.tamu.edu production header
 * (utility nav + identity + main nav). Only the site title and the main nav
 * links are this project's own; the library mega menus are left out.
 *
 * Root-relative hrefs ("/search", "/map", "/") are prefixed with the
 * CANOPY_BASE_PATH by Canopy at build time. Library links are absolute
 * because this site is not served from library.tamu.edu.
 *
 * Dropdowns and the mobile menu are driven by AUX's aux.js (loaded in
 * content/_app.mdx). Styles come from app/styles/aux-chrome.css, which is
 * scoped to `.aux-chrome` so AUX's element rules never reach Canopy's UI.
 */

// Site search: AUX Search Bar markup, wired to Canopy's search-form runtime
// (scripts/canopy-search-form.js). The runtime finds its parts by these data
// attributes only — host [data-canopy-search-form] with a JSON config script,
// a `.relative` wrapper, [data-canopy-search-form-input], and Canopy's own
// suggestion panel ([data-canopy-search-form-panel] > #cplist). Mirrors what
// Canopy's <SearchPanel> renders; if a Canopy upgrade changes that contract,
// compare against SearchPanel in @canopy-iiif/app/ui.
const SEARCH_PATH = withBasePath("/search");
const searchConfig = {
  placeholder: "Search Historic Buildings",
  hotkey: "mod+k",
  maxResults: 8,
  groupOrder: ["work", "docs", "page"],
  label: "Search",
  searchPath: SEARCH_PATH,
};

const SiteSearch = () => (
  <div className="search aux-chrome__search" data-canopy-search-form="true">
    <div className="relative w-full">
      <form className="search__form" action={SEARCH_PATH} method="get" role="search" autoComplete="off">
        <label htmlFor="site-search" className="sr-only">
          Search
        </label>
        <input
          id="site-search"
          type="search"
          name="q"
          placeholder={searchConfig.placeholder}
          className="search__input"
          data-canopy-search-form-input="true"
        />
        <button type="submit" className="btn btn--primary btn--icon" data-canopy-search-form-trigger="submit">
          Search
          <svg aria-hidden="true" focusable="false">
            <use xlinkHref="#aux_angles-right" />
          </svg>
        </button>
      </form>
      <SearchPanelTeaserResults />
    </div>
    <script type="application/json" dangerouslySetInnerHTML={{ __html: JSON.stringify(searchConfig) }} />
  </div>
);

const LIB = "https://library.tamu.edu";

const navigation = [
  { href: "/search", label: "Buildings" },
  { href: "/map", label: "Map" },
];

const ctas = [
  { href: `${LIB}/askus.html`, label: "Help" },
  { href: `${LIB}/about/hours.html`, label: "Hours" },
  { href: `${LIB}/mylibrary`, label: "My Library" },
];

const libraries = [
  { href: `${LIB}/cushing/index.html`, label: "Cushing Memorial Library & Archives" },
  { href: `${LIB}/galveston/index.html`, label: "Jack K. Williams Library - Galveston" },
  { href: `${LIB}/medical-sciences/index.html`, label: "Medical Sciences Library" },
  { href: `${LIB}/index.html`, label: "Sterling C. Evans Library & Annex" },
  { href: `${LIB}/wcl/index.html`, label: "West Campus Library" },
];

const informationFor = [
  { href: `${LIB}/undergrad-info.html`, label: "Undergraduates" },
  { href: `${LIB}/grad-info.html`, label: "Graduates" },
  { href: `${LIB}/faculty-info.html`, label: "Faculty" },
  { href: `${LIB}/services/accessibility.html`, label: "Individuals with Disabilities" },
];

type Link = { href: string; label: string };

const Icon = ({ name }: { name: string }) => (
  <svg aria-hidden="true" focusable="false">
    <use xlinkHref={`#${name}`} />
  </svg>
);

const Ctas = () => (
  <ul className="utility-nav__ctas">
    {ctas.map(({ href, label }) => (
      <li className="utility-nav__cta" key={label}>
        <a href={href}>{label}</a>
      </li>
    ))}
  </ul>
);

// The desktop and mobile copies need distinct ids; production repeats them.
const Dropdowns = ({ idSuffix }: { idSuffix: string }) => (
  <>
    <div className="menu-item menu-item--dropdown">
      <button
        aria-controls={`for-you-dropdown${idSuffix}`}
        aria-expanded="false"
        aria-pressed="false"
        className="utility-nav__persona dropdown-toggle"
        data-toggle="dropdown"
        id={`libraries${idSuffix}`}
        type="button"
      >
        <Icon name="aux_building-columns" />
        Libraries
      </button>
      <div className="for-you dropdown" id={`for-you-dropdown${idSuffix}`}>
        <ul aria-label="Libraries dropdown" className="personas dropdown-items">
          {libraries.map(({ href, label }: Link) => (
            <li key={label}>
              <a href={href}>{label}</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
    <div className="menu-item menu-item--dropdown">
      <button
        aria-controls={`quick-links-dropdown${idSuffix}`}
        aria-expanded="false"
        aria-pressed="false"
        className="utility-nav__quicklinks dropdown-toggle"
        data-toggle="dropdown"
        id={`information-for${idSuffix}`}
        type="button"
      >
        <Icon name="aux_circle-info" />
        Information For
      </button>
      <div className="quick-links dropdown" id={`quick-links-dropdown${idSuffix}`}>
        <ul aria-label="Information For dropdown" className="quicklinks dropdown-items">
          {informationFor.map(({ href, label }: Link) => (
            <li key={label}>
              <a href={href}>{label}</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </>
);

export default function AUXHeader() {
  return (
    <div className="aux-chrome">
      <div aria-label="Skip Navigation" role="navigation">
        <a href="#main-content" className="skip">
          Skip to Main Content
        </a>
      </div>
      <header className="main-header site-header" id="navbar">
        <nav aria-label="Utility" className="utility-nav">
          <div className="utility-nav__container">
            <div className="utility-nav__left">
              <a href="https://www.tamu.edu" target="_blank" rel="noopener">
                <Icon name="aux_arrow-up-right" />
                Texas A&amp;M University
              </a>
            </div>
            <div className="utility-nav__right">
              <Ctas />
              <Dropdowns idSuffix="" />
            </div>
          </div>
        </nav>
        <div className="main-header__wrapper main-header__wrapper-college">
          <div className="site-header__identity">
            <div className="site-title">
              <a href="/">Aggieland Through Time</a>
            </div>
            {/* Libraries lockup, as on the Cushing Memorial Library header. */}
            <div className="identity">
              <a aria-label="Texas A&amp;M University Libraries" href={`${LIB}/index.html`}>
                <div className="identity__logo">
                  <img alt="Texas A&amp;M University" src="https://aux.tamu.edu/logos/boxTAM.svg" />
                </div>
                <div className="identity__wordmark">
                  <span className="wordmark__small">Texas A&amp;M University</span>
                  <span className="wordmark__large">Libraries</span>
                </div>
              </a>
            </div>
          </div>
          <div className="mobile-toggle">
            <button
              aria-expanded="false"
              className="mobile-toggle__menu mobile-nav__menu"
              data-mobilemenu="menu-mobile"
            >
              Menu &amp; Search
              <div className="menu__icon">
                <span></span>
              </div>
            </button>
          </div>
          <div className="nav-overlay">
            <nav aria-label="Main Navigation" className="main-nav main-nav--college" id="mega-menu">
              <div className="main-nav__mobile__top">
                <button aria-expanded="true" className="close mobile active" data-mobilemenu="menu-mobile">
                  Close
                </button>
              </div>
              <ul className="main-nav__links">
                {navigation.map(({ href, label }) => (
                  <li className="main-nav__item" key={href}>
                    <a href={href}>{label}</a>
                  </li>
                ))}
              </ul>
              <SiteSearch />
              <div className="mobile-content">
                <Ctas />
                <Dropdowns idSuffix="-mobile" />
              </div>
            </nav>
          </div>
        </div>
      </header>
    </div>
  );
}
