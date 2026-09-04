import React from 'react';
import heroImg from '../assets/hero_illustration.jpg';

export default function HeroIllustration({ className = '' }) {
  return (
    <img
      src={heroImg}
      alt="Hero illustration"
      className={`max-w-full h-auto ${className}`}
    />
  );
}
