#!/bin/bash

echo "🃏 PokerBotAi - Setup Script"
echo "=============================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please configure it before running the app."
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Generate Prisma client
echo "🔧 Generating Prisma client..."
cd apps/api
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

cd ../..
echo "✅ Prisma client generated"
echo ""

# Run migrations
echo "🗄️  Running database migrations..."
cd apps/api
npx prisma migrate deploy

if [ $? -ne 0 ]; then
    echo "⚠️  Warning: Failed to run migrations (this is OK if database doesn't exist yet)"
fi

cd ../..
echo "✅ Database setup complete"
echo ""

echo "=============================="
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Configure your .env file with:"
echo "   - TELEGRAM_BOT_TOKEN (or use LOCAL_DEV_BYPASS=true)"
echo "   - CLAUDE_API_KEY (or use MOCK_CLAUDE=true)"
echo ""
echo "2. Start the development server:"
echo "   npm run dev"
echo ""
echo "3. Access the app:"
echo "   - Frontend: http://localhost:5173"
echo "   - API: http://localhost:3001"
echo ""
echo "For more information, see README.md"
echo "=============================="
