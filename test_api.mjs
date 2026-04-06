async function test() {
  try {
    // 1. Login
    const loginRes = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.com', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Login OK. Token length:', token.length);

    // 2. Create client safely
    let clientId;
    const clientsRes = await fetch('http://localhost:8080/api/clients', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const clientsData = await clientsRes.json();
    
    if (clientsData.length > 0) {
      clientId = clientsData[0].id;
    } else {
      const newClientRes = await fetch('http://localhost:8080/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nom: 'Client API', email: 'api@client.com', adresse: '...', ville: '...', telephone: '...'
        })
      });
      const newClientData = await newClientRes.json();
      clientId = newClientData.id;
    }
    console.log('Using client ID:', clientId);

    // 3. Create Facture
    let factureId;
    const payload = {
      clientId: clientId,
      dateEcheance: null,
      notes: "test notes",
      lignes: [
        {
          produitId: null,
          designation: "Test API Ligne",
          quantite: 2,
          prixUnitaireHT: 50.0,
          tauxTva: 20
        }
      ]
    };

    console.log('Creating Facture...');
    const createRes = await fetch('http://localhost:8080/api/factures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    
    if (!createRes.ok) {
        console.error('Failed to create:', await createRes.text());
        return;
    }
    const createData = await createRes.json();
    factureId = createData.id;
    console.log('Facture Created! ID:', factureId);

    // 4. Get By ID
    console.log(`Getting Facture ${factureId}...`);
    const getRes = await fetch(`http://localhost:8080/api/factures/${factureId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const getData = await getRes.json();
    console.log('Get Facture OK! Numero:', getData.numero);

    // 5. Get All
    console.log('Getting All Factures...');
    const allRes = await fetch('http://localhost:8080/api/factures', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const allData = await allRes.json();
    console.log('Total factures:', allData.length);
    const found = allData.find(f => f.id === factureId);
    console.log('Is our facture in the list?', found ? 'YES' : 'NO');

  } catch (err) {
    console.error('Main error:', err);
  }
}

test();
