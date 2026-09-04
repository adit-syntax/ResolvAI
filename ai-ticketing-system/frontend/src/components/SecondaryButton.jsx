import React from 'react';

export default function SecondaryButton({ children, onClick, className = '', ...props }) {
  return (
    <button
      onClick={onClick}
      className={`btn-secondary ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
