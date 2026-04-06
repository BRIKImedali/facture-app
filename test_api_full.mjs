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

    // Create client
    const newClientRes = await fetch('http://localhost:8080/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        nom: 'Client API', email: 'api@client.com', adresse: '...', ville: '...', telephone: '...'
      })
    });
    const newClientData = await newClientRes.json();
    const clientId = newClientData.id;

    // Create Facture
    const payload = {
      clientId: clientId,
      dateEcheance: null,
      notes: "test notes",
      lignes: [
        { produitId: null, designation: "Test API", quantite: 2, prixUnitaireHT: 50.0, tauxTva: 20 }
      ]
    };
    await fetch('http://localhost:8080/api/factures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });

    console.log('Fetching all factures RAW...');
    const allRes = await fetch('http://localhost:8080/api/factures', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const rawText = await allRes.text();
    console.log("RAW TEXT TYPE:", typeof rawText);
    console.log("RAW TEXT PREVIEW:", rawText);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
