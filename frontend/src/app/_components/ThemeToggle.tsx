"use client";
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const hasClass = document.documentElement.classList.contains('dark');
      const initial = stored ? stored === 'dark' : (hasClass || prefersDark);
      setDark(initial);
      apply(initial);
    } catch {}
  }, []);

  function apply(d: boolean) {
    const root = document.documentElement;
    if (d) root.classList.add('dark');
    else root.classList.remove('dark');
  }

  function toggle() {
    const next = !dark;
    setDark(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    apply(next);
  }

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
      title="Cambiar tema"
      aria-label="Cambiar tema"
      type="button"
    >
      {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
