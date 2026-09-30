const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];
const supabase = createClient(url, key);

async function cleanOldDemo() {
  const { data, error } = await supabase
    .from('inspections')
    .delete()
    .eq('remarks', 'Field inspection completed.');
  console.log('Cleaned old demo rows:', { data, error });
}
cleanOldDemo();
