import * as React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', ...props }, ref) => (
    <textarea
      ref={ref}
      className={[
        'block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900',
        'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500',
        'dark:bg-gray-900 dark:text-gray-100 dark:border-gray-800',
        className,
      ].join(' ')}
      rows={4}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export default Textarea;
