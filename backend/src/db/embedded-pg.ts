import net from 'net';
import path from 'path';
import fs from 'fs';

// Check if a port is in use
export function isPortInUse(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);

    socket.once('connect', () => {
      socket.destroy();
      resolve(true); // Port is open / in use
    });

    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.once('error', () => {
      socket.destroy();
      resolve(false); // Port is free
    });

    socket.connect(port, host);
  });
}

let pgInstance: any = null;

export async function ensureDatabase(): Promise<void> {
  const port = 5432;
  const inUse = await isPortInUse(port);

  if (inUse) {
    console.log(`[Database] PostgreSQL is already active on port ${port}. Using active instance.`);
    return;
  }

  console.log(`[Database] No PostgreSQL detected on port ${port}. Initializing Embedded PostgreSQL...`);

  try {
    // Dynamic import to handle embedded-postgres package
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const epModule = require('embedded-postgres');
    const EmbeddedPostgres = epModule.default || epModule;
    const dataDir = path.resolve(__dirname, '../../.pgdata');

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    pgInstance = new EmbeddedPostgres({
      databaseDir: dataDir,
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      persistent: true,
    });

    await pgInstance.initialise();
    await pgInstance.start();

    // Create miniledger database if it does not exist
    try {
      await pgInstance.createDatabase('miniledger');
      console.log('[Database] Created "miniledger" database.');
    } catch {
      // Database might already exist
    }

    console.log('[Database] Embedded PostgreSQL running successfully on port 5432.');
  } catch (err) {
    console.warn('[Database] Could not start embedded PostgreSQL:', err);
    console.warn('[Database] Proceeding assuming external PostgreSQL instance specified in DATABASE_URL.');
  }
}

// Standalone runner if executed directly
if (require.main === module) {
  ensureDatabase().then(() => {
    console.log('Embedded database ready.');
  });
}
