# 🚀 Quick Start Guide

Get PokerBotAi running in **5 minutes**.

## Prerequisites

- Node.js 20+ installed
- Git installed
- A terminal/command prompt

## Step 1: Clone & Setup

```bash
# Clone the repository
cd GTOAdvicer

# Run setup script
# On Windows:
setup.bat

# On Mac/Linux:
chmod +x setup.sh
./setup.sh
```

## Step 2: Configure Environment

The setup script created a `.env` file. For **local development**, you only need:

```env
# Enable local development (skips Telegram auth)
LOCAL_DEV_BYPASS=true

# Use mock Claude responses (no API key needed)
MOCK_CLAUDE=true

# Database
DATABASE_URL=file:./dev.db
```

That's it! Leave everything else as default.

## Step 3: Start the App

```bash
npm run dev
```

This starts:
- ✅ Backend API at http://localhost:3001
- ✅ Frontend at http://localhost:5173

## Step 4: Test It Out

Open your browser to **http://localhost:5173**

Try the demo flow:
1. Click **"GTO Spot"** tab
2. Select a spot (default BTN vs BB is fine)
3. Click **"Get GTO Recommendation"**
4. See the recommendation appear!
5. Click **"Explain with AI"** to see the AI coaching (uses mock responses)

## What Just Happened?

- ✅ The frontend called the backend API
- ✅ The backend used the GTO data layer to find a matching spot
- ✅ The backend returned the recommendation
- ✅ The frontend displayed it beautifully
- ✅ The AI "explanation" was mocked (since MOCK_CLAUDE=true)

## Next Steps

### To Use Real Claude AI:

1. Get a Claude API key from https://console.anthropic.com
2. Update `.env`:
   ```env
   MOCK_CLAUDE=false
   CLAUDE_API_KEY=your_actual_api_key_here
   ```
3. Restart the server

### To Test in Telegram:

1. Create a bot with [@BotFather](https://t.me/botfather)
2. Create a Mini App in BotFather
3. Get your bot token
4. Update `.env`:
   ```env
   LOCAL_DEV_BYPASS=false
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   ```
5. Use ngrok or cloudflared to expose your local server
6. Configure the Mini App URL in BotFather

## Troubleshooting

**"Port 3001 already in use"**
- Change `API_PORT=3002` in `.env`

**"Cannot find module 'prisma'"**
- Run: `npm run prisma:generate`

**"Unauthorized" errors**
- Make sure `LOCAL_DEV_BYPASS=true` in `.env`

**Frontend can't reach backend**
- Check both services are running
- Check http://localhost:3001/health returns `{"status":"ok"}`

## Project Structure

```
pokerbotai/
├── apps/
│   ├── web/          # React frontend (localhost:5173)
│   └── api/          # Fastify backend (localhost:3001)
├── packages/
│   └── shared/       # Shared TypeScript code
└── .env              # Your configuration
```

## Available Scripts

```bash
npm run dev              # Start both frontend + backend
npm run dev:web          # Start frontend only
npm run dev:api          # Start backend only
npm run build            # Build for production
npm run type-check       # Check TypeScript types
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
```

## Key Files to Know

- **`.env`** - Your configuration (API keys, settings)
- **`apps/web/src/pages/`** - Frontend pages (Home, GTOSpot, AnalyzeHand, Training)
- **`apps/api/src/routes.ts`** - API endpoints
- **`apps/api/src/gto-data.ts`** - GTO data layer (30+ precomputed spots)
- **`apps/api/src/claude.ts`** - Claude AI integration

## Demo Flow Walkthrough

### 1. GTO Spot
- Select format (Cash/Tournament)
- Select stack size (20bb/30bb/40bb/60bb/100bb)
- Select positions (BTN vs BB, etc.)
- Get recommendation (bet/check frequencies, sizing)
- Explain with AI (coaching tailored to skill level)

### 2. Analyze Hand
- Paste a hand history (or describe in natural language)
- Get AI analysis:
  - Hand summary
  - Street-by-street breakdown
  - 3 key takeaways
  - Next drill suggestion
- Copy analysis to clipboard

### 3. Training
- Complete profile setup (60 seconds)
- Generate daily drills (5-10 questions)
- Answer multiple-choice questions
- Get immediate feedback + explanations
- Track your streak

## Ready for Production?

See [README.md](README.md) for:
- Full documentation
- Deployment guide
- Security best practices
- Production checklist
- Next steps roadmap

---

**Need help?** Check the full README or open an issue.

**Happy coding!** 🃏
