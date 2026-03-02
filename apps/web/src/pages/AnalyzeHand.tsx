import { useState } from 'react';
import { Button } from '@/components/Button';
import { Loading } from '@/components/Loading';
import { api } from '@/lib/api';
import { useAppStore } from '@/store';
import { haptic, showAlert } from '@/lib/telegram';
import type { HandAnalysisResponse } from '@pokerbotai/shared';

interface ParsedHandSummary {
  format: string;
  source: string;
  stakes?: string;
  heroCards?: string;
  heroPosition?: string;
  villainCount?: number;
  board?: { flop?: string; turn?: string; river?: string };
  potSize?: number;
  actions: string[];
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--divider)' }} />;
}

export function AnalyzeHand() {
  const [handText,     setHandText]     = useState('');
  const [loading,      setLoading]      = useState(false);
  const [analysis,     setAnalysis]     = useState<HandAnalysisResponse | null>(null);
  const [parsedSummary, setParsedSummary] = useState<ParsedHandSummary | null>(null);
  const [parseLoading, setParseLoading] = useState(false);

  const addRecentHand = useAppStore((state) => state.addRecentHand);
  const recentHands   = useAppStore((state) => state.recentHands);

  const handleParseFormat = async () => {
    if (!handText.trim()) return;
    setParseLoading(true);
    haptic.light();
    const res = await api.parseHand(handText.trim());
    setParseLoading(false);
    if (res.success && res.data) {
      setParsedSummary(res.data as ParsedHandSummary);
    } else {
      showAlert((res as any).error || 'Failed to parse hand');
    }
  };

  const handleAnalyze = async () => {
    if (!handText.trim()) { showAlert('Please enter a hand history'); return; }
    setLoading(true);
    setAnalysis(null);
    haptic.medium();
    const result = await api.analyzeHand({ rawText: handText });
    setLoading(false);
    if (result.success && result.data) {
      setAnalysis(result.data);
      addRecentHand(result.data.handSummary);
      haptic.success();
    } else {
      showAlert(result.error || 'Failed to analyze hand');
      haptic.error();
    }
  };

  const handleCopy = () => {
    if (!analysis) return;
    const text = `HAND ANALYSIS\n\n${analysis.handSummary}\n\nSTREET BY STREET:\n${
      Object.entries(analysis.streetByStreet)
        .map(([s, d]) => d ? `${s.toUpperCase()}:\n${d.recommended.join(', ')}\n${d.rationale}` : '')
        .join('\n\n')
    }\n\nKEY TAKEAWAYS:\n${analysis.takeaways.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\nNext: ${analysis.nextDrillSuggestion}`.trim();
    navigator.clipboard.writeText(text);
    haptic.success();
    showAlert('Copied to clipboard!');
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">🔍 Analyze Hand</h1>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Input panel */}
        <div className="panel">
          <div style={{ padding: '14px 16px' }}>
            <label className="field-label">Hand history</label>
            <textarea
              className="field"
              value={handText}
              onChange={(e) => setHandText(e.target.value)}
              placeholder={"Paste your hand history here or describe in natural language...\n\nExample:\n'$1/$2 cash. I have AKs on BTN. CO raises to $6, I 3bet to $18...'"}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{handText.length} / 5000</span>
              {handText.length > 30 && (
                <button
                  onClick={handleParseFormat}
                  disabled={parseLoading}
                  style={{ fontSize: 13, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', opacity: parseLoading ? 0.5 : 1 }}
                >
                  {parseLoading ? 'Parsing…' : '🔎 Detect format'}
                </button>
              )}
            </div>
          </div>

          {/* Parsed summary chips */}
          {parsedSummary && (
            <>
              <Divider />
              <div style={{ padding: '10px 16px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <span className="chip chip-accent">{parsedSummary.source} · {parsedSummary.format}</span>
                {parsedSummary.stakes && <span className="chip">{parsedSummary.stakes}</span>}
                {parsedSummary.heroCards && <span className="chip" style={{ fontFamily: 'monospace' }}>{parsedSummary.heroCards}</span>}
                {parsedSummary.heroPosition && <span className="chip">{parsedSummary.heroPosition}</span>}
                {parsedSummary.board?.flop && (
                  <span className="chip" style={{ fontFamily: 'monospace' }}>
                    {[parsedSummary.board.flop, parsedSummary.board.turn, parsedSummary.board.river].filter(Boolean).join(' ')}
                  </span>
                )}
              </div>
            </>
          )}

          <div style={{ padding: '4px 16px 16px' }}>
            <Button onClick={handleAnalyze} loading={loading} className="w-full">
              Analyze Hand
            </Button>
          </div>
        </div>

        {/* AI loading */}
        {loading && <Loading message="AI analyzing hand…" />}

        {/* Analysis results */}
        {analysis && (
          <div className="panel">
            {/* Top bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>Analysis</p>
              <button
                onClick={handleCopy}
                style={{ fontSize: 13, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                📋 Copy
              </button>
            </div>

            <Divider />

            {/* Summary */}
            <div style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Summary</p>
              <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.55 }}>{analysis.handSummary}</p>
            </div>

            <Divider />

            {/* Street by street */}
            <div style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>Street by street</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(analysis.streetByStreet).map(([street, data]) => {
                  if (!data) return null;
                  return (
                    <div key={street} style={{ background: 'var(--panel2)', borderRadius: 10, padding: '10px 12px' }}>
                      <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent)' }}>{street}</p>
                      <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--muted)' }}>Recommended: {data.recommended.join(', ')}</p>
                      <p style={{ margin: 0, fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>{data.rationale}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <Divider />

            {/* Takeaways */}
            <div style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>Key takeaways</p>
              <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {analysis.takeaways.map((t, i) => (
                  <li key={i} style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>{t}</li>
                ))}
              </ol>
            </div>

            <Divider />

            {/* Practice suggestion */}
            <div style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>Practice suggestion</p>
              <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.55 }}>{analysis.nextDrillSuggestion}</p>
            </div>
          </div>
        )}

        {/* Recent hands */}
        {recentHands.length > 0 && (
          <div>
            <div className="section-title" style={{ padding: 0, marginBottom: 8 }}>Recent (local)</div>
            <div className="panel">
              {recentHands.slice(0, 5).map((hand, i) => (
                <div key={hand.id}>
                  {i > 0 && <Divider />}
                  <div style={{ padding: '12px 16px' }}>
                    <p className="line-clamp-2" style={{ fontSize: 13, color: 'var(--text)', margin: '0 0 4px' }}>{hand.summary}</p>
                    <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>{new Date(hand.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tip */}
        <div className="inline-notice" style={{ marginBottom: 8 }}>
          💡 Paste full hand histories for the most detailed analysis.
        </div>

      </div>
    </div>
  );
}
