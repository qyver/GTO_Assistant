import type {
  GTOSpotQuery,
  GTORecommendation,
  ExplainRequest,
  ExplainResponse,
  HandAnalysisRequest,
  HandAnalysisResponse,
  TrainingGenerationResponse,
  UserProfile,
  ApiResponse,
} from '@pokerbotai/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Get authorization header with Telegram initData.
 * Falls back to "tma dev" when running outside Telegram (accepted by LOCAL_DEV_BYPASS=true).
 */
function getAuthHeader(): Record<string, string> {
  const initData = (window as any).Telegram?.WebApp?.initData;
  return {
    Authorization: initData ? `tma ${initData}` : 'tma dev',
  };
}

/**
 * Generic API fetch wrapper
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error(`[API] ${endpoint} error:`, error);
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
}

/**
 * API Client
 */
export const api = {
  // Config
  async getConfig() {
    return apiFetch<{ upgradeUrl: string; mockMode: boolean }>('/config');
  },

  // GTO
  async getSpotRecommendation(query: GTOSpotQuery) {
    return apiFetch<GTORecommendation>('/gto/spot', {
      method: 'POST',
      body: JSON.stringify(query),
    });
  },

  async explainGTO(request: ExplainRequest) {
    return apiFetch<ExplainResponse>('/gto/explain', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  // Hand Analysis
  async analyzeHand(request: HandAnalysisRequest) {
    return apiFetch<HandAnalysisResponse>('/hand/analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  // User Profile
  async getUserProfile() {
    return apiFetch<UserProfile>('/user/profile');
  },

  async saveUserProfile(profile: Partial<UserProfile>) {
    return apiFetch<UserProfile>('/user/profile', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  },

  // Training
  async generateTraining(difficulty?: string, count?: number) {
    return apiFetch<TrainingGenerationResponse>('/training/generate', {
      method: 'POST',
      body: JSON.stringify({ difficulty, count }),
    });
  },

  // Spot Presets
  async getSpotPresets() {
    return apiFetch<{ cash: string[]; tournament: string[] }>('/spots/presets');
  },

  // User Stats
  async getUserStats() {
    return apiFetch<unknown>('/user/stats');
  },

  // Hand Parser
  async parseHand(rawText: string) {
    return apiFetch<unknown>('/hand/parse', {
      method: 'POST',
      body: JSON.stringify({ rawText }),
    });
  },

  // Equity Calculator
  async calculateEquity(heroHand: string, villainHand: string, board?: string, iterations?: number) {
    return apiFetch<unknown>('/equity/calculate', {
      method: 'POST',
      body: JSON.stringify({ heroHand, villainHand, board, iterations }),
    });
  },

  // Session History
  async getUserHistory() {
    return apiFetch<unknown[]>('/user/history');
  },

  async saveHistory(type: string, title: string, data: object, createShareLink?: boolean) {
    return apiFetch<unknown>('/user/history', {
      method: 'POST',
      body: JSON.stringify({ type, title, data, createShareLink }),
    });
  },

  // Training Leaderboard
  async submitTrainingScore(payload: { drillsCompleted: number; correctAnswers: number; displayName?: string }) {
    return apiFetch<unknown>('/training/score', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getLeaderboard() {
    return apiFetch<unknown>('/leaderboard');
  },

  // Notifications
  async getNotificationPref() {
    return apiFetch<unknown>('/user/notifications');
  },

  async setNotificationPref(enabled: boolean, chatId?: string) {
    return apiFetch<unknown>('/user/notifications', {
      method: 'POST',
      body: JSON.stringify({ enabled, chatId }),
    });
  },
};
