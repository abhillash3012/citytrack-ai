const fs = require('fs');

async function testSqlEndpoints() {
  const env = fs.readFileSync('.env.local', 'utf-8');
  const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
  const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];

  const endpoints = [
    '/pg/query',
    '/sql',
    '/api/sql',
    '/rest/v1/rpc/exec',
    '/rest/v1/rpc/sql',
    '/rest/v1/rpc/query'
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(`${url}${ep}`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: 'SELECT 1' })
      });
      console.log(`Endpoint ${ep}:`, res.status, res.statusText);
      const text = await res.text();
      console.log(`   Response: ${text.slice(0, 100)}`);
    } catch (e) {
      console.log(`Endpoint ${ep}: Fetch error - ${e.message}`);
    }
  }
}
testSqlEndpoints();
