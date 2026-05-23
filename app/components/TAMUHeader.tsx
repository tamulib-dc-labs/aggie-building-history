import React from "react";

interface NavItem {
  href: string;
  label: string;
}

interface TAMUHeaderProps {
  title?: string;
  navigation?: NavItem[];
}

export default function TAMUHeader({ title = "Aggieland Through Time", navigation = [] }: TAMUHeaderProps) {
  return (
    <header id="navbar" className="main-header site-header--alt">
      <nav aria-label="Utility" className="utility-nav">
        <div className="utility-nav__container">
          <div className="utility-nav__left">
            <a href="https://www.tamu.edu/">
              <svg><use href="#aux_arrow-up-right"></use></svg>
              Texas A&amp;M University
            </a>
          </div>
          <div className="utility-nav__right">
            <nav className="tamu-top-bar__nav" aria-label="Institutional links">
              <a href="https://library.tamu.edu/about/hours" className="tamu-top-bar__link">Hours</a>
              <a href="https://library.tamu.edu" className="tamu-top-bar__link">Libraries</a>
              <a href="https://library.tamu.edu/mylibrary/" className="tamu-top-bar__link">My Library</a>
              <a href="https://library.tamu.edu/askus" className="tamu-top-bar__link">Help</a>
            </nav>
          </div>
        </div>
      </nav>

      <div className="site-header__identity">
        <div className="identity">
          <a href="/">
            <div className="identity__logo">
              <img alt="Logo" src="https://aux.tamu.edu/logos/boxTAM.svg" />
            </div>
            <div className="identity__wordmark">
              <span className="wordmark__small">Texas A&amp;M University</span>
              <span className="wordmark__large">{title}</span>
            </div>
          </a>
        </div>
        <div className="search">
          <form className="search__form" action="/search">
            <label htmlFor="search" className="sr-only">Search</label>
            <input name="q" placeholder="Search..." id="search" type="search" className="search__input" />
            <button type="submit" className="btn btn--icon btn--primary">
              Search <svg><use href="#aux_magnifying-glass"></use></svg>
            </button>
          </form>
        </div>
      </div>

      <div className="mobile-toggle">
        <button className="mobile-toggle__menu mobile-nav__menu" aria-expanded="false" data-mobilemenu="menu-mobile">
          Menu &amp; Search
          <div className="menu__icon"><span></span></div>
        </button>
      </div>

      <div className="nav-overlay">
        <nav className="site-header__nav">
          <div className="main-nav__mobile__top">
            <button aria-expanded="false" className="close mobile" data-mobilemenu="menu-mobile">
              Close
            </button>
          </div>
          
          <div className="search">
            <form className="search__form" action="/search">
              <label htmlFor="mobile-search" className="sr-only">Search</label>
              <input type="search" name="q" placeholder="Search..." id="mobile-search" className="search__input" />
              <button type="submit" className="btn btn--primary btn--icon">
                Search<svg><use href="#aux_angles-right"></use></svg>
              </button>
            </form>
          </div>

          <ul id="menu" className="menu">
            {navigation.map((item, index) => (
              <li className="menu-item" key={index}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
          <div className="mobile-content"></div>
        </nav>
      </div>
    </header>
  );
}
