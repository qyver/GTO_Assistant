/**
 * RangeGrid — 13×13 hand range visualization.
 * Displays a poker hand matrix where rows/cols are ranks (A-2).
 * Suited hands appear above the diagonal, offsuit below, pairs on diagonal.
 * highlightedHands: set of hand strings like "AKs", "TT", "72o" to highlight.
 */

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

function cellKey(row: number, col: number): string {
  const r1 = RANKS[row];
  const r2 = RANKS[col];
  if (row === col) return `${r1}${r2}`; // pair
  if (row < col) return `${r1}${r2}s`; // suited (above diagonal)
  return `${r2}${r1}o`; // offsuit (below diagonal)
}

export type RangeCell = {
  hand: string;
  /** 0-100 fill percentage (bet/raise frequency) */
  frequency: number;
  /** Optional action label */
  action?: 'bet' | 'check' | 'raise' | 'call' | 'fold';
};

interface RangeGridProps {
  /** Map of hand → cell data to highlight */
  range?: Record<string, RangeCell>;
  /** Simple set of hands to highlight (full fill) */
  highlighted?: Set<string>;
  /** Label shown above the grid */
  label?: string;
  /** Size of each cell in px (default 22) */
  cellSize?: number;
}

const ACTION_COLORS: Record<string, string> = {
  bet:   'bg-blue-500',
  raise: 'bg-purple-500',
  check: 'bg-dark-border',
  call:  'bg-green-500',
  fold:  'bg-red-500/30',
};

export function RangeGrid({ range, highlighted, label, cellSize = 22 }: RangeGridProps) {
  const getCell = (hand: string): { bg: string; opacity: number } => {
    if (range?.[hand]) {
      const cell = range[hand];
      const actionColor = cell.action ? ACTION_COLORS[cell.action] : 'bg-blue-500';
      return { bg: actionColor, opacity: cell.frequency / 100 };
    }
    if (highlighted?.has(hand)) {
      return { bg: 'bg-primary-500', opacity: 1 };
    }
    return { bg: 'bg-dark-border', opacity: 0.15 };
  };

  return (
    <div>
      {label && (
        <p className="text-xs font-semibold text-dark-muted uppercase tracking-wide mb-2">{label}</p>
      )}
      <div className="overflow-x-auto">
        <div
          className="inline-grid gap-[1px] bg-dark-bg"
          style={{ gridTemplateColumns: `repeat(13, ${cellSize}px)` }}
        >
          {RANKS.map((rowRank, rowIdx) =>
            RANKS.map((colRank, colIdx) => {
              const hand = cellKey(rowIdx, colIdx);
              const { bg, opacity } = getCell(hand);
              const isPair = rowIdx === colIdx;
              const isSuited = rowIdx < colIdx;

              return (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  title={hand}
                  className={`relative flex items-center justify-center rounded-[2px] ${bg} cursor-default`}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    opacity: opacity < 0.15 ? 0.15 : opacity,
                  }}
                >
                  <span
                    className="text-[7px] font-bold leading-none select-none"
                    style={{ color: opacity > 0.4 ? 'white' : '#666' }}
                  >
                    {isPair
                      ? rowRank + rowRank
                      : isSuited
                      ? rowRank + colRank
                      : colRank + rowRank}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
      <div className="flex gap-3 mt-2">
        {Object.entries(ACTION_COLORS).map(([action, color]) => (
          <div key={action} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-sm ${color}`} />
            <span className="text-[10px] text-dark-muted capitalize">{action}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
