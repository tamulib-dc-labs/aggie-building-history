import React from "react";
import { Homepage as CloverHomepage } from "@samvera/clover-iiif/primitives";

type IntlString = Record<string, string[]> | string | undefined;

type HomepageEntry = {
  id: string;
  type?: string;
  label?: IntlString;
  format?: string;
};

type ManifestHomepageProps = {
  /** The IIIF manifest, or anything with a `homepage` array (e.g. `props.manifest`). */
  manifest?: { homepage?: HomepageEntry[] };
  /** Override the link text for every entry. Omit to use each entry's own label. */
  label?: string;
  /** Header text above the value, matching the other manifest primitives (Rights, Attribution, etc). */
  header?: string;
  className?: string;
};

function firstLabelString(value: IntlString): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  const keys = Object.keys(value);
  for (const key of keys) {
    const arr = value[key];
    if (Array.isArray(arr) && arr.length && arr[0]) return String(arr[0]);
  }
  return "";
}

const ExternalLinkIcon = () => (
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
      d="M6.5 3H3.5C3.22386 3 3 3.22386 3 3.5V12.5C3 12.7761 3.22386 13 3.5 13H12.5C12.7761 13 13 12.7761 13 12.5V9.5M9.5 3H13M13 3V6.5M13 3L6.5 9.5"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function ManifestHomepage({
  manifest,
  label,
  header = "Homepage",
  className = "",
}: ManifestHomepageProps) {
  const homepage = manifest?.homepage;
  if (!Array.isArray(homepage) || !homepage.length) return null;

  return (
    <dl className={["manifest-homepage", className].filter(Boolean).join(" ")}>
      <div role="group" data-label="homepage">
        <dt>{header}</dt>
        <dd>
          {homepage.map((item, i) => {
            if (!item || !item.id) return null;
            const text = label || firstLabelString(item.label) || "View Source Record";
            return (
              <CloverHomepage
                key={item.id || i}
                homepage={[item]}
                className="manifest-homepage__link"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>{text}</span>
                <ExternalLinkIcon />
              </CloverHomepage>
            );
          })}
        </dd>
      </div>
    </dl>
  );
}
