import React from 'react';

type PageHeroProps = {
  chip?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
};

export const PageHero: React.FC<PageHeroProps> = ({
  chip,
  title,
  description,
  actions,
  aside,
  className = '',
}) => (
  <section className={`ui-page-hero glass-card ${className}`.trim()}>
    <div className="ui-page-hero-copy">
      {chip ? <span className="ph-chip">{chip}</span> : null}
      <h1>{title}</h1>
      <p>{description}</p>
      {actions ? <div className="ui-page-hero-actions">{actions}</div> : null}
    </div>
    {aside ? <div className="ui-page-hero-aside">{aside}</div> : null}
  </section>
);
