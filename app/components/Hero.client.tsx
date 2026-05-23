import React, { useState, useEffect } from 'react';

const defaultImages = [
  "https://aggieux.tamu.edu/assets/rev-BitGVSdq.jpg",
  "https://archipelago-dev.library.tamu.edu/iiif/2/4af%2Fimage-att-laah-20190514-10-5632f207-6387-42bf-b95c-2136ae2328ca.jpg/full/!1280,1280/0/default.jpg",
  "https://archipelago-dev.library.tamu.edu/iiif/2/540%2Fimage-att-fishpond-002-63e40ab3-1523-4914-ace0-b6e486ea7c7e.jpg/full/!1280,1280/0/default.jpg",
  "https://archipelago-dev.library.tamu.edu/iiif/2/040%2Fimage-att-cv-1921-1930-12-edit-79797ba7-f468-4ac4-99ad-a1578b8d7980.jp2/full/!1280,1280/0/default.jpg"
];

interface HeroButton {
  label: string;
  href: string;
  type: 'cta' | 'cta-secondary';
  icon?: string;
}

export interface Slide {
  image: string;
  headline: string;
  description: string;
  buttons?: HeroButton[];
}

interface HeroProps {
  slides?: Slide[];
}

const defaultSlides: Slide[] = [
  {
    image: "https://aggieux.tamu.edu/assets/rev-BitGVSdq.jpg",
    headline: "Aggieland Through Time",
    description: "Navigate through time with our dynamic mapping system that visualizes the physical growth and architectural evolution of campus. Explore how academic buildings, residence halls, recreational facilities, and iconic landmarks have shaped the Aggie experience across generations.",
    buttons: [
      { label: "View Map", href: "/map", type: "cta", icon: "aux_angles-right" },
      { label: "Search", href: "/search", type: "cta-secondary", icon: "aux_arrow-right-long" }
    ]
  },
  {
    image: "https://archipelago-dev.library.tamu.edu/iiif/2/4af%2Fimage-att-laah-20190514-10-5632f207-6387-42bf-b95c-2136ae2328ca.jpg/full/!1280,1280/0/default.jpg",
    headline: "Historical Timelines",
    description: "Experience the university's growth through carefully curated timelines that contextualize campus development within broader historical moments.",
    buttons: [
      { label: "View Timelines", href: "/timeline", type: "cta", icon: "aux_angles-right" }
    ]
  }
];

export default function HeroClient({ 
  slides = defaultSlides
}: HeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!slides || slides.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 4000); // 4 seconds
    
    return () => clearInterval(interval);
  }, [slides]);

  const currentSlide = slides[currentIndex] || slides[0];

  return (
    <div className="hero">
      <div className="hero__image">
        {slides.map((slide, index) => (
          <img 
            key={index}
            src={slide.image}
            alt={`Hero background ${index + 1}`}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              transition: 'opacity 1s ease-in-out',
              opacity: index === currentIndex ? 1 : 0
            }}
          />
        ))}
      </div>
      <div className="hero__container">
        <div className="hero__content">
          <div className="heading-group heading-group--display">
            <h1>{currentSlide.headline}</h1>
          </div>
          <p className="hero__description">
            {currentSlide.description}
          </p>
          <div className="button-group button-group--cta">
            {currentSlide.buttons && currentSlide.buttons.map((btn, i) => (
              <a key={i} href={btn.href} className={`btn btn--${btn.type}`}>
                {btn.label}
                {btn.icon && (
                  <svg><use href={`#${btn.icon}`}></use></svg>
                )}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
