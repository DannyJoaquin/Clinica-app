import React from 'react';

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={'bg-white dark:bg-gray-900 shadow rounded p-4 ' + className}>{children}</section>;
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={'mb-3 ' + className}>{children}</div>;
}
