import React from "react";
// Internal helper exposed by canopy-iiif for reading the `featured` list
// from canopy.yml and resolving it against the built manifest cache.
// eslint-disable-next-line @typescript-eslint/no-var-requires
import featuredHelpers from "@canopy-iiif/app/lib/components/featured.js";

type HeroLink = {
  href: string;
  title: string;
  type?: "primary" | "secondary";
  target?: string;
};

type FeaturedItem = {
  title?: string;
  href?: string;
  thumbnail?: string;
};

type LandingHeroProps = {
  /** Explicit image URL. Omit to use a featured item's thumbnail instead. */
  image?: string;
  imageAlt?: string;
  superhead?: string;
  /** Explicit headline. Omit to use the featured item's title instead. */
  headline?: string;
  description?: string;
  links?: HeroLink[];
  /** Pick a random featured item each build. Default true. Ignored if `index` or `image` is set. */
  random?: boolean;
  /** Pick a specific featured item by index instead of randomly. */
  index?: number;
  /** Label for the bottom-right link to the featured item. Set to false to hide it. */
  itemLinkLabel?: string | false;
};

const basePath = (() => {
  try {
    return String(process.env.CANOPY_BASE_PATH || "").replace(/\/$/, "");
  } catch (_) {
    return "";
  }
})();

function applyBasePath(href?: string): string {
  if (!href) return "";
  if (!basePath) return href;
  if (href.startsWith("/")) return `${basePath}${href}`;
  return href;
}

function resolveFeaturedItem(random?: boolean, index?: number): FeaturedItem | null {
  const list: FeaturedItem[] =
    featuredHelpers && typeof featuredHelpers.readFeaturedFromCacheSync === "function"
      ? featuredHelpers.readFeaturedFromCacheSync()
      : [];
  if (!list.length) return null;
  if (typeof index === "number") {
    const clamped = Math.max(0, Math.min(list.length - 1, Math.floor(index)));
    return list[clamped];
  }
  if (random !== false) {
    return list[Math.floor(Math.random() * list.length)];
  }
  return list[0];
}

export default function LandingHero({
  image,
  imageAlt,
  superhead,
  headline,
  description,
  links = [],
  random = true,
  index,
  itemLinkLabel = "View Item",
}: LandingHeroProps) {
  const featured = image ? null : resolveFeaturedItem(random, index);

  const finalImage = image || featured?.thumbnail || "";
  const finalImageAlt = imageAlt || featured?.title || "";
  const finalHeadline = headline || featured?.title || "";
  const itemHref = featured?.href ? applyBasePath(featured.href) : null;

  if (!finalImage || !finalHeadline) return null;

  return (
    <div className="hero">
      <div className="hero__image">
        <img src={finalImage} alt={finalImageAlt} />
        {itemHref && itemLinkLabel ? (
          <a href={itemHref} className="hero__item-link">
            {itemLinkLabel}
            <svg
              width="14"
              height="14"
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
        ) : null}
      </div>
      <div className="hero__container">
        <div className="hero__content">
          <div className="heading-group heading-group--display">
            {superhead ? <span className="superhead">{superhead}</span> : null}
            <h1>Explore Our History</h1>
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
