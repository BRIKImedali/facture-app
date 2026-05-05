import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { emplacementService } from '../../services/emplacementService';
import { siteService }        from '../../services/siteService';

export default function EmplacementPage() {
  const [emplacements, setEmplacements] = useState([]);
  const [sites,        setSites]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [filterSite,   setFilterSite]   = useState('');
  const [deleteId,     setDeleteId]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [eR, sR] = await Promise.all([emplacementService.getAll(), siteService.getAll()]);
      setEmplacements(eR.data);
      setSites(sR.data);
    } catch { toast.error('Impossible de charger les données'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = emplacements.filter(e => {
    const text = [e.zone, e.rayon, e.etagere].some(v => v?.toLowerCase().includes(search.toLowerCase()));
    const site = !filterSite || String(e.siteId) === filterSite;
    return text && site;
  });

  const confirmDelete = async () => {
    try { await emplacementService.delete(deleteId); toast.success('Supprimé'); setDeleteId(null); load(); }
    catch { toast.error('Impossible de supprimer'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📍 Emplacements</h1>
          <p className="page-subtitle">Zone / Rayon / Étagère par site</p>
        </div>
        <Link to="/emplacement/create" className="btn btn-primary">+ Nouvel emplacement</Link>
      </div>

      <div className="card" style={{ marginBottom:'1rem', padding:'0.75rem 1rem', display:'flex', gap:'1rem' }}>
        <input className="form-control" placeholder="Rechercher…" value={search} onChange={e=>setSearch(e.target.value)} style={{flex:2}} />
        <select className="form-control" value={filterSite} onChange={e=>setFilterSite(e.target.value)} style={{flex:1}}>
          <option value="">Tous les sites</option>
          {sites.map(s=><option key={s.id} value={String(s.id)}>{s.nom}</option>)}
        </select>
      </div>

      <div className="card">
        {loading ? <div className="loading">Chargement…</div> : filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📍</div><h3>Aucun emplacement</h3></div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Zone</th><th>Rayon</th><th>Étagère</th><th>Site</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id}>
                  <td><strong>{e.zone}</strong></td>
                  <td>{e.rayon||'—'}</td>
                  <td>{e.etagere||'—'}</td>
                  <td><span className="badge badge-envoyee">{e.siteNom}</span></td>
                  <td style={{display:'flex',gap:'0.5rem'}}>
                    <Link to={`/emplacement/${e.id}`} className="btn btn-secondary" title="Voir">👁️</Link>
                    <Link to={`/emplacement/edit/${e.id}`} className="btn btn-secondary" title="Modifier">✏️</Link>
                    <button className="btn btn-danger" onClick={()=>setDeleteId(e.id)} title="Supprimer">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deleteId && (
        <div style={OV}>
          <div style={{...MB,maxWidth:'400px',textAlign:'center'}}>
            <p style={{fontSize:'1.3rem'}}>🗑️</p>
            <p>Confirmer la suppression ?</p>
            <div style={{display:'flex',gap:'0.75rem',justifyContent:'center',marginTop:'1rem'}}>
              <button className="btn btn-secondary" onClick={()=>setDeleteId(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const OV = { position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(3px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 };
const MB = { background:'#fff',borderRadius:'16px',padding:'2rem',width:'95%',maxWidth:'560px',boxShadow:'0 24px 48px rgba(0,0,0,0.18)',maxHeight:'90vh',overflowY:'auto' };
