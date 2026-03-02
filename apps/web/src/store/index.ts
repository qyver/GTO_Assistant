import { create } from 'zustand';
import type { UserProfile, Drill } from '@pokerbotai/shared';

interface AppState {
  // Config
  upgradeUrl: string;
  setUpgradeUrl: (url: string) => void;

  // User Profile
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;

  // Recent Hands (local only)
  recentHands: Array<{ id: string; summary: string; timestamp: number }>;
  addRecentHand: (summary: string) => void;

  // Training Progress (local only)
  trainingStreak: number;
  lastTrainingDate: string | null;
  updateTrainingStreak: () => void;

  // Current Training Session
  currentDrills: Drill[];
  currentDrillIndex: number;
  drillAnswers: boolean[];
  setCurrentDrills: (drills: Drill[]) => void;
  answerDrill: (correct: boolean) => void;
  resetTraining: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Config
  upgradeUrl: 'https://t.me/PokerBotAI_ShopBot',
  setUpgradeUrl: (url) => set({ upgradeUrl: url }),

  // User Profile
  userProfile: null,
  setUserProfile: (profile) => set({ userProfile: profile }),

  // Recent Hands
  recentHands: JSON.parse(localStorage.getItem('recentHands') || '[]'),
  addRecentHand: (summary) => {
    const hand = {
      id: Date.now().toString(),
      summary,
      timestamp: Date.now(),
    };
    const hands = [hand, ...get().recentHands].slice(0, 10); // Keep last 10
    set({ recentHands: hands });
    localStorage.setItem('recentHands', JSON.stringify(hands));
  },

  // Training Streak
  trainingStreak: parseInt(localStorage.getItem('trainingStreak') || '0', 10),
  lastTrainingDate: localStorage.getItem('lastTrainingDate'),
  updateTrainingStreak: () => {
    const today = new Date().toISOString().split('T')[0];
    const last = get().lastTrainingDate;
    let streak = get().trainingStreak;

    if (last === today) {
      // Already trained today
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (last === yesterdayStr) {
      // Consecutive day
      streak += 1;
    } else {
      // Streak broken
      streak = 1;
    }

    set({ trainingStreak: streak, lastTrainingDate: today });
    localStorage.setItem('trainingStreak', streak.toString());
    localStorage.setItem('lastTrainingDate', today);
  },

  // Training Session
  currentDrills: [],
  currentDrillIndex: 0,
  drillAnswers: [],
  setCurrentDrills: (drills) =>
    set({ currentDrills: drills, currentDrillIndex: 0, drillAnswers: [] }),
  answerDrill: (correct) => {
    const { drillAnswers, currentDrillIndex, currentDrills } = get();
    const newAnswers = [...drillAnswers, correct];
    const nextIndex = currentDrillIndex + 1;

    set({
      drillAnswers: newAnswers,
      currentDrillIndex: nextIndex,
    });

    // If completed all drills, update streak
    if (nextIndex >= currentDrills.length) {
      get().updateTrainingStreak();
    }
  },
  resetTraining: () =>
    set({
      currentDrills: [],
      currentDrillIndex: 0,
      drillAnswers: [],
    }),
}));
