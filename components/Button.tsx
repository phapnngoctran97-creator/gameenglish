import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "font-bold rounded-lg border-b-4 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-wider font-pixel";
  
  const variants = {
    primary: "bg-blue-500 border-blue-700 hover:bg-blue-400 text-white",
    secondary: "bg-purple-500 border-purple-700 hover:bg-purple-400 text-white",
    danger: "bg-red-500 border-red-700 hover:bg-red-400 text-white",
    success: "bg-green-500 border-green-700 hover:bg-green-400 text-white",
  };

  const sizes = {
    sm: "px-3 py-1 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};