import { ReactNode } from 'react';

interface SectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Section({ title, children, className = '' }: SectionProps) {
  return (
    <div className={className}>
      {title && <div className="section-title">{title}</div>}
      <div className="panel">{children}</div>
    </div>
  );
}

interface ListItemProps {
  icon?: ReactNode;
  iconBg?: string;
  title: string;
  subtitle?: string;
  value?: string;
  chevron?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ListItem({
  icon,
  iconBg,
  title,
  subtitle,
  value,
  chevron = true,
  onClick,
  className = '',
}: ListItemProps) {
  return (
    <div
      className={`list-item ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {icon && (
        <div
          className="list-item-icon"
          style={iconBg ? { background: iconBg } : undefined}
        >
          {icon}
        </div>
      )}
      <div className="list-item-body">
        <div className="list-item-title">{title}</div>
        {subtitle && <div className="list-item-subtitle">{subtitle}</div>}
      </div>
      {value && <div className="list-item-value">{value}</div>}
      {chevron && onClick && (
        <svg
          className="list-item-chevron"
          width="7"
          height="12"
          viewBox="0 0 7 12"
          fill="none"
        >
          <path
            d="M1 1l5 5-5 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}
