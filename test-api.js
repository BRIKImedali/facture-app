const http = require('http');

async function testApi() {
  try {
    // 1. Get Token
    const loginRes = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.com', password: 'admin123' })
    });
    
    if (!loginRes.ok) {
        console.error("Login failed:", await loginRes.text());
        return;
    }
    const { token } = await loginRes.json();
    console.log("Token obtained successfully.");

    // 2. Test /api/factures
    const facturesRes = await fetch('http://localhost:8080/api/factures', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log("\n--- GET /api/factures ---");
    console.log("Status:", facturesRes.status);
    console.log("Response:", await facturesRes.text());

    // 3. Test /api/factures/stats
    const statsRes = await fetch('http://localhost:8080/api/factures/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log("\n--- GET /api/factures/stats ---");
    console.log("Status:", statsRes.status);
    console.log("Response:", await statsRes.text());

  } catch (err) {
    console.error("Script Error:", err);
  }
}

testApi();
