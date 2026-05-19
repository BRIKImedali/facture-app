import React, { useState, useRef, useEffect } from 'react';

const SearchableSelect = ({
  value,
  onChange,
  options = [],
  valueKey = 'id',
  labelKey = 'label',
  renderLabel,
  placeholder = '— Sélectionner —',
  required = false,
  disabled = false,
  className = '',
  style = {},
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const searchRef = useRef(null);

  const selected = options.find(o => String(o[valueKey]) === String(value));
  const displayLabel = selected
    ? (renderLabel ? renderLabel(selected) : selected[labelKey])
    : null;

  const filtered = options.filter(o => {
    const label = renderLabel ? renderLabel(o) : String(o[labelKey] || '');
    return label.toLowerCase().includes(search.toLowerCase());
  });

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option[valueKey]);
    setOpen(false);
    setSearch('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', ...style }}
      className={`searchable-select-wrapper ${className}`}
    >
      {/* Trigger */}
      <div
        onClick={() => !disabled && setOpen(prev => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.45rem 0.75rem',
          border: '1px solid #cbd5e1',
          borderRadius: '0.375rem',
          background: disabled ? '#f1f5f9' : '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          minHeight: '38px',
          fontSize: '0.9rem',
          color: displayLabel ? '#1e293b' : '#94a3b8',
          userSelect: 'none',
          boxShadow: open ? '0 0 0 2px #6366f140' : undefined,
          borderColor: open ? '#6366f1' : '#cbd5e1',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayLabel || placeholder}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 6 }}>
          {value && !disabled && (
            <span
              onClick={handleClear}
              title="Effacer"
              style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: 1, cursor: 'pointer', padding: '0 2px' }}
            >
              ×
            </span>
          )}
          <span style={{ color: '#94a3b8', fontSize: '0.75rem', transition: 'transform 0.15s', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▼
          </span>
        </span>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 1000,
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            overflow: 'hidden',
          }}
        >
          {/* Search input */}
          <div style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: 8, color: '#94a3b8', fontSize: '0.85rem' }}></span>
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                onClick={e => e.stopPropagation()}
                style={{
                  width: '100%',
                  padding: '6px 8px 6px 28px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.375rem',
                  fontSize: '0.85rem',
                  outline: 'none',
                  background: '#fff',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Options list */}
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>
                Aucun résultat
              </div>
            ) : (
              filtered.map(o => {
                const isSelected = String(o[valueKey]) === String(value);
                const label = renderLabel ? renderLabel(o) : o[labelKey];
                return (
                  <div
                    key={o[valueKey]}
                    onClick={() => handleSelect(o)}
                    style={{
                      padding: '9px 16px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: isSelected ? '#ede9fe' : 'transparent',
                      color: isSelected ? '#4f46e5' : '#1e293b',
                      fontWeight: isSelected ? 600 : 400,
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ width: 16, flexShrink: 0, color: '#6366f1', fontSize: '0.75rem' }}>
                      {isSelected ? '✓' : ''}
                    </span>
                    {label}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Hidden native input for form required validation */}
      {required && (
        <input
          tabIndex={-1}
          required
          value={value || ''}
          onChange={() => { }}
          style={{ opacity: 0, height: 0, width: 0, position: 'absolute', pointerEvents: 'none' }}
        />
      )}
    </div>
  );
};

export default SearchableSelect;
