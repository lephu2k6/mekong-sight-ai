type QuickActionCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: React.ReactNode;
  className?: string;
};

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => (
  <article className={`ui-quick-action ${className}`.trim()}>
    <div className="ui-quick-action-icon">{icon}</div>
    <div className="ui-quick-action-copy">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
    <div className="ui-quick-action-cta">{action}</div>
  </article>
);
