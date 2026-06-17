import { createClient } from './server';
import { Database } from './database.types';

type Tables = Database['public']['Tables'];

/**
 * Generic wrapper for Supabase INSERT operations.
 * Bypasses the GenericSchema incompatibility while enforcing strict table types.
 */
export async function dbInsert<T extends keyof Tables>(table: T, row: Tables[T]['Insert']) {
  const supabase = await createClient();
  return (supabase as any).from(table).insert(row);
}

/**
 * Generic wrapper for Supabase UPSERT operations.
 */
export async function dbUpsert<T extends keyof Tables>(table: T, row: Tables[T]['Insert']) {
  const supabase = await createClient();
  return (supabase as any).from(table).upsert(row);
}

/**
 * Generic wrapper for Supabase UPDATE operations.
 */
export async function dbUpdate<T extends keyof Tables>(table: T, match: Record<string, any>, row: Tables[T]['Update']) {
  const supabase = await createClient();
  let query = (supabase as any).from(table).update(row);
  for (const [k, v] of Object.entries(match)) {
    query = query.eq(k, v);
  }
  return query;
}

/**
 * Generic wrapper for Supabase DELETE operations.
 */
export async function dbDelete<T extends keyof Tables>(table: T, match: Record<string, any>) {
  const supabase = await createClient();
  let query = (supabase as any).from(table).delete();
  for (const [k, v] of Object.entries(match)) {
    query = query.eq(k, v);
  }
  return query;
}
