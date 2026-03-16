type EmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`ui-empty-state ${className}`.trim()}>
      <div className="ui-empty-state-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div className="ui-empty-state-action">{action}</div> : null}
    </div>
  );
};
