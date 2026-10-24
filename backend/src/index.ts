import { app } from './app';
import { config } from './config/env';
import { ensureDatabase } from './db/embedded-pg';
import { prisma } from './db/prisma';

async function bootstrap() {
  try {
    console.log('[MiniLedger] Checking database connection...');
    await ensureDatabase();

    // Verify database connection via Prisma
    await prisma.$connect();
    console.log('[MiniLedger] Successfully connected to PostgreSQL via Prisma.');

    // Ensure database tables exist without breaking initial setup
    try {
      await prisma.$queryRaw`SELECT 1 FROM "loans" LIMIT 1`;
    } catch {
      console.log('[MiniLedger] Tables missing, synchronizing schema with database...');
      const { execSync } = await import('child_process');
      const path = await import('path');
      execSync('npx prisma db push --skip-generate', {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'inherit',
      });
      console.log('[MiniLedger] Schema synchronized successfully.');
    }

    const server = app.listen(config.port, '0.0.0.0', () => {
      console.log('\n======================================================');
      console.log(`🚀 MiniLedger Backend Server is running!`);
      console.log(`📡 Local URL:    http://localhost:${config.port}`);
      console.log(`📱 Network URL:  http://0.0.0.0:${config.port}`);
      console.log(`🛡️ Environment:  ${config.nodeEnv}`);
      console.log(`🗄️ Database:     PostgreSQL (Active)`);
      console.log(`🔑 Auth:         Mock OTP Verification + JWT`);
      console.log('======================================================\n');
    });

    const shutdown = async (signal: string) => {
      console.log(`\n[MiniLedger] Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('[MiniLedger] Server and database connections closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('[MiniLedger] Critical error during bootstrap:', err);
    process.exit(1);
  }
}

bootstrap();
