import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from './src/lib/supabase/database.types';

const supabase = {} as unknown as SupabaseClient<Database, "public", Database["public"]>;

async function test() {
    const { data } = await supabase.from('reactions').select('*');
    if (data) {
        console.log(data[0].id); // should compile!
    }
}
