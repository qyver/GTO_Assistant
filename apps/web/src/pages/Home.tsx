import { useNavigate } from 'react-router-dom';
import { Section, ListItem } from '@/components/Section';
import { UpgradeButton } from '@/components/UpgradeButton';
import { useAppStore } from '@/store';
import { haptic } from '@/lib/telegram';

export function Home() {
  const navigate = useNavigate();
  const trainingStreak = useAppStore((state) => state.trainingStreak);

  const modules = [
    { icon: '🎯', title: 'GTO Spot',     subtitle: 'Recommendations for common spots', path: '/gto',      iconBg: 'rgba(59,130,246,0.18)' },
    { icon: '🔍', title: 'Analyze Hand', subtitle: 'AI-powered hand history analysis',  path: '/analyze',  iconBg: 'rgba(139,92,246,0.18)' },
    { icon: '💪', title: 'Training',     subtitle: 'Daily drills & practice questions', path: '/training', iconBg: 'rgba(16,185,129,0.18)' },
    { icon: '⚖️', title: 'Equity Calc',  subtitle: 'Monte Carlo equity calculator',     path: '/equity',   iconBg: 'rgba(245,158,11,0.18)' },
  ];

  const presets = ['BTN vs BB', 'SB vs BB', 'CO vs BTN', '3bet Pot'];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">🧠 GTO Assistant</h1>
          <p className="page-subtitle">AI Poker Coach</p>
        </div>
        {trainingStreak > 0 && (
          <span className="chip chip-positive">🔥 {trainingStreak} days</span>
        )}
      </div>

      <div style={{ padding: '20px 16px 0', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Upgrade CTA */}
        <UpgradeButton className="w-full" />

        {/* Modules */}
        <Section title="Modules">
          {modules.map((m) => (
            <ListItem
              key={m.path}
              icon={m.icon}
              iconBg={m.iconBg}
              title={m.title}
              subtitle={m.subtitle}
              onClick={() => { haptic.medium(); navigate(m.path); }}
            />
          ))}
        </Section>

        {/* Quick presets */}
        <Section title="Quick Presets">
          {presets.map((p) => (
            <ListItem
              key={p}
              title={p}
              chevron={false}
              onClick={() => { haptic.light(); navigate('/gto', { state: { preset: p } }); }}
            />
          ))}
        </Section>

        {/* Footer note */}
        <div className="inline-notice" style={{ marginBottom: 8 }}>
          GTO Assistant is an educational tool. Learn better decisions — no automated play.
        </div>

      </div>
    </div>
  );
}
