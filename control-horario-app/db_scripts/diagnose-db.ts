
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log('🔍 Starting diagnosis...');

  // 1. Check Connection
  console.log(`\n--- Checking Connection to ${supabaseUrl} ---`);
  
  // 2. Check Auth (This won't work well in a script without a session, but we can check public tables if any)
  // Actually, we can't easily check 'auth.users' from client.
  // We will check if we can read from public tables.
  
  // 3. Check Profiles Table
  console.log('\n--- Checking Profiles Table (Public Access via RLS?) ---');
  // Note: If RLS is on, we might see 0 rows if we are not logged in.
  // But we want to know if the table EXISTS first.
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('count', { count: 'exact', head: true });

  if (profilesError) {
    console.error('❌ Error accessing profiles table:', profilesError.message);
    if (profilesError.code === '42P01') {
        console.error('   -> Table likely does NOT exist.');
    }
  } else {
    console.log('✅ Profiles table exists.');
    // cannot count rows reliably with RLS restricted to owner, but no error means table is there.
  }

  // 4. Check Work Sessions Table
  console.log('\n--- Checking Work Sessions Table ---');
  const { error: sessionsError } = await supabase
    .from('work_sessions')
    .select('count', { count: 'exact', head: true });

  if (sessionsError) {
    console.error('❌ Error accessing work_sessions table:', sessionsError.message);
  } else {
    console.log('✅ Work_sessions table exists.');
  }

  // 5. Check Breaks Table
  console.log('\n--- Checking Breaks Table ---');
  const { error: breaksError } = await supabase
    .from('breaks')
    .select('count', { count: 'exact', head: true });

  if (breaksError) {
    console.error('❌ Error accessing breaks table:', breaksError.message);
  } else {
    console.log('✅ Breaks table exists.');
  }

  console.log('\nDiagnosis complete.');
}

diagnose();
