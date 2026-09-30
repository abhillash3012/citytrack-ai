const url = "https://snpxhrovyogwboydqcmh.supabase.co/rest/v1/";
const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucHhocm92eW9nd2JveWRxY21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzM0MzIsImV4cCI6MjEwNTQwOTQzMn0.WbAr1yCceQ5L9vN-_n4W9IkeQorPo8HuqagazNmXhwg";

async function inspectSchema() {
  const res = await fetch(url, {
    headers: {
      'apikey': apiKey,
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/openapi+json'
    }
  });

  console.log("Status:", res.status);
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    console.log("OpenAPI paths:", Object.keys(json.paths || {}));
    console.log("OpenAPI definitions:", Object.keys(json.definitions || {}));
    if (json.definitions?.projects) {
      console.log("Projects definition properties:", Object.keys(json.definitions.projects.properties || {}));
    }
    if (json.definitions?.inspections) {
      console.log("Inspections definition properties:", Object.keys(json.definitions.inspections.properties || {}));
    }
    if (json.definitions?.profiles) {
      console.log("Profiles definition properties:", Object.keys(json.definitions.profiles.properties || {}));
    }
  } catch (e) {
    console.log("Response text:", text.slice(0, 500));
  }
}

inspectSchema();
