interface PlayerValueBadgeProps {
  value: number | undefined;
  size?: 'sm' | 'md';
}

export function PlayerValueBadge({ value, size = 'sm' }: PlayerValueBadgeProps) {
  if (value === undefined) return null;

  const formatted = value.toLocaleString();

  return (
    <span
      className={`inline-flex items-center font-medium rounded ${
        size === 'sm'
          ? 'text-xs px-2 py-0.5'
          : 'text-sm px-2.5 py-1'
      } bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`}
    >
      {formatted}
    </span>
  );
}
