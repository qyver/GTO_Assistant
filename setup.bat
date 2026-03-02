@echo off
echo 🃏 PokerBotAi - Setup Script
echo ==============================
echo.

REM Check if .env exists
if not exist .env (
    echo 📝 Creating .env file from .env.example...
    copy .env.example .env
    echo ✅ .env file created. Please configure it before running the app.
    echo.
) else (
    echo ✅ .env file already exists
    echo.
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

echo ✅ Dependencies installed
echo.

REM Generate Prisma client
echo 🔧 Generating Prisma client...
cd apps\api
call npx prisma generate

if %errorlevel% neq 0 (
    echo ❌ Failed to generate Prisma client
    exit /b 1
)

cd ..\..
echo ✅ Prisma client generated
echo.

REM Run migrations
echo 🗄️ Running database migrations...
cd apps\api
call npx prisma migrate deploy

if %errorlevel% neq 0 (
    echo ⚠️ Warning: Failed to run migrations (this is OK if database doesn't exist yet)
)

cd ..\..
echo ✅ Database setup complete
echo.

echo ==============================
echo ✅ Setup Complete!
echo.
echo Next steps:
echo 1. Configure your .env file with:
echo    - TELEGRAM_BOT_TOKEN (or use LOCAL_DEV_BYPASS=true)
echo    - CLAUDE_API_KEY (or use MOCK_CLAUDE=true)
echo.
echo 2. Start the development server:
echo    npm run dev
echo.
echo 3. Access the app:
echo    - Frontend: http://localhost:5173
echo    - API: http://localhost:3001
echo.
echo For more information, see README.md
echo ==============================
pause
