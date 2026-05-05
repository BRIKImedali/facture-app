import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { stockService }       from '../../services/stockService';
import { siteService }        from '../../services/siteService';
import { emplacementService } from '../../services/emplacementService';
import { produitService }     from '../../services/produitService';

export default function StockPage() {
  const [stocks,       setStocks]       = useState([]);
  const [produits,     setProduits]     = useState([]);
  const [sites,        setSites]        = useState([]);
  const [emplacements, setEmplacements] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filterSite,   setFilterSite]   = useState('');
  const [alerteOnly,   setAlerteOnly]   = useState(false);
  const [mouvement,    setMouvement]    = useState(null); // {id, type:'entree'|'sortie'}
  const [mvQty,        setMvQty]        = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [stR, prR, siR, emR] = await Promise.all([
        stockService.getAll(),
        produitService.getActifs(),
        siteService.getAll(),
        emplacementService.getAll(),
      ]);
      setStocks(stR.data);
      setProduits(prR.data);
      setSites(siR.data);
      setEmplacements(emR.data);
    } catch { toast.error('Impossible de charger les données'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = stocks.filter(s => {
    const site  = !filterSite || String(s.siteId) === filterSite;
    const alerte = !alerteOnly || s.enAlerte;
    return site && alerte;
  });



  const handleMouvement = async () => {
    if (mvQty < 1) { toast.error('Quantité invalide'); return; }
    try {
      mouvement.type === 'entree'
        ? await stockService.entree(mouvement.id, mvQty)
        : await stockService.sortie(mouvement.id, mvQty);
      toast.success(mouvement.type === 'entree' ? `+${mvQty} entrée enregistrée` : `-${mvQty} sortie enregistrée`);
      setMouvement(null); setMvQty(1); load();
    } catch (err) { toast.error(err.response?.data?.message ?? 'Erreur'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🗄️ Stocks</h1>
          <p className="page-subtitle">Inventaire par site et emplacement</p>
        </div>
        <Link to="/stock/create" className="btn btn-primary">+ Nouveau stock</Link>
      </div>

      {/* Filtres */}
      <div className="card" style={{marginBottom:'1rem',padding:'0.75rem 1rem',display:'flex',gap:'1rem',alignItems:'center',flexWrap:'wrap'}}>
        <select className="form-control" value={filterSite} onChange={e=>setFilterSite(e.target.value)} style={{maxWidth:'220px'}}>
          <option value="">Tous les sites</option>
          {sites.map(s=><option key={s.id} value={String(s.id)}>{s.nom}</option>)}
        </select>
        <label style={{display:'flex',alignItems:'center',gap:'0.5rem',cursor:'pointer',color:'#ef4444',fontWeight:600}}>
          <input type="checkbox" checked={alerteOnly} onChange={e=>setAlerteOnly(e.target.checked)} />
          ⚠️ Alertes uniquement
        </label>
      </div>

      {/* Tableau */}
      <div className="card">
        {loading ? <div className="loading">Chargement…</div> : filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🗄️</div><h3>Aucun stock</h3></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Produit</th><th>Site</th><th>Emplacement</th>
                <th>Quantité</th><th>Seuil min.</th><th>Statut</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td><strong>{s.produitNom}</strong></td>
                  <td>{s.siteNom}</td>
                  <td>{s.emplacementLabel || '—'}</td>
                  <td style={{fontWeight:700, color: s.enAlerte ? '#ef4444' : '#16a34a'}}>{s.quantite}</td>
                  <td>{s.seuilMinimum}</td>
                  <td>
                    {s.enAlerte
                      ? <span className="badge badge-annulee">⚠️ Alerte</span>
                      : <span className="badge badge-payee">✓ OK</span>}
                  </td>
                  <td style={{display:'flex',gap:'0.4rem',flexWrap:'wrap'}}>
                    <button className="btn btn-success"   title="Entrée"  onClick={()=>{setMouvement({id:s.id,type:'entree'}); setMvQty(1);}}>📥</button>
                    <button className="btn btn-warning"   title="Sortie"  onClick={()=>{setMouvement({id:s.id,type:'sortie'}); setMvQty(1);}}>📤</button>
                    <Link to={`/stock/${s.id}`} className="btn btn-secondary" title="Voir">👁️</Link>
                    <Link to={`/stock/edit/${s.id}`} className="btn btn-secondary" title="Modifier">✏️</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>



      {/* ── Modale mouvement entrée/sortie ── */}
      {mouvement && (
        <div style={OV}>
          <div style={{...MB,maxWidth:'380px',textAlign:'center'}}>
            <p style={{fontSize:'1.8rem'}}>{mouvement.type==='entree'?'📥':'📤'}</p>
            <h3 style={{margin:'0 0 1rem'}}>{mouvement.type==='entree'?'Entrée de stock':'Sortie de stock'}</h3>
            <div className="form-group">
              <label>Quantité</label>
              <input className="form-control" type="number" min="1" value={mvQty} onChange={e=>setMvQty(Number(e.target.value))} style={{textAlign:'center',fontSize:'1.2rem'}} />
            </div>
            <div style={{display:'flex',gap:'0.75rem',justifyContent:'center',marginTop:'1rem'}}>
              <button className="btn btn-secondary" onClick={()=>setMouvement(null)}>Annuler</button>
              <button className={`btn ${mouvement.type==='entree'?'btn-success':'btn-warning'}`} onClick={handleMouvement}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const OV = {position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(3px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000};
const MB = {background:'#fff',borderRadius:'16px',padding:'2rem',width:'95%',maxWidth:'600px',boxShadow:'0 24px 48px rgba(0,0,0,0.18)',maxHeight:'90vh',overflowY:'auto'};
