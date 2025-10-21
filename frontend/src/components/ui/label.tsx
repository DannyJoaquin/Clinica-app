import React from 'react';

export function Label({ children, className = '', ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={'text-sm text-gray-700 dark:text-gray-300 ' + className} {...props}>
      {children}
    </label>
  );
}
