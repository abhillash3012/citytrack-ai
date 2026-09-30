const fs = require('fs');

async function testFetch() {
  const env = fs.readFileSync('.env.local', 'utf-8');
  const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
  const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];

  // 1. Test GET projects
  const res1 = await fetch(`${url}/rest/v1/projects?select=*`, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });
  console.log('GET /projects:', res1.status, res1.statusText);
  const data1 = await res1.json();
  console.log('GET /projects data:', data1);

  // 2. Test POST alerts with invalid FK
  const res2 = await fetch(`${url}/rest/v1/alerts`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      id: '00000000-0000-4000-8000-' + Date.now().toString().slice(-12),
      project_id: '7e633688-93d3-4dc3-9720-f00d1e21db6f',
      title: 'Test',
      message: 'Test message',
      category: 'Issue Escalated',
      severity: 'Critical'
    })
  });
  console.log('POST /alerts:', res2.status, res2.statusText);
  const data2 = await res2.json().catch(() => null);
  console.log('POST /alerts data:', data2);
}
testFetch();
