import { useState } from 'react';
import { Card } from '@/components/Card';
import { Loading } from '@/components/Loading';
import { api } from '@/lib/api';
import { haptic } from '@/lib/telegram';

interface EquityResult {
  heroWin: number;
  villainWin: number;
  tie: number;
  iterations: number;
  heroHand: string;
  villainHand: string;
}

function PieBar({ heroWin, villainWin, tie }: { heroWin: number; villainWin: number; tie: number }) {
  return (
    <div className="w-full h-4 rounded-full overflow-hidden flex">
      <div className="bg-primary-500 transition-all" style={{ width: `${heroWin}%` }} />
      <div className="bg-dark-border transition-all" style={{ width: `${tie}%` }} />
      <div className="bg-red-500 transition-all" style={{ width: `${villainWin}%` }} />
    </div>
  );
}

const HAND_PLACEHOLDER = 'e.g. AhKd';
const BOARD_PLACEHOLDER = 'e.g. Js9c2h (optional)';

export function Equity() {
  const [heroHand, setHeroHand] = useState('');
  const [villainHand, setVillainHand] = useState('');
  const [board, setBoard] = useState('');
  const [result, setResult] = useState<EquityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = async () => {
    if (!heroHand.trim() || !villainHand.trim()) {
      setError('Enter both hero and villain hands');
      return;
    }
    haptic.light();
    setLoading(true);
    setError(null);
    setResult(null);

    const res = await api.calculateEquity(
      heroHand.trim(),
      villainHand.trim(),
      board.trim() || undefined,
      5000
    );

    setLoading(false);

    if (!res.success || !res.data) {
      setError((res as any).error || (res.data as any)?.error || 'Calculation failed');
      return;
    }

    const data = res.data as any;
    if (data.error) {
      setError(data.error);
      return;
    }
    setResult(data as EquityResult);
  };

  const reset = () => {
    setHeroHand('');
    setVillainHand('');
    setBoard('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="p-4 space-y-5 pb-24">
      <div className="pt-4">
        <h1 className="text-2xl font-bold">⚖️ Equity Calculator</h1>
        <p className="text-dark-muted text-sm mt-1">Monte Carlo hand vs hand equity (5 000 iterations)</p>
      </div>

      {/* Inputs */}
      <Card>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-dark-muted mb-1">Hero Hand</label>
            <input
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-dark-text text-sm focus:outline-none focus:border-primary-500 font-mono"
              value={heroHand}
              onChange={(e) => setHeroHand(e.target.value)}
              placeholder={HAND_PLACEHOLDER}
              maxLength={6}
            />
          </div>
          <div>
            <label className="block text-xs text-dark-muted mb-1">Villain Hand</label>
            <input
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-dark-text text-sm focus:outline-none focus:border-primary-500 font-mono"
              value={villainHand}
              onChange={(e) => setVillainHand(e.target.value)}
              placeholder={HAND_PLACEHOLDER}
              maxLength={6}
            />
          </div>
          <div>
            <label className="block text-xs text-dark-muted mb-1">Board (optional — 3-5 cards)</label>
            <input
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-dark-text text-sm focus:outline-none focus:border-primary-500 font-mono"
              value={board}
              onChange={(e) => setBoard(e.target.value)}
              placeholder={BOARD_PLACEHOLDER}
              maxLength={12}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={calculate}
              disabled={loading}
              className="flex-1 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
            >
              {loading ? 'Calculating…' : 'Calculate Equity'}
            </button>
            {result && (
              <button
                onClick={reset}
                className="px-4 bg-dark-border rounded-xl text-dark-muted hover:text-dark-text transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && <Loading message="Running simulation…" />}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Visual bar */}
          <Card>
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-primary-400">{result.heroHand}</span>
                <span className="text-dark-muted text-xs self-center">{result.iterations.toLocaleString()} iters</span>
                <span className="text-red-400">{result.villainHand}</span>
              </div>
              <PieBar heroWin={result.heroWin} villainWin={result.villainWin} tie={result.tie} />
              <div className="flex justify-between text-xs text-dark-muted">
                <span>
                  <span className="text-primary-400 font-bold text-base">{result.heroWin.toFixed(1)}%</span> Hero
                </span>
                {result.tie > 0.1 && (
                  <span>
                    <span className="text-dark-text font-bold">{result.tie.toFixed(1)}%</span> Tie
                  </span>
                )}
                <span>
                  Villain <span className="text-red-400 font-bold text-base">{result.villainWin.toFixed(1)}%</span>
                </span>
              </div>
            </div>
          </Card>

          {/* Interpretation */}
          <Card>
            <p className="text-xs text-dark-muted mb-1">Reading the result</p>
            <p className="text-sm text-dark-text">
              {result.heroWin > 65
                ? `${result.heroHand} is a big favourite. Consider value-betting aggressively.`
                : result.heroWin > 55
                ? `${result.heroHand} has a small edge. Play straightforward value lines.`
                : result.heroWin > 45
                ? 'Near coin flip. Your range composition matters more than raw equity here.'
                : result.heroWin > 35
                ? `${result.villainHand} has the equity edge. Look for fold-equity if bluffing.`
                : `${result.heroHand} is a significant underdog. Proceed carefully.`}
            </p>
            {board && (
              <p className="text-xs text-dark-muted mt-2">
                Board: <span className="font-mono text-dark-text">{board}</span>
              </p>
            )}
          </Card>

          {/* Quick tips */}
          <Card className="bg-dark-card/50 border-dark-border/50">
            <p className="text-xs text-dark-muted">
              <b>Tip:</b> Equity alone doesn't determine the correct action — stack depth, position, and range
              construction all matter. Use this as a starting point, not a final answer.
            </p>
          </Card>
        </div>
      )}

      {/* Format guide */}
      {!result && !loading && (
        <Card className="bg-dark-card/50">
          <p className="text-xs font-semibold text-dark-muted mb-2">Card format guide</p>
          <div className="grid grid-cols-2 gap-1 text-xs text-dark-muted">
            <span>Ranks: A K Q J T 9–2</span>
            <span>Suits: h d c s</span>
            <span>Example: <span className="font-mono text-dark-text">AhKd</span></span>
            <span>Example: <span className="font-mono text-dark-text">Js9c2h</span></span>
          </div>
        </Card>
      )}
    </div>
  );
}
