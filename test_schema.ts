import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from './src/lib/supabase/database.types';

type ExtractGenericSchema<T> = T extends SupabaseClient<any, any, infer S> ? S : never;
type TheGenericSchema = ExtractGenericSchema<SupabaseClient<any>>;

const x: TheGenericSchema = {} as Database['public'];
