import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { requireAuth, AuthRequest } from './src/lib/auth-middleware.ts';
import { db } from './src/db/index.ts';
import { users, playerProgress, importedAssets } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to synchronise Firebase user with Postgres users table
async function getOrCreateUser(uid: string, email: string) {
  try {
    const result = await db
      .insert(users)
      .values({ uid, email })
      .onConflictDoUpdate({
        target: users.uid,
        set: { email },
      })
      .returning();
    return result[0];
  } catch (err) {
    console.error('getOrCreateUser error:', err);
    throw new Error('Database synchronisation failed.', { cause: err });
  }
}

// -------------------------------------------------------------
// API ENDPOINTS
// -------------------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Get user progress
app.get('/api/player/progress', requireAuth, async (req: AuthRequest, res) => {
  try {
    const email = req.user?.email || 'authenticated-player@dortmund.de';
    const dbUser = await getOrCreateUser(req.user!.uid, email);

    // Fetch progress
    const progress = await db
      .select()
      .from(playerProgress)
      .where(eq(playerProgress.userId, dbUser.id));

    if (progress.length === 0) {
      // Create initial Dortmund career progress
      const newProgressResult = await db
        .insert(playerProgress)
        .values({
          userId: dbUser.id,
          cash: 1000,
          health: 100,
          weapons: 'Pistol',
          heat: 0,
          posX: 1200,
          posY: 1200,
        })
        .returning();
      res.json(newProgressResult[0]);
    } else {
      res.json(progress[0]);
    }
  } catch (error: any) {
    console.error('Error fetching player progress:', error);
    res.status(500).json({ error: error.message || 'Database fetch failed.' });
  }
});

// Update user progress
app.post('/api/player/progress', requireAuth, async (req: AuthRequest, res) => {
  try {
    const email = req.user?.email || 'authenticated-player@dortmund.de';
    const dbUser = await getOrCreateUser(req.user!.uid, email);

    const { cash, health, weapons, heat, posX, posY, avatarUrl } = req.body;

    const updatedResult = await db
      .insert(playerProgress)
      .values({
        userId: dbUser.id,
        cash: cash ?? 1000,
        health: health ?? 100,
        weapons: weapons ?? 'Pistol',
        heat: heat ?? 0,
        posX: posX ? parseFloat(posX) : 1200,
        posY: posY ? parseFloat(posY) : 1200,
        avatarUrl: avatarUrl || null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: playerProgress.userId,
        set: {
          cash: cash ?? 1000,
          health: health ?? 100,
          weapons: weapons ?? 'Pistol',
          heat: heat ?? 0,
          posX: posX ? parseFloat(posX) : 1200,
          posY: posY ? parseFloat(posY) : 1200,
          avatarUrl: avatarUrl || null,
          updatedAt: new Date(),
        },
      })
      .returning();

    res.json(updatedResult[0]);
  } catch (error: any) {
    console.error('Error updating player progress:', error);
    res.status(500).json({ error: error.message || 'Database update failed.' });
  }
});

// Fetch user imported assets (Drive 3D models & custom tiles)
app.get('/api/player/assets', requireAuth, async (req: AuthRequest, res) => {
  try {
    const email = req.user?.email || 'authenticated-player@dortmund.de';
    const dbUser = await getOrCreateUser(req.user!.uid, email);

    const assets = await db
      .select()
      .from(importedAssets)
      .where(eq(importedAssets.userId, dbUser.id))
      .orderBy(importedAssets.id);

    res.json(assets);
  } catch (error: any) {
    console.error('Error fetching imported assets:', error);
    res.status(500).json({ error: error.message || 'Database asset fetch failed.' });
  }
});

// Save a newly registered Google Drive asset
app.post('/api/player/assets', requireAuth, async (req: AuthRequest, res) => {
  try {
    const email = req.user?.email || 'authenticated-player@dortmund.de';
    const dbUser = await getOrCreateUser(req.user!.uid, email);

    const { fileId, fileName, fileType, downloadUrl, metadata, applied } = req.body;

    if (!fileId || !fileName || !fileType) {
      res.status(400).json({ error: 'Missing file details (fileId, fileName, fileType are required).' });
      return;
    }

    const newAsset = await db
      .insert(importedAssets)
      .values({
        userId: dbUser.id,
        fileId,
        fileName,
        fileType,
        downloadUrl: downloadUrl || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        applied: applied !== undefined ? applied : true,
      })
      .returning();

    res.json(newAsset[0]);
  } catch (error: any) {
    console.error('Error saving imported asset:', error);
    res.status(500).json({ error: error.message || 'Database asset registration failed.' });
  }
});

// Toggle applied status or update metadata on registered asset
app.post('/api/player/assets/patch', requireAuth, async (req: AuthRequest, res) => {
  try {
    const email = req.user?.email || 'authenticated-player@dortmund.de';
    const dbUser = await getOrCreateUser(req.user!.uid, email);

    const { id, applied, metadata } = req.body;

    if (!id) {
      res.status(400).json({ error: 'Missing asset id.' });
      return;
    }

    const updateObj: any = {};
    if (applied !== undefined) updateObj.applied = applied;
    if (metadata !== undefined) updateObj.metadata = JSON.stringify(metadata);

    const patchedResult = await db
      .update(importedAssets)
      .set(updateObj)
      .where(eq(importedAssets.id, id))
      .returning();

    res.json(patchedResult[0]);
  } catch (error: any) {
    console.error('Error patching imported asset:', error);
    res.status(500).json({ error: error.message || 'Database patch failed.' });
  }
});

// -------------------------------------------------------------
// VITE OR STATIC FILE MIDDLEWARE
// -------------------------------------------------------------

async function setupApp() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Fullstack OS] Server running on http://0.0.0.0:${PORT}`);
  });
}

setupApp();
