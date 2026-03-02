import { formatFrequency } from '@pokerbotai/shared';

interface FrequencyBarProps {
  label: string;
  frequency: number;
  color?: string;
}

const colorMap: Record<string, string> = {
  primary: 'var(--accent)',
  green:   'var(--positive)',
  yellow:  'var(--warning)',
  red:     'var(--negative)',
};

export function FrequencyBar({ label, frequency, color = 'primary' }: FrequencyBarProps) {
  const fillColor = colorMap[color] ?? colorMap.primary;

  return (
    <div className="freq-bar">
      <div className="freq-bar-header">
        <span className="freq-bar-label">{label}</span>
        <span className="freq-bar-value">{formatFrequency(frequency)}</span>
      </div>
      <div className="freq-bar-track">
        <div
          className="freq-bar-fill"
          style={{ width: `${frequency}%`, background: fillColor }}
        />
      </div>
    </div>
  );
}
