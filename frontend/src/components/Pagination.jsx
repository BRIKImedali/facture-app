import React from 'react';

/**
 * Composant de pagination réutilisable.
 * Props :
 *   - currentPage   : numéro de la page actuelle (1-indexé)
 *   - totalPages    : nombre total de pages
 *   - onPageChange  : callback(newPage)
 *   - totalItems    : nombre total d'éléments (optionnel, pour afficher "X résultat(s)")
 *   - pageSize      : nombre d'éléments par page (optionnel)
 */
const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, pageSize }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const delta = 2; // fenêtre autour de la page courante

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  const start = (currentPage - 1) * pageSize + 1;
  const end   = Math.min(currentPage * pageSize, totalItems);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.85rem 1.25rem',
      borderTop: '1px solid #e2e8f0',
      background: '#f8fafc',
      flexWrap: 'wrap',
      gap: '0.5rem',
    }}>
      {/* Infos résultats */}
      {totalItems != null && pageSize != null && (
        <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
          Affichage <strong>{start}–{end}</strong> sur <strong>{totalItems}</strong> résultat(s)
        </span>
      )}

      {/* Contrôles de pagination */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
        {/* Bouton précédent */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={btnStyle(currentPage === 1, false)}
          title="Page précédente"
        >
          ‹
        </button>

        {/* Numéros de pages */}
        {pages.map((p, idx) =>
          p === '...' ? (
            <span key={`dots-${idx}`} style={{ padding: '0 4px', color: '#94a3b8', fontSize: '0.85rem' }}>…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              style={btnStyle(false, p === currentPage)}
              title={`Page ${p}`}
            >
              {p}
            </button>
          )
        )}

        {/* Bouton suivant */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={btnStyle(currentPage === totalPages, false)}
          title="Page suivante"
        >
          ›
        </button>
      </div>

      {/* Indicateur "Page X sur Y" */}
      <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>
        Page <strong style={{ color: '#6366f1' }}>{currentPage}</strong> sur <strong>{totalPages}</strong>
      </span>
    </div>
  );
};

const btnStyle = (disabled, active) => ({
  minWidth: '32px',
  height: '32px',
  padding: '0 8px',
  border: active ? '2px solid #6366f1' : '1px solid #e2e8f0',
  borderRadius: '6px',
  background: active ? '#6366f1' : disabled ? '#f8fafc' : '#fff',
  color: active ? '#fff' : disabled ? '#cbd5e1' : '#374151',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontWeight: active ? 700 : 400,
  fontSize: '0.88rem',
  transition: 'all 0.15s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export default Pagination;
