import React from "react";

type LogoStripProps = {
  logoSrc?: string;
  logoAlt?: string;
  href?: string;
  label?: string;
};

export default function LogoStrip({
  logoSrc = "https://cache.cloud.tamu.edu/logo-strips/150.svg",
  logoAlt = "Texas A&M University 150 Here for Good logo",
  href = "https://150.tamu.edu/",
  label = "Celebrate 150 Years",
}: LogoStripProps) {
  return (
    <div className="logo-strip logo-strip--light-gray logo-strip--simple" role="banner">
      <div className="logo-strip__container">
        <div className="logo-strip__left">
          <img alt={logoAlt} src={logoSrc} />
        </div>
        <span className="dot-divider" aria-hidden="true" />
        <div className="logo-strip__right">
          <a href={href}>{label}</a>
        </div>
      </div>
    </div>
  );
}
