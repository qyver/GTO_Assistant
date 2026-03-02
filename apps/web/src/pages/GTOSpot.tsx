import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/Button';
import { FrequencyBar } from '@/components/FrequencyBar';
import { Loading } from '@/components/Loading';
import { SegmentedControl } from '@/components/SegmentedControl';
import { RangeGrid } from '@/components/RangeGrid';
import { api } from '@/lib/api';
import { haptic, showAlert } from '@/lib/telegram';
import type { GTOSpotQuery, GTORecommendation, ExplainResponse, SkillLevel } from '@pokerbotai/shared';

/** Build an approximate range grid from GTO action frequencies */
function RangeGridFromRecommendation({ rec }: { rec: GTORecommendation }) {
  const betAction = rec.actions.find((a) => a.type === 'bet' || a.type === 'raise');
  const betFreq = betAction?.frequency ?? 0;
  const PREMIUMS = new Set(['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AQs', 'AJs', 'AKo']);
  const STRONG   = new Set(['99', '88', '77', 'ATs', 'KQs', 'AQo', 'AJo', 'KQo']);
  const MEDIUM   = new Set(['66', '55', '44', 'A9s', 'A8s', 'KJs', 'QJs', 'JTs', 'T9s']);
  const range: Record<string, { hand: string; frequency: number; action: 'bet' | 'check' }> = {};
  const fill = (hands: Set<string>, mult: number) => {
    hands.forEach((h) => {
      const freq = Math.min(100, Math.round(betFreq * mult));
      range[h] = { hand: h, frequency: freq, action: freq > 50 ? 'bet' : 'check' };
    });
  };
  fill(PREMIUMS, 1.3);
  fill(STRONG, 1.0);
  fill(MEDIUM, 0.6);
  return <RangeGrid range={range as any} label={`Estimated betting range (${betFreq}% overall)`} cellSize={20} />;
}

const POSITIONS = ['BTN', 'CO', 'MP', 'EP', 'SB', 'BB'];
const STACKS    = [20, 30, 40, 60, 100];
const LEVELS    = ['beginner', 'intermediate', 'pro'] as const;

function Divider() {
  return <div style={{ height: 1, background: 'var(--divider)', margin: '0 16px' }} />;
}

export function GTOSpot() {
  const location = useLocation();
  const [format,      setFormat]      = useState<'cash' | 'tournament'>('cash');
  const [stack,       setStack]       = useState(100);
  const [heroPos,     setHeroPos]     = useState('BTN');
  const [villainPos,  setVillainPos]  = useState('BB');
  const [spotPreset,  setSpotPreset]  = useState('BTN vs BB SRP');
  const [board,       setBoard]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [recommendation, setRecommendation] = useState<GTORecommendation | null>(null);
  const [explanation,    setExplanation]    = useState<ExplainResponse | null>(null);
  const [explainLevel,   setExplainLevel]   = useState<SkillLevel>('intermediate');
  const [showExplanation, setShowExplanation] = useState(false);
  const [showRange,   setShowRange]   = useState(false);

  useEffect(() => {
    if (location.state?.preset) setSpotPreset(location.state.preset);
  }, [location]);

  const handleGetRecommendation = async () => {
    setLoading(true);
    setRecommendation(null);
    setExplanation(null);
    setShowExplanation(false);
    haptic.medium();
    const query: GTOSpotQuery = {
      format, stack,
      positions: { hero: heroPos as any, villain: villainPos as any },
      spotPreset,
      board: board || 'dry',
      potSize: 2.5,
      effectiveStack: stack,
    };
    const result = await api.getSpotRecommendation(query);
    setLoading(false);
    if (result.success && result.data) {
      setRecommendation(result.data);
      haptic.success();
    } else {
      showAlert(result.error || 'Failed to get recommendation');
      haptic.error();
    }
  };

  const handleExplain = async () => {
    if (!recommendation) return;
    setLoading(true);
    haptic.medium();
    const result = await api.explainGTO({
      spotContext: {
        format, stack,
        positions: { hero: heroPos as any, villain: villainPos as any },
        spotPreset,
        board: board || 'dry',
        potSize: 2.5,
        effectiveStack: stack,
      },
      gtoOutput: recommendation,
      level: explainLevel,
    });
    setLoading(false);
    if (result.success && result.data) {
      setExplanation(result.data);
      setShowExplanation(true);
      haptic.success();
    } else {
      showAlert(result.error || 'Failed to generate explanation');
      haptic.error();
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">🎯 GTO Spot</h1>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Input form panel */}
        <div className="panel">
          {/* Format */}
          <div style={{ padding: '14px 16px' }}>
            <label className="field-label">Format</label>
            <SegmentedControl
              options={[{ value: 'cash', label: 'Cash Game' }, { value: 'tournament', label: 'Tournament' }]}
              value={format}
              onChange={(v) => { setFormat(v as any); haptic.selection(); }}
            />
          </div>

          <Divider />

          {/* Stack */}
          <div style={{ padding: '14px 16px' }}>
            <label className="field-label">Stack (bb)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {STACKS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setStack(s); haptic.selection(); }}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    borderRadius: 8,
                    border: stack === s ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                    background: stack === s ? 'rgba(77,159,255,0.12)' : 'var(--panel2)',
                    color: stack === s ? 'var(--accent)' : 'var(--muted)',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {s}bb
                </button>
              ))}
            </div>
          </div>

          <Divider />

          {/* Positions */}
          <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="field-label">Hero position</label>
              <select className="field" value={heroPos} onChange={(e) => setHeroPos(e.target.value)}>
                {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Villain position</label>
              <select className="field" value={villainPos} onChange={(e) => setVillainPos(e.target.value)}>
                {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <Divider />

          {/* Spot preset */}
          <div style={{ padding: '14px 16px' }}>
            <label className="field-label">Spot preset</label>
            <input
              type="text"
              className="field"
              value={spotPreset}
              onChange={(e) => setSpotPreset(e.target.value)}
              placeholder="e.g., BTN vs BB SRP"
            />
          </div>

          <Divider />

          {/* Board */}
          <div style={{ padding: '14px 16px' }}>
            <label className="field-label">Board (optional)</label>
            <input
              type="text"
              className="field"
              value={board}
              onChange={(e) => setBoard(e.target.value)}
              placeholder="e.g., Ks7d2c  or leave blank for 'dry'"
            />
          </div>

          {/* Submit */}
          <div style={{ padding: '4px 16px 16px' }}>
            <Button onClick={handleGetRecommendation} loading={loading} className="w-full">
              Get GTO Recommendation
            </Button>
          </div>
        </div>

        {/* AI loading state */}
        {loading && !recommendation && <Loading message="AI thinking…" />}

        {/* Results */}
        {recommendation && (
          <>
            {/* Action frequencies */}
            <div className="panel-padded">
              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>
                Recommended actions
              </p>
              {recommendation.actions
                .sort((a, b) => b.frequency - a.frequency)
                .map((action, i) => (
                  <FrequencyBar
                    key={i}
                    label={action.type.toUpperCase()}
                    frequency={action.frequency}
                    color={i === 0 ? 'green' : 'primary'}
                  />
                ))}

              {recommendation.sizes.length > 0 && (
                <>
                  <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', margin: '16px 0 12px' }}>
                    Bet sizes (% pot)
                  </p>
                  {recommendation.sizes.map((size, i) => (
                    <FrequencyBar key={i} label={`${size.size}% pot`} frequency={size.frequency} />
                  ))}
                </>
              )}

              {/* Confidence */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, marginTop: 14, borderTop: '1px solid var(--divider)' }}>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Confidence</span>
                <span style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: recommendation.meta.confidence >= 90 ? 'var(--positive)'
                       : recommendation.meta.confidence >= 70 ? 'var(--warning)'
                       : 'var(--negative)',
                }}>
                  {recommendation.meta.confidence}%
                </span>
              </div>

              {recommendation.meta.suggestions && recommendation.meta.suggestions.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  {recommendation.meta.suggestions.map((s, i) => (
                    <p key={i} style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>• {s}</p>
                  ))}
                </div>
              )}

              {/* Range toggle */}
              <button
                onClick={() => { haptic.light(); setShowRange((v) => !v); }}
                style={{ marginTop: 14, width: '100%', fontSize: 13, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center' }}
              >
                {showRange ? 'Hide range grid' : '🧠 Show range visualization'}
              </button>

              {showRange && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--divider)', overflowX: 'auto' }}>
                  <RangeGridFromRecommendation rec={recommendation} />
                </div>
              )}
            </div>

            {/* Explain panel */}
            {!showExplanation && (
              <div className="panel-padded">
                <label className="field-label">Explanation level</label>
                <SegmentedControl
                  options={LEVELS.map((l) => ({ value: l, label: l.charAt(0).toUpperCase() + l.slice(1) }))}
                  value={explainLevel}
                  onChange={(v) => { setExplainLevel(v as SkillLevel); haptic.selection(); }}
                  className="mb-3"
                />
                <div style={{ marginTop: 12 }}>
                  <Button onClick={handleExplain} loading={loading} className="w-full" variant="secondary">
                    💡 Explain with AI
                  </Button>
                </div>
              </div>
            )}

            {/* Explanation results */}
            {showExplanation && explanation && (
              <div className="panel-padded" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 0 }}>
                  AI Explanation
                </p>

                {[
                  { label: 'Summary',         content: explanation.shortSummary },
                  { label: 'Street Plan',     content: explanation.streetPlan },
                ].map(({ label, content }) => (
                  <div key={label}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                    <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.55 }}>{content}</p>
                  </div>
                ))}

                {[
                  { label: 'Key Reasons',     items: explanation.keyReasons },
                  { label: 'Common Mistakes', items: explanation.commonMistakes },
                  ...(explanation.exploitNotes.length > 0 ? [{ label: 'Exploit Notes', items: explanation.exploitNotes }] : []),
                ].map(({ label, items }) => (
                  <div key={label}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {items.map((item, i) => (
                        <p key={i} style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>• {item}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
