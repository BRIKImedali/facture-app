async function testPdf() {
  try {
    // 1. Login
    const loginRes = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.com', password: 'admin123' })
    });
    const { token } = await loginRes.json();

    // 2. Get all factures to find an ID
    const allRes = await fetch('http://localhost:8080/api/factures', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const all = await allRes.json();
    
    if (!all || all.length === 0) {
      console.log('No factures found, creating one...');
      // Create client
      const cr = await fetch('http://localhost:8080/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nom: 'Test Client', email: 'test@client.com', adresse: '...', ville: 'Tunis', telephone: '...' })
      });
      const client = await cr.json();
      
      // Create facture
      const fr = await fetch('http://localhost:8080/api/factures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          clientId: client.id,
          lignes: [{ designation: 'Test', quantite: 1, prixUnitaireHT: 100, tauxTva: 20 }]
        })
      });
      const f = await fr.json();
      console.log('Created facture ID:', f.id);
      all.push(f);
    }

    const factureId = all[0].id;
    console.log('Testing PDF for facture ID:', factureId);

    // 3. Test PDF endpoint
    const pdfRes = await fetch(`http://localhost:8080/api/factures/${factureId}/pdf`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('PDF Response Status:', pdfRes.status, pdfRes.statusText);
    console.log('PDF Content-Type:', pdfRes.headers.get('Content-Type'));

    if (pdfRes.ok) {
      const buf = await pdfRes.arrayBuffer();
      console.log('PDF size:', buf.byteLength, 'bytes');
      console.log('SUCCESS - PDF downloaded correctly!');
    } else {
      const text = await pdfRes.text();
      console.error('FAILED - Response body:', text);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testPdf();
