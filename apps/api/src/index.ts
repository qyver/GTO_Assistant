import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config, validateConfig } from './config';
import { registerRoutes } from './routes';
import { prisma } from './db';

async function main() {
  // Validate configuration
  validateConfig();

  // Create Fastify instance
  const fastify = Fastify({
    logger: {
      level: config.nodeEnv === 'development' ? 'info' : 'warn',
    },
  });

  // Register CORS
  const extraOrigins = config.allowedOrigins
    ? config.allowedOrigins.split(',').map((o) => o.trim()).filter(Boolean)
    : [];
  const prodOrigins: (string | RegExp)[] = [/\.t\.me$/, /\.vercel\.app$/, ...extraOrigins];
  await fastify.register(cors, {
    origin: config.nodeEnv === 'development' ? '*' : prodOrigins,
    credentials: true,
  });

  // Register routes
  await registerRoutes(fastify);

  // Error handler
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    reply.status(500).send({
      success: false,
      error: config.nodeEnv === 'development' ? error.message : 'Internal server error',
    });
  });

  // Start server
  try {
    await fastify.listen({
      port: config.port,
      host: config.host,
    });

    console.log(`
╔═══════════════════════════════════════════════╗
║                                               ║
║         🃏 PokerBotAi API Server 🃏          ║
║                                               ║
║  Status: Running                              ║
║  Port: ${config.port}                                 ║
║  Environment: ${config.nodeEnv}                   ║
║  Mock Claude: ${config.mockClaude ? 'ENABLED' : 'DISABLED'}                     ║
║  Dev Bypass: ${config.localDevBypass ? 'ENABLED' : 'DISABLED'}                      ║
║                                               ║
╚═══════════════════════════════════════════════╝
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  console.log('\n[Shutdown] Closing server...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[Shutdown] Closing server...');
  await prisma.$disconnect();
  process.exit(0);
});

main();
