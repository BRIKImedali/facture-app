import fs from 'fs';

async function test() {
  try {
    const loginRes = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.com', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    console.log('Fetching all factures RAW...');
    const allRes = await fetch('http://localhost:8080/api/factures', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const rawText = await allRes.text();
    console.log("RAW TEXT TYPE:", typeof rawText);
    console.log("RAW TEXT PREVIEW:", rawText.substring(0, 500));
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
