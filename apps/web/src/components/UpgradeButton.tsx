import { useAppStore } from '@/store';
import { openTelegramLink, haptic } from '@/lib/telegram';

export function UpgradeButton({ className = '' }: { className?: string }) {
  const upgradeUrl = useAppStore((state) => state.upgradeUrl) || 'https://t.me/PokerBotAI_ShopBot';

  const handleClick = () => {
    haptic.medium();
    openTelegramLink(upgradeUrl);
  };

  return (
    <button
      onClick={handleClick}
      className={`btn btn-primary ${className}`}
      style={{ gap: 8 }}
    >
      ⚡ Upgrade to Real-Time Assistant
    </button>
  );
}
