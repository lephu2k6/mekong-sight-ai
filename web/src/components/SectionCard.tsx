type SectionCardProps = {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  description,
  icon,
  action,
  className = '',
  children,
}) => (
  <section className={`ui-section-card glass-card ${className}`.trim()}>
    {(title || description || icon || action) && (
      <div className="ui-section-card-head">
        <div className="ui-section-card-title">
          {icon ? <span className="ui-section-card-icon">{icon}</span> : null}
          <div>
            {title ? <h2>{title}</h2> : null}
            {description ? <p>{description}</p> : null}
          </div>
        </div>
        {action ? <div className="ui-section-card-action">{action}</div> : null}
      </div>
    )}
    <div className="ui-section-card-body">{children}</div>
  </section>
);
