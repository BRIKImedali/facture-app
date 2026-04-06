import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';

const MESSAGES_INITIALS = [
  {
    role: 'assistant',
    text: '👋 Bonjour ! Je suis votre assistant facturation. Posez-moi vos questions sur les factures, la TVA, les clients ou les délais de paiement.',
  },
];

const ChatAssistant = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(MESSAGES_INITIALS);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const sendMessage = async () => {
    const question = input.trim();
    if (!question || loading) return;

    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { question });
      setMessages(prev => [...prev, { role: 'assistant', text: res.data.reponse }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: '❌ Erreur de connexion à l\'assistant. Vérifiez que le backend est démarré.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Bouton toggle flottant */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 1000,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', color: '#fff', transition: 'transform 0.2s',
        }}
        title="Assistant IA facturation"
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Fenêtre de chat */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 96, right: 28, zIndex: 999,
          width: 360, maxHeight: 520, borderRadius: 16,
          background: '#fff', boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}>
          {/* En-tête */}
          <div style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            padding: '0.875rem 1rem', color: '#fff',
          }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>🤖 Assistant Facturation IA</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Propulsé par Google Gemini</div>
          </div>

          {/* Zone messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '0.875rem',
            display: 'flex', flexDirection: 'column', gap: '0.6rem',
            background: '#f8fafc',
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '82%',
                  padding: '0.55rem 0.85rem',
                  borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                    : '#fff',
                  color: msg.role === 'user' ? '#fff' : '#1e293b',
                  fontSize: '0.82rem', lineHeight: 1.5,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '0.55rem 1rem', borderRadius: '14px 14px 14px 4px',
                  background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  fontSize: '0.85rem', color: '#94a3b8',
                }}>
                  ⏳ Réflexion en cours...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Zone de saisie */}
          <div style={{
            padding: '0.75rem', borderTop: '1px solid #e2e8f0',
            display: 'flex', gap: '0.5rem', background: '#fff',
          }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Posez votre question..."
              rows={2}
              disabled={loading}
              style={{
                flex: 1, resize: 'none', border: '1px solid #e2e8f0',
                borderRadius: 10, padding: '0.5rem 0.75rem',
                fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit',
                background: loading ? '#f8fafc' : '#fff',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                padding: '0 1rem', borderRadius: 10,
                background: loading || !input.trim()
                  ? '#e2e8f0' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                color: loading || !input.trim() ? '#94a3b8' : '#fff',
                fontWeight: 700, fontSize: '1rem', transition: 'all 0.2s',
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatAssistant;
