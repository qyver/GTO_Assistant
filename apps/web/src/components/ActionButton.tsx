import { haptic } from '@/lib/telegram';

interface ActionButtonProps {
  icon: string;
  label: string;
  onClick?: () => void;
}

export function ActionButton({ icon, label, onClick }: ActionButtonProps) {
  const handleClick = () => {
    haptic.light();
    onClick?.();
  };

  return (
    <button className="action-btn" onClick={handleClick}>
      <div className="action-btn-icon">{icon}</div>
      <span className="action-btn-label">{label}</span>
    </button>
  );
}
