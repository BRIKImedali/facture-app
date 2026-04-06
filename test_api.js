const axios = require('axios');

async function test() {
  try {
    // 1. Login
    const loginRes = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'admin@test.com',
      motDePasse: 'admin123'
    });
    const token = loginRes.data.token;
    console.log('Login OK. Token length:', token.length);

    // Axios instance with token
    const api = axios.create({
      baseURL: 'http://localhost:8080/api',
      headers: { Authorization: `Bearer ${token}` }
    });

    // 2. Create client safely
    let clientId;
    try {
      const clients = await api.get('/clients');
      if (clients.data.length > 0) {
        clientId = clients.data[0].id;
      } else {
        const newClient = await api.post('/clients', {
          nom: 'Client API', email: 'api@client.com', adresse: '...', ville: '...', telephone: '...'
        });
        clientId = newClient.data.id;
      }
      console.log('Using client ID:', clientId);
    } catch(err) {
      console.error('Client fetching failed', err.response?.data || err.message);
      return;
    }

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

    try {
      console.log('Creating Facture...');
      const createRes = await api.post('/factures', payload);
      factureId = createRes.data.id;
      console.log('Facture Created! ID:', factureId);
      console.log('Response DATA:', createRes.data);
    } catch(err) {
      console.error('Create Facture Failed', err.response?.data || err.message);
      return;
    }

    // 4. Get By ID
    try {
      console.log(`Getting Facture ${factureId}...`);
      const getRes = await api.get(`/factures/${factureId}`);
      console.log('Get Facture OK! Numero:', getRes.data.numero);
    } catch(err) {
      console.error('Get Facture Failed', err.response?.data || err.message);
    }

    // 5. Get All
    try {
      console.log('Getting All Factures...');
      const allRes = await api.get('/factures');
      console.log('Total factures:', allRes.data.length);
      const found = allRes.data.find(f => f.id === factureId);
      console.log('Is our facture in the list?', found ? 'YES' : 'NO');
    } catch(err) {
      console.error('Get All Failed', err.response?.data || err.message);
    }

  } catch (err) {
    console.error('Main error:', err.response?.data || err.message);
  }
}

test();
