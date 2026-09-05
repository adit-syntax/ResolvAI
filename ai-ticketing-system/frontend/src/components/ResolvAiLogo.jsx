import React from 'react';
import faviconImg from '../assets/favicon.png';
import iconImg from '../assets/icon.png';
import logoHorizontalDark from '../assets/logo-horizontal-dark.png';
import logoHorizontalLight from '../assets/logo-horizontal.png';

/**
 * ResolvAiLogo — Multi-variant component utilizing the official ResolvAI logo pack.
 *
 * @param {string} variant - 'icon' (default squircle), 'transparent-icon', 'horizontal' (dark theme), 'horizontal-light'
 * @param {string} className - Tailwind or custom CSS classes
 * @param {string} alt - Accessibility alt text
 */
export default function ResolvAiLogo({
  className = "w-8 h-8",
  variant = "icon",
  alt = "ResolvAI",
  ...props
}) {
  if (variant === "horizontal" || variant === "full" || variant === "dark") {
    return (
      <img
        src={logoHorizontalDark}
        alt={alt}
        className={`object-contain ${className}`}
        {...props}
      />
    );
  }

  if (variant === "horizontal-light" || variant === "light") {
    return (
      <img
        src={logoHorizontalLight}
        alt={alt}
        className={`object-contain ${className}`}
        {...props}
      />
    );
  }

  if (variant === "transparent-icon" || variant === "mark") {
    return (
      <img
        src={iconImg}
        alt={alt}
        className={`object-contain ${className}`}
        {...props}
      />
    );
  }

  // Default: squircle icon badge
  return (
    <img
      src={faviconImg}
      alt={alt}
      className={`object-contain rounded-xl select-none ${className}`}
      {...props}
    />
  );
}

export { faviconImg, iconImg, logoHorizontalDark, logoHorizontalLight };
