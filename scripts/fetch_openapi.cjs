const fs = require('fs');

async function fetchOpenApi() {
  const env = fs.readFileSync('.env.local', 'utf-8');
  const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
  const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];

  const res = await fetch(`${url}/rest/v1/`, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Accept': 'application/openapi+json'
    }
  });
  console.log('GET /:', res.status, res.statusText);
  if (res.ok) {
    const spec = await res.json();
    const paths = Object.keys(spec.paths || {});
    console.log('Exposed Paths count:', paths.length);
    const rpcPaths = paths.filter(p => p.startsWith('/rpc/'));
    console.log('RPC Paths:', rpcPaths);
  } else {
    console.log('Error text:', await res.text());
  }
}
fetchOpenApi();
