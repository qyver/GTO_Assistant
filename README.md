# 🃏 PokerBotAi - AI Poker Coach

🌐 **Website:** [pokerbotai.com](https://pokerbotai.com/)

**PokerBotAi** is a production-ready Telegram Mini App that provides GTO poker coaching powered by Claude AI. It's a 100% free educational tool designed for player retention and acquisition, with a prominent upgrade CTA to your premium Real-Time Assistant.

---

## 🎯 Features

### Core Modules

1. **🎯 GTO Spot**
   - Quick GTO recommendations for common poker spots
   - Fuzzy matching with 30+ precomputed scenarios
   - AI-powered explanations tailored to skill level (Beginner/Intermediate/Pro)
   - Frequency bars and sizing recommendations
   - Confidence scoring and suggestions

2. **🔍 Analyze Hand**
   - Natural language hand history analysis
   - AI-powered street-by-street breakdown
   - Key takeaways and practice suggestions
   - Copy-to-clipboard functionality
   - Local recent hands tracking

3. **💪 Training**
   - Personalized daily drills
   - Three drill types: action-choice, concept-question, spot-recall
   - Training streak tracking
   - Immediate feedback with explanations
   - Skill-based difficulty adjustment

### Additional Features

- **Telegram Native**: Full integration with Telegram WebApp SDK
- **Security**: HMAC-based initData validation
- **Rate Limiting**: 50 Claude API calls per user per day
- **Caching**: 24-hour cache for identical requests
- **Mock Mode**: Development mode without Claude API key
- **Upgrade CTA**: Configurable link to premium product
- **Educational Focus**: All messaging emphasizes learning, not automation

---

## 🏗️ Architecture

### Monorepo Structure

```
pokerbotai/
├── apps/
│   ├── web/          # React + Vite + TailwindCSS frontend
│   └── api/          # Fastify + Prisma + SQLite backend
├── packages/
│   └── shared/       # TypeScript types, Zod schemas, utilities
├── docker-compose.yml
├── .env.example
└── README.md
```

### Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (fast dev + build)
- TailwindCSS (minimalist dark theme)
- Zustand (state management)
- React Router (navigation)
- @twa-dev/sdk (Telegram WebApp)

**Backend:**
- Node.js 20 + TypeScript
- Fastify (high-performance API)
- Prisma ORM
- SQLite (simple, file-based)
- Anthropic SDK (Claude API)
- Zod (validation)

**Shared:**
- TypeScript types
- Zod schemas
- Utility functions

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm or pnpm
- Docker & Docker Compose (for containerized setup)
- Telegram Bot Token (for production)
- Claude API Key (or use MOCK_CLAUDE=true)

### 1. Clone & Install

```bash
git clone <your-repo>
cd pokerbotai
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Required for Local Development:**
```env
# Development mode (bypasses Telegram auth)
LOCAL_DEV_BYPASS=true

# Mock Claude responses (no API key needed)
MOCK_CLAUDE=true

# API
API_PORT=3001

# Database
DATABASE_URL=file:./dev.db
```

**Required for Production:**
```env
# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_UPGRADE_URL=https://t.me/YourUpgradeBot

# Claude API
CLAUDE_API_KEY=your_claude_api_key_here
CLAUDE_MODEL=claude-3-5-sonnet-20241022

# Production settings
LOCAL_DEV_BYPASS=false
MOCK_CLAUDE=false
NODE_ENV=production
```

### 3. Run with Docker (Recommended)

**One command to start everything:**

```bash
npm run dev
```

This starts:
- Frontend at `http://localhost:5173`
- Backend at `http://localhost:3001`
- Database initialization and migrations

**Alternative: Run services individually**

```bash
# Terminal 1: API
npm run dev:api

# Terminal 2: Web
npm run dev:web
```

### 4. Access the App

**Local Development:**
- Frontend: http://localhost:5173
- API: http://localhost:3001
- API Health: http://localhost:3001/health

**Telegram Testing:**

To test in Telegram, you need to:
1. Create a Telegram Bot via [@BotFather](https://t.me/botfather)
2. Create a Mini App and get the URL
3. Set `TELEGRAM_BOT_TOKEN` in `.env`
4. Expose your local server (ngrok, cloudflared, etc.)
5. Configure the Mini App URL in BotFather

For local testing without Telegram, keep `LOCAL_DEV_BYPASS=true`.

---

## 📁 Project Structure

### Frontend (`apps/web`)

```
apps/web/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Layout.tsx    # Main layout with bottom nav (5 tabs)
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── FrequencyBar.tsx
│   │   ├── Loading.tsx
│   │   ├── RangeGrid.tsx     # ★ Phase 5: 13×13 hand range matrix
│   │   └── UpgradeButton.tsx
│   ├── pages/            # Route pages
│   │   ├── Home.tsx      # Home dashboard
│   │   ├── GTOSpot.tsx   # GTO recommendations + range grid
│   │   ├── AnalyzeHand.tsx   # Hand analysis + format detection
│   │   ├── Training.tsx  # Drills + leaderboard + notifications
│   │   ├── Stats.tsx         # ★ Phase 3: usage & cost stats
│   │   ├── Equity.tsx        # ★ Phase 5: Monte Carlo equity calc
│   │   └── Leaderboard.tsx   # ★ Phase 5: training leaderboard
│   ├── lib/
│   │   ├── api.ts        # API client (all endpoints)
│   │   └── telegram.ts   # Telegram SDK helpers
│   ├── store/
│   │   └── index.ts      # Zustand store
│   ├── App.tsx           # Main app + routing
│   ├── main.tsx
│   └── index.css
└── package.json
```

### Backend (`apps/api`)

```
apps/api/
├── data/gto/             # ★ Phase 2: precomputed GTO spots
│   ├── cash-srp.json     # 55+ cash SRP spots
│   ├── cash-3bet.json    # 30+ cash 3bet spots
│   └── tourney.json      # 45+ tournament spots
├── prisma/
│   ├── schema.prisma     # Database schema (8 models)
│   └── migrations/
├── src/
│   ├── config.ts         # Environment config
│   ├── db.ts             # Prisma client
│   ├── telegram-auth.ts  # HMAC initData validation
│   ├── claude.ts         # OpenAI GPT-4.1-mini integration
│   ├── analytics.ts          # ★ Phase 3: event + cost tracking
│   ├── board-analyzer.ts     # ★ Phase 2: board card parser
│   ├── equity-calc.ts        # ★ Phase 5: Monte Carlo evaluator
│   ├── gto-data.ts       # Thin facade → solver-adapter
│   ├── gto-matcher.ts        # ★ Phase 2: weighted fuzzy matcher
│   ├── hand-parser.ts        # ★ Phase 5: PS/GGPoker parser
│   ├── notifications.ts      # ★ Phase 5: Telegram Bot push
│   ├── solver-adapter.ts     # ★ Phase 2: SolverAdapter interface
│   ├── routes.ts         # All API routes
│   └── index.ts          # Server entry point
└── package.json
```

### Shared (`packages/shared`)

```
packages/shared/
├── src/
│   ├── types.ts          # TypeScript types
│   ├── schemas.ts        # Zod schemas
│   ├── utils.ts          # Shared utilities
│   └── index.ts          # Exports
└── package.json
```

---

## 🔧 Development

### Database Management

**Generate Prisma Client:**
```bash
npm run prisma:generate
```

**Run Migrations:**
```bash
npm run prisma:migrate
```

**Open Prisma Studio:**
```bash
cd apps/api
npx prisma studio
```

### Building for Production

```bash
# Build all packages
npm run build

# Build specific workspace
npm run build:api
npm run build:web
```

### Type Checking

```bash
npm run type-check
```

---

## 🧪 API Endpoints

### Public Endpoints

- `GET /health` - Health check
- `GET /config` - Public config (upgrade URL, mock mode)
- `GET /share/:code` - Public hand/session share link

### Authenticated Endpoints

All require `Authorization: tma <initData>` header.

**GTO (Phase 1 + 2):**
- `POST /gto/spot` - Get GTO recommendation (fuzzy match, 130+ spots)
- `POST /gto/explain` - AI explanation (GPT-4.1-mini)
- `GET /gto/board-info?board=Ks7d2c` - Board texture analysis
- `GET /solver/info` - Active solver adapter info

**Hand Analysis (Phase 1 + 5):**
- `POST /hand/analyze` - Full AI hand review (GPT-4.1-mini)
- `POST /hand/parse` - Format detection only (no AI, fast)

**Equity (Phase 5):**
- `POST /equity/calculate` - Monte Carlo equity (up to 20 000 iters)

**User Profile:**
- `GET /user/profile` - Get user profile
- `POST /user/profile` - Create/update profile
- `GET /user/stats` - Today's quota + all-time cost/usage (Phase 3)
- `GET /user/history` - Last 20 saved sessions (Phase 5)
- `POST /user/history` - Save session + optional share link (Phase 5)
- `GET /user/notifications` - Notification preference (Phase 5)
- `POST /user/notifications` - Opt in/out of daily reminders (Phase 5)

**Training (Phase 1 + 5):**
- `POST /training/generate` - Generate drills (GPT-4.1-mini)
- `POST /training/score` - Submit session score to leaderboard (Phase 5)
- `GET /leaderboard` - Top 10 by accuracy + your rank (Phase 5)

**Presets:**
- `GET /spots/presets` - List available spot presets

**Admin (Phase 3):** require `X-Admin-Key` header
- `GET /admin/stats` - Aggregate usage & cost stats
- `GET /admin/costs` - Per-user cost breakdown (top 50)
- `POST /admin/notifications/send-daily` - Batch push to all opted-in users

---

## 🎨 UI/UX Design Principles

### Minimalist Dark Theme

- **Background**: `#0f1419` (dark-bg)
- **Cards**: `#1a1f27` (dark-card)
- **Text**: `#e2e8f0` (dark-text)
- **Muted**: `#94a3b8` (dark-muted)
- **Primary**: Blue gradient (`#0284c7` to `#0ea5e9`)

### Component Patterns

- **Cards**: Elevated containers with rounded corners
- **Buttons**: Primary (gradient), Secondary (subtle), Ghost (transparent)
- **Frequency Bars**: Visual representation of GTO frequencies
- **Bottom Navigation**: 4 tabs (Home, GTO, Analyze, Training)

### Telegram Integration

- Full-height viewport expansion
- Haptic feedback on interactions
- Native color scheme support
- Back button handling
- Alert/confirm dialogs

---

## 🔐 Security

### Telegram Authentication

The backend validates all requests using Telegram's HMAC-based authentication:

1. Client sends `initData` from Telegram WebApp
2. Backend verifies HMAC signature
3. Extracts user ID from verified data
4. Rate limiting and caching are user-specific

**Dev Bypass:**
Set `LOCAL_DEV_BYPASS=true` to skip validation for local testing.

### Input Validation

- All API requests validated with Zod schemas
- Claude outputs validated with Zod schemas
- User input sanitized and length-limited
- SQL injection prevention via Prisma ORM

### Rate Limiting

- 50 Claude API calls per user per day
- Tracked in SQLite `RateLimit` table
- Returns 429 status when exceeded

---

## 💾 Data Layer

### GTO Data (Mock Solver)

The app ships with **30+ precomputed GTO scenarios** covering:

- **Cash Games (100bb):**
  - BTN vs BB SRP (multiple board textures)
  - SB vs BB SRP
  - CO vs BTN SRP
  - 3bet pots (BTN vs BB, SB vs BTN)

- **Tournaments:**
  - 20bb, 30bb, 40bb, 60bb spots
  - Simplified push/fold strategies
  - Mixed small bet + all-in frequencies

### Fuzzy Matching Algorithm

The `getSpotRecommendation()` function scores matches based on:
1. Format (cash/tournament) - required
2. Positions (hero/villain) - required
3. Stack range - scored by proximity
4. Spot preset - bonus for exact match
5. Board texture/cards - bonus for match

Returns highest-scoring match with confidence %.

### Future Integration

The GTO data layer is an interface that can be replaced with:
- Real GTO solver (PioSolver, GTO+, etc.)
- Cloud-based solver API
- Pre-solved database (MongoDB, PostgreSQL)

---

## 🤖 Claude AI Integration

### Three Prompt Types

1. **GTO Explain** (`gto_explain_prompt`)
   - Input: Spot context + dry GTO output + skill level + opponent archetype
   - Output: Coaching explanation with street plan, key reasons, mistakes, exploits

2. **Hand Review** (`hand_review_prompt`)
   - Input: Raw hand text + optional parsed data
   - Output: Summary + street-by-street analysis + takeaways + drill suggestion

3. **Training Generation** (`training_gen_prompt`)
   - Input: User profile + available spots + difficulty
   - Output: 5-10 drills with prompts, options, correct answers, explanations

### Safety & Validation

- System message enforces "output ONLY JSON"
- Zod schema validation on all outputs
- User input sanitized and length-limited
- Attempts to override system instructions are blocked

### Caching

- 24-hour cache for identical requests
- Cache key: hash of (prompt_type + request_payload)
- Stored in SQLite `ClaudeCache` table
- Reduces API costs and improves response time

### Mock Mode

Set `MOCK_CLAUDE=true` for development without API key. Returns deterministic stub responses for all three prompt types.

---

## 📊 Database Schema

### UserProfile

```prisma
model UserProfile {
  id               String   @id @default(cuid())
  telegramId       String   @unique
  skillLevel       String   // beginner | intermediate | pro
  formatPreference String   // cash | tournament | both
  typicalStakes    String
  mainGoal         String
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

### RateLimit

```prisma
model RateLimit {
  id         String   @id @default(cuid())
  userId     String
  date       String   // YYYY-MM-DD
  callCount  Int      @default(0)
  user       UserProfile @relation(fields: [userId])
}
```

### ClaudeCache

```prisma
model ClaudeCache {
  id         String   @id @default(cuid())
  cacheKey   String   @unique
  promptType String   // gto_explain | hand_review | training_gen
  request    String   // JSON
  response   String   // JSON
  createdAt  DateTime @default(now())
  expiresAt  DateTime
}
```

---

## 🚢 Deployment

### Environment Variables

**Production Checklist:**

- [ ] `TELEGRAM_BOT_TOKEN` - From BotFather
- [ ] `TELEGRAM_UPGRADE_URL` - Link to premium product
- [ ] `CLAUDE_API_KEY` - From Anthropic Console
- [ ] `CLAUDE_MODEL` - Latest Claude model
- [ ] `LOCAL_DEV_BYPASS=false` - Disable auth bypass
- [ ] `MOCK_CLAUDE=false` - Disable mock mode
- [ ] `NODE_ENV=production` - Set to production
- [ ] `DATABASE_URL` - Production database path
- [ ] `RATE_LIMIT_CALLS_PER_DAY` - Adjust as needed

### Docker Production Build

```bash
# Build images
docker-compose build

# Run in production mode
docker-compose up -d
```

### Hosting Recommendations

**Frontend:**
- Vercel (recommended for Vite apps)
- Netlify
- Cloudflare Pages
- GitHub Pages (with custom domain)

**Backend:**
- Railway (easy deploy + SQLite support)
- Render
- Fly.io
- DigitalOcean App Platform
- AWS Elastic Beanstalk

**Database:**
- SQLite is fine for 50-100 users
- Consider PostgreSQL for scale (update Prisma schema)
- Managed options: Supabase, PlanetScale, Neon

---

## 📈 Next Steps to Production

### Phase 1: MVP Launch ✅ COMPLETE
- ✅ Core modules working end-to-end (GTO Spot, Analyze Hand, Training)
- ✅ OpenAI GPT-4.1-mini integration (replaces Claude)
- ✅ Telegram security (HMAC initData validation)
- ✅ Minimalist dark UI, bottom navigation, haptic feedback
- ✅ 30+ precomputed GTO scenarios, fuzzy matching, caching

### Phase 2: Real Solver Integration ✅ COMPLETE
- ✅ 130+ precomputed spots across cash SRP/3bet + tournament (20–100bb)
- ✅ `board-analyzer.ts` — exact board card parsing (Ks7d2c → category/texture/draws)
- ✅ `gto-matcher.ts` — weighted multi-factor fuzzy matcher + stack interpolation
- ✅ `solver-adapter.ts` — SolverAdapter interface (PrecomputedAdapter + ExternalApi stub)
- ✅ `GET /gto/board-info` — debug endpoint returning full BoardAnalysis
- ✅ `GET /solver/info` — adapter info endpoint
- ✅ 12 board categories, 7 position pairs, 8 stack buckets

### Phase 3: Analytics & Monitoring ✅ COMPLETE
- ✅ `analytics.ts` — logEvent, logError, recordApiUsage, calcCostUsd
- ✅ ChatGPT API cost tracking per user (gpt-4.1-mini: $0.40/$1.60 per 1M tokens)
- ✅ `AnalyticsEvent` + `ApiUsage` Prisma models
- ✅ `GET /user/stats` — today's quota, all-time cost, module breakdown, avg latency
- ✅ `GET /admin/stats` — aggregate stats (protected by X-Admin-Key)
- ✅ `GET /admin/costs` — per-user cost breakdown (top 50)
- ✅ Stats page in frontend with progress bar, module activity chart

### Phase 4: Anti-Abuse & Moderation
- [ ] Stricter rate limiting (per-endpoint)
- [ ] Content moderation for hand text input
- [ ] CAPTCHA for suspicious activity
- [ ] IP-based rate limiting
- [ ] User blocking/banning system

### Phase 5: Advanced Features ✅ COMPLETE
- ✅ Hand history parsing (PokerStars + GGPoker format detection, `POST /hand/parse`)
- ✅ Range visualization — interactive 13×13 hand matrix (`RangeGrid.tsx`)
- ✅ Equity calculator — Monte Carlo 5 000 iterations (`POST /equity/calculate`, `Equity.tsx`)
- ✅ Session history — cloud save + share links (`GET/POST /user/history`, `GET /share/:code`)
- ✅ Social features — share hands via public link (12-char hex code)
- ✅ Leaderboards — top 10 by accuracy, your rank (`GET /leaderboard`, `Leaderboard.tsx`)
- ✅ Push notifications — Telegram Bot daily drill reminders (`/user/notifications`)

### Phase 6: Premium Conversion
- [ ] A/B test upgrade CTA placement
- [ ] In-app modal explaining premium benefits
- [ ] Track conversion rate
- [ ] Optimize messaging for retention

---

## 🐛 Troubleshooting

### Common Issues

**1. "Unauthorized" errors in development**
- Solution: Set `LOCAL_DEV_BYPASS=true` in `.env`

**2. Claude API rate limit errors**
- Solution: Set `MOCK_CLAUDE=true` or increase `RATE_LIMIT_CALLS_PER_DAY`

**3. Prisma client not found**
- Solution: Run `npm run prisma:generate`

**4. Port already in use**
- Solution: Change `API_PORT` in `.env` or kill the process using port 3001

**5. Frontend can't connect to backend**
- Solution: Check `VITE_API_URL` in frontend `.env` (default: `http://localhost:3001`)

**6. Telegram WebApp SDK not working**
- Solution: Test in actual Telegram (not web browser). Use ngrok/cloudflared for local HTTPS.

---

## 📄 License

This project is proprietary. All rights reserved.

---

## 🤝 Contributing

This is a private project. For questions or support, contact the development team.

---

## 📞 Support

- **Issues**: GitHub Issues
- **Email**: support@pokerbotai.com (placeholder)
- **Telegram**: @PokerBotAi (placeholder)

---

## 🎉 Acknowledgments

- **Anthropic** - Claude AI API
- **Telegram** - WebApp SDK
- **Open Source Community** - React, Fastify, Prisma, Vite, TailwindCSS

---

**Built with ❤️ for poker players who want to improve.**

🃏 **PokerBotAi** - Your AI Poker Coach
