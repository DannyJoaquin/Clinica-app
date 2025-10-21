export function EmptyState({ title = 'Sin datos', subtitle }: { title?: string; subtitle?: string }) {
  return (
    <div className="text-center text-gray-600 dark:text-gray-300 border border-dashed dark:border-gray-700 rounded-md py-10">
      <div className="font-medium">{title}</div>
      {subtitle && <div className="text-sm">{subtitle}</div>}
    </div>
  );
}
