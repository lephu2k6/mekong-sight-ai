export type StatusTone = 'safe' | 'watch' | 'warning' | 'info' | 'neutral';

type StatusBadgeProps = {
  tone?: StatusTone;
  children: React.ReactNode;
  className?: string;
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  tone = 'neutral',
  children,
  className = '',
}) => (
  <span className={`ui-status-badge tone-${tone} ${className}`.trim()}>{children}</span>
);
