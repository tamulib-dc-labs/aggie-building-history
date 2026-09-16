import React from "react";

type HeroLink = {
  href: string;
  title: string;
  type?: "primary" | "secondary";
  target?: string;
};

type LandingHeroProps = {
  image: string;
  imageAlt?: string;
  superhead?: string;
  headline: string;
  description?: string;
  links?: HeroLink[];
};

export default function LandingHero({
  image,
  imageAlt = "",
  superhead,
  headline,
  description,
  links = [],
}: LandingHeroProps) {
  return (
    <div className="hero">
      <div className="hero__image">
        <img src={image} alt={imageAlt} />
      </div>
      <div className="hero__container">
        <div className="hero__content">
          <div className="heading-group heading-group--display">
            {superhead ? <span className="superhead">{superhead}</span> : null}
            <h1>{headline}</h1>
          </div>

          {description ? <p className="hero__description">{description}</p> : null}

          {links.length ? (
            <div className="hero__actions">
              {links.map((link) => (
                <a
                  key={`${link.href}-${link.title}`}
                  href={link.href}
                  target={link.target}
                  className={`btn ${link.type === "secondary" ? "btn--secondary" : "btn--cta"}`}
                >
                  {link.title}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      d="M5.5 3L10.5 8L5.5 13"
                      stroke="currentColor"
                      strokeWidth="1.618"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
