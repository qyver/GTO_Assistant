import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Loading } from '@/components/Loading';
import { SegmentedControl } from '@/components/SegmentedControl';
import { api } from '@/lib/api';
import { useAppStore } from '@/store';
import { haptic, showAlert } from '@/lib/telegram';
import type { SkillLevel } from '@pokerbotai/shared';

function Divider() {
  return <div style={{ height: 1, background: 'var(--divider)' }} />;
}

export function Training() {
  const navigate = useNavigate();
  const [hasProfile,    setHasProfile]    = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [notifEnabled,  setNotifEnabled]  = useState<boolean | null>(null);
  const [notifLoading,  setNotifLoading]  = useState(false);

  const [skillLevel, setSkillLevel] = useState<SkillLevel>('intermediate');
  const [formatPref, setFormatPref] = useState<'cash' | 'tournament' | 'both'>('both');
  const [stakes,     setStakes]     = useState('');
  const [goal,       setGoal]       = useState('');

  const currentDrills     = useAppStore((s) => s.currentDrills);
  const currentDrillIndex = useAppStore((s) => s.currentDrillIndex);
  const drillAnswers      = useAppStore((s) => s.drillAnswers);
  const setCurrentDrills  = useAppStore((s) => s.setCurrentDrills);
  const answerDrill       = useAppStore((s) => s.answerDrill);
  const resetTraining     = useAppStore((s) => s.resetTraining);
  const trainingStreak    = useAppStore((s) => s.trainingStreak);

  const [selectedAnswer,  setSelectedAnswer]  = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const isSessionComplete = currentDrillIndex >= currentDrills.length && currentDrills.length > 0;
  const score = drillAnswers.filter((a) => a).length;
  const total = drillAnswers.length;

  useEffect(() => {
    checkProfile();
    api.getNotificationPref().then((res) => {
      if (res.success && res.data) setNotifEnabled((res.data as any).enabled ?? false);
    });
  }, []);

  useEffect(() => {
    if (isSessionComplete && total > 0) {
      api.submitTrainingScore({ drillsCompleted: total, correctAnswers: score }).catch(() => {});
    }
  }, [isSessionComplete]);

  const checkProfile = async () => {
    setLoading(true);
    const result = await api.getUserProfile();
    setLoading(false);
    if (result.success && result.data) {
      setHasProfile(true);
      useAppStore.getState().setUserProfile(result.data);
    } else {
      setShowOnboarding(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!stakes || !goal) { showAlert('Please complete all fields'); return; }
    setLoading(true);
    const result = await api.saveUserProfile({ skillLevel, formatPreference: formatPref, typicalStakes: stakes, mainGoal: goal } as any);
    setLoading(false);
    if (result.success && result.data) {
      setHasProfile(true);
      setShowOnboarding(false);
      useAppStore.getState().setUserProfile(result.data);
      haptic.success();
    } else {
      showAlert(result.error || 'Failed to save profile');
      haptic.error();
    }
  };

  const handleGenerateDrills = async () => {
    setLoading(true);
    resetTraining();
    haptic.medium();
    const result = await api.generateTraining(undefined, 5);
    setLoading(false);
    if (result.success && result.data) {
      setCurrentDrills(result.data.drills);
      haptic.success();
    } else {
      showAlert(result.error || 'Failed to generate drills');
      haptic.error();
    }
  };

  const handleAnswerDrill = (answerIndex: number) => {
    if (selectedAnswer !== null) return;
    const drill = currentDrills[currentDrillIndex];
    const isCorrect = answerIndex === drill.correct;
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    answerDrill(isCorrect);
    if (isCorrect) haptic.success(); else haptic.error();
  };

  const handleNextDrill = () => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    haptic.light();
  };

  const handleToggleNotif = async () => {
    setNotifLoading(true);
    haptic.light();
    const newState = !notifEnabled;
    const res = await api.setNotificationPref(newState);
    setNotifLoading(false);
    if (res.success) {
      setNotifEnabled(newState);
      haptic.success();
    } else {
      showAlert((res as any).error || 'Failed to update notifications');
      haptic.error();
    }
  };

  // ── Onboarding ──────────────────────────────────────────────
  if (showOnboarding) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">💪 Training Setup</h1>
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="panel">
            <div style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16 }}>
                Complete this quick setup to personalize your training drills.
              </p>

              <label className="field-label">Skill level</label>
              <SegmentedControl
                options={[
                  { value: 'beginner',     label: 'Beginner' },
                  { value: 'intermediate', label: 'Intermediate' },
                  { value: 'pro',          label: 'Pro' },
                ]}
                value={skillLevel}
                onChange={(v) => { setSkillLevel(v as SkillLevel); haptic.selection(); }}
              />
            </div>

            <Divider />

            <div style={{ padding: '14px 16px' }}>
              <label className="field-label">Format preference</label>
              <SegmentedControl
                options={[
                  { value: 'cash',       label: 'Cash' },
                  { value: 'tournament', label: 'Tournament' },
                  { value: 'both',       label: 'Both' },
                ]}
                value={formatPref}
                onChange={(v) => { setFormatPref(v as any); haptic.selection(); }}
              />
            </div>

            <Divider />

            <div style={{ padding: '14px 16px' }}>
              <label className="field-label">Typical stakes</label>
              <input
                type="text"
                className="field"
                value={stakes}
                onChange={(e) => setStakes(e.target.value)}
                placeholder="e.g., $1/$2, $50 tournaments"
              />
            </div>

            <Divider />

            <div style={{ padding: '14px 16px' }}>
              <label className="field-label">Main goal</label>
              <input
                type="text"
                className="field"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g., improve fundamentals, climb stakes"
              />
            </div>

            <div style={{ padding: '4px 16px 16px' }}>
              <Button onClick={handleSaveProfile} loading={loading} className="w-full">
                Save Profile
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !hasProfile) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title">💪 Training</h1></div>
        <div style={{ padding: 16 }}><Loading message="Loading training…" /></div>
      </div>
    );
  }

  // ── Session complete ─────────────────────────────────────────
  if (isSessionComplete) {
    const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
    return (
      <div>
        <div className="page-header"><h1 className="page-title">💪 Training</h1></div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Score card */}
          <div className="panel-padded" style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
            <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700 }}>Session Complete!</h2>
            <div className="primary-metric-value" style={{ fontSize: 48, marginBottom: 4 }}>
              {score}<span style={{ fontSize: 24, color: 'var(--muted)', fontWeight: 400 }}>/{total}</span>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 12 }}>{accuracy}% accuracy</p>
            <p style={{ color: accuracy >= 80 ? 'var(--positive)' : accuracy >= 60 ? 'var(--warning)' : 'var(--muted)', fontSize: 15, fontWeight: 600, margin: 0 }}>
              {accuracy >= 80 ? 'Excellent work!' : accuracy >= 60 ? 'Good progress!' : 'Keep practicing!'}
            </p>
          </div>

          {trainingStreak > 0 && (
            <div className="panel-padded" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Training streak</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--warning)', margin: 0 }}>{trainingStreak} days 🔥</p>
            </div>
          )}

          <button
            onClick={() => { haptic.light(); navigate('/leaderboard'); }}
            className="panel-padded"
            style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, color: 'var(--accent)', background: 'var(--panel)', border: 'none', cursor: 'pointer', width: '100%', borderRadius: 16, padding: '14px 16px' }}
          >
            🏆 View Leaderboard
          </button>

          <Button onClick={handleGenerateDrills} loading={loading} className="w-full">
            Generate New Drills
          </Button>
        </div>
      </div>
    );
  }

  // ── Active drill ─────────────────────────────────────────────
  if (currentDrills.length > 0 && currentDrillIndex < currentDrills.length) {
    const drill = currentDrills[currentDrillIndex];
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">💪 Training</h1>
          <span className="chip">{currentDrillIndex + 1} / {currentDrills.length}</span>
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Progress dots */}
          <div style={{ display: 'flex', gap: 6 }}>
            {currentDrills.map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 99,
                  background: i < currentDrillIndex
                    ? (drillAnswers[i] ? 'var(--positive)' : 'var(--negative)')
                    : i === currentDrillIndex
                    ? 'var(--accent)'
                    : 'var(--panel2)',
                  transition: 'background 0.2s',
                }}
              />
            ))}
          </div>

          {/* Drill card */}
          <div className="panel">
            <div style={{ padding: '14px 16px' }}>
              <span className="chip chip-accent" style={{ marginBottom: 12, display: 'inline-block' }}>
                {drill.type.replace('-', ' ')}
              </span>
              <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--text)', marginBottom: 16 }}>{drill.prompt}</p>

              {/* Answer options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {drill.options.map((option, i) => {
                  const isSelected = selectedAnswer === i;
                  const isCorrect  = drill.correct === i;
                  const revealed   = selectedAnswer !== null;

                  let bg     = 'var(--panel2)';
                  let border = 'var(--border)';
                  let color  = 'var(--text)';

                  if (revealed) {
                    if (isCorrect)       { bg = 'rgba(48,209,88,0.12)'; border = 'rgba(48,209,88,0.4)';  color = 'var(--positive)'; }
                    else if (isSelected) { bg = 'rgba(255,69,58,0.12)';  border = 'rgba(255,69,58,0.4)';  color = 'var(--negative)'; }
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswerDrill(i)}
                      disabled={selectedAnswer !== null}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '12px 14px',
                        borderRadius: 10,
                        border: `1px solid ${border}`,
                        background: bg,
                        color,
                        fontSize: 14,
                        lineHeight: 1.5,
                        cursor: selectedAnswer !== null ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                      }}
                    >
                      <span style={{ color: 'var(--muted)', flexShrink: 0, fontWeight: 600 }}>
                        {String.fromCharCode(65 + i)}.
                      </span>
                      <span style={{ flex: 1 }}>{option}</span>
                      {revealed && isCorrect && <span style={{ flexShrink: 0 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Explanation */}
            {showExplanation && (
              <>
                <Divider />
                <div style={{ padding: '14px 16px' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>Explanation</p>
                  <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.55, marginBottom: 14 }}>{drill.explanation}</p>
                  <Button onClick={handleNextDrill} className="w-full" variant="secondary">
                    {currentDrillIndex < currentDrills.length - 1 ? 'Next Drill →' : 'Finish'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Main training screen ─────────────────────────────────────
  return (
    <div>
      <div className="page-header"><h1 className="page-title">💪 Training</h1></div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {trainingStreak > 0 && (
          <div className="panel-padded" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Training streak</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--warning)', margin: 0 }}>{trainingStreak} days 🔥</p>
          </div>
        )}

        <div className="panel">
          <div style={{ padding: '14px 16px' }}>
            <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Daily Drills</p>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.5 }}>
              AI-generated drills tailored to your skill level and goals.
            </p>
            <Button onClick={handleGenerateDrills} loading={loading} className="w-full">
              Generate Daily Drills
            </Button>
          </div>
        </div>

        {/* Leaderboard */}
        <button
          onClick={() => { haptic.light(); navigate('/leaderboard'); }}
          className="panel"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--panel)', border: 'none', cursor: 'pointer', width: '100%', borderRadius: 16, color: 'var(--accent)', fontSize: 14, fontWeight: 600, textAlign: 'left' }}
        >
          <span>🏆 View Leaderboard</span>
          <svg width="7" height="12" viewBox="0 0 7 12" fill="none" style={{ opacity: 0.4 }}>
            <path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Notification toggle */}
        <div className="panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
            <div>
              <p style={{ margin: '0 0 3px', fontSize: 15, fontWeight: 600 }}>Daily Reminders</p>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>Get a Telegram nudge to practice</p>
            </div>
            <button
              onClick={handleToggleNotif}
              disabled={notifLoading || notifEnabled === null}
              style={{
                width: 48,
                height: 28,
                borderRadius: 14,
                border: 'none',
                cursor: 'pointer',
                background: notifEnabled ? 'var(--positive)' : 'var(--panel2)',
                position: 'relative',
                flexShrink: 0,
                transition: 'background 0.2s',
                opacity: (notifLoading || notifEnabled === null) ? 0.5 : 1,
              }}
            >
              <span style={{
                position: 'absolute',
                top: 3,
                left: notifEnabled ? 23 : 3,
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                transition: 'left 0.2s',
              }} />
            </button>
          </div>
        </div>

        <div className="inline-notice" style={{ marginBottom: 8 }}>
          💡 Complete drills daily to build your streak and track progress!
        </div>

      </div>
    </div>
  );
}
