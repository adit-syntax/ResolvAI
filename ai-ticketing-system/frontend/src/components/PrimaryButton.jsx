import React from 'react';

export default function PrimaryButton({ children, onClick, className = '', ...props }) {
  return (
    <button
      onClick={onClick}
      className={`btn-primary ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
