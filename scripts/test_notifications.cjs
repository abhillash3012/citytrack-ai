const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];
const supabase = createClient(url, key);

async function testNotif() {
  const notifUuid = '00000000-0000-4000-8000-' + Date.now().toString().slice(-12);
  const { data, error } = await supabase.from('notifications').insert({
    id: notifUuid,
    project_id: '7e633688-93d3-4dc3-9720-f00d1e21db6f',
    title: 'Test Title',
    message: 'Test Message',
    target_role: null,
    user_id: null,
    is_read: false
  }).select();

  console.log('Insert notification:', { data, error });
}
testNotif();
