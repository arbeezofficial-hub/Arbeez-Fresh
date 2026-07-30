import React from 'react';

interface LoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | 'white';
}

export const Loader = ({ className = '', size = 'md', color = 'primary' }: LoaderProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-[0.15em]',
    md: 'w-8 h-8 border-[0.25em]',
    lg: 'w-12 h-12 border-[0.35em]',
  };
  
  const colorClasses = {
    primary: 'text-emerald-500',
    secondary: 'text-slate-500',
    success: 'text-green-500',
    danger: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-cyan-500',
    light: 'text-slate-100',
    dark: 'text-slate-900',
    white: 'text-white'
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      role="status"
    >
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
        Loading...
      </span>
    </div>
  );
};
