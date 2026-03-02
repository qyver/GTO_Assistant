import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { Loading } from '@/components/Loading';
import { api } from '@/lib/api';

interface LeaderboardEntry {
  rank: number;
  displayName: string;
  totalDrills: number;
  correctDrills: number;
  accuracy: number;
  streak: number;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  myRank: { rank: number; accuracy: number; totalDrills: number } | null;
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function AccuracyBadge({ pct }: { pct: number }) {
  const color =
    pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-yellow-400' : 'text-red-400';
  return <span className={`font-bold ${color}`}>{pct.toFixed(0)}%</span>;
}

export function Leaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getLeaderboard().then((res) => {
      if (res.success && res.data) {
        setData(res.data as LeaderboardData);
      } else {
        setError((res as any).error || 'Failed to load leaderboard');
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <Loading message="Loading leaderboard…" />;

  if (error) {
    return (
      <div className="p-4 text-center py-12">
        <p className="text-4xl mb-3">⚠️</p>
        <p className="text-dark-muted">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { leaderboard, myRank } = data;

  return (
    <div className="p-4 space-y-5 pb-24">
      <div className="pt-4">
        <h1 className="text-2xl font-bold">🏆 Leaderboard</h1>
        <p className="text-dark-muted text-sm mt-1">Top players by training accuracy (min. 5 drills)</p>
      </div>

      {/* My rank banner */}
      {myRank && (
        <div className="bg-primary-600/20 border border-primary-500/40 rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-primary-400 font-semibold">Your Rank</p>
            <p className="text-2xl font-bold text-dark-text">#{myRank.rank}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-dark-muted">Accuracy</p>
            <AccuracyBadge pct={myRank.accuracy} />
          </div>
          <div className="text-right">
            <p className="text-xs text-dark-muted">Drills</p>
            <p className="font-bold text-dark-text">{myRank.totalDrills}</p>
          </div>
        </div>
      )}

      {/* Table */}
      {leaderboard.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-4xl mb-3">🎯</p>
          <p className="font-semibold mb-1">No scores yet</p>
          <p className="text-sm text-dark-muted">Complete at least 5 training drills to appear here.</p>
        </Card>
      ) : (
        <Card>
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <div key={entry.rank} className="flex items-center gap-3">
                {/* Medal / rank */}
                <span className="text-xl w-8 text-center flex-shrink-0">
                  {MEDAL[entry.rank] ?? `#${entry.rank}`}
                </span>

                {/* Name + drills */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-dark-text truncate">{entry.displayName}</p>
                  <p className="text-xs text-dark-muted">{entry.totalDrills} drills</p>
                </div>

                {/* Accuracy */}
                <div className="text-right flex-shrink-0">
                  <AccuracyBadge pct={entry.accuracy} />
                  {entry.streak > 1 && (
                    <p className="text-[10px] text-dark-muted">🔥 {entry.streak}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="bg-dark-card/50 border-dark-border/50">
        <p className="text-xs text-dark-muted text-center">
          Rankings update after each completed training session. Minimum 5 drills required to appear.
        </p>
      </Card>
    </div>
  );
}
