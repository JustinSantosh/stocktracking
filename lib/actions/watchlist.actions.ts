'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import { getAuth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getCurrentUserId(): Promise<string | null> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const email = session?.user?.email;

  if (!email) return null;

  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB connection not found');

  const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email });
  return (user?.id as string) || String(user?._id || '') || null;
}

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
  if (!email) return [];

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    // Better Auth stores users in the "user" collection
    const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

    if (!user) return [];

    const userId = (user.id as string) || String(user._id || '');
    if (!userId) return [];

    const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
    return items.map((i) => String(i.symbol));
  } catch (err) {
    console.error('getWatchlistSymbolsByEmail error:', err);
    return [];
  }
}

export async function isInWatchlist(symbol: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const item = await Watchlist.exists({ userId, symbol: symbol.toUpperCase() });
  return Boolean(item);
}

export async function addToWatchlist(symbol: string, company: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: 'You must be signed in.' };

  await Watchlist.updateOne(
    { userId, symbol: symbol.toUpperCase() },
    {
      $setOnInsert: {
        userId,
        symbol: symbol.toUpperCase(),
        company,
        addedAt: new Date(),
      },
    },
    { upsert: true }
  );

  revalidatePath('/');
  revalidatePath(`/stocks/${symbol.toUpperCase()}`);
  return { success: true };
}

export async function removeFromWatchlist(symbol: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: 'You must be signed in.' };

  await Watchlist.deleteOne({ userId, symbol: symbol.toUpperCase() });

  revalidatePath('/');
  revalidatePath(`/stocks/${symbol.toUpperCase()}`);
  return { success: true };
}
