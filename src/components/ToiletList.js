import React from 'react';
import axios from 'axios';

const ToiletList = ({ toilets = [], fetchData }) => {
  if (!toilets || toilets.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px', 
        color: '#8fb3c7',
        fontSize: '1.2em'
      }}>
        <p>No thrones claimed yet — time to start your conquest! 🚽</p>
      </div>
    );
  }

  const toggleGoldenBowl = async (toiletId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(
        `/api/toilets/${toiletId}/toggle-golden`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      alert(res.data.message);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error toggling Golden Bowl');
    }
  };

  return (
    <div style={{ 
      marginTop: '40px', 
      background: 'linear-gradient(135deg, #1a2a3a, #0d1620)',
      border: '2px solid #00d4ff',
      borderRadius: '15px',
      padding: '40px',
      boxShadow: '0 10px 30px rgba(0, 212, 255, 0.2)'
    }}>
      <h2 style={{
        color: '#00d4ff',
        fontFamily: "'Bebas Neue', cursive",
        fontSize: '2.5em',
        marginBottom: '30px',
        letterSpacing: '3px',
        textAlign: 'center',
        textShadow: '0 0 20px rgba(0, 212, 255, 0.5)'
      }}>
        🚽 Your Claimed Thrones ({toilets.length})
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {toilets
          .sort((a, b) => new Date(b.visitedAt) - new Date(a.visitedAt))
          .map((toilet) => (
            <div
              key={toilet._id}
              style={{
                padding: '20px',
                background: toilet.isGoldenBowl 
                  ? 'linear-gradient(135deg, #2a1f0a, #1a1306)' 
                  : 'linear-gradient(135deg, #1a2a3a, #0d1620)',
                border: toilet.isGoldenBowl 
                  ? '2px solid #ffa500' 
                  : '2px solid #2a3a4a',
                borderRadius: '10px',
                boxShadow: toilet.isGoldenBowl 
                  ? '0 5px 20px rgba(255, 165, 0, 0.3)' 
                  : '0 5px 15px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateX(5px)';
                e.currentTarget.style.boxShadow = toilet.isGoldenBowl
                  ? '0 8px 25px rgba(255, 165, 0, 0.5)'
                  : '0 8px 20px rgba(0, 212, 255, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = toilet.isGoldenBowl
                  ? '0 5px 20px rgba(255, 165, 0, 0.3)'
                  : '0 5px 15px rgba(0,0,0,0.2)';
              }}
            >
              <div style={{ 
                fontSize: '1.3em', 
                fontWeight: '700',
                color: toilet.isGoldenBowl ? '#ffa500' : '#00d4ff',
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                {toilet.name} {toilet.isGoldenBowl && '👑'}
              </div>
              <div style={{ color: '#8fb3c7', marginBottom: '5px', fontSize: '1em' }}>
                📍 {toilet.address || 'GPS Drop Zone'}
              </div>
              <div style={{ color: '#6b8a9e', fontSize: '0.9em', marginBottom: '15px' }}>
                🕐 {new Date(toilet.visitedAt).toLocaleString()}
              </div>
              <button
                onClick={() => toggleGoldenBowl(toilet._id, toilet.isGoldenBowl)}
                style={{
                  padding: '10px 20px',
                  background: toilet.isGoldenBowl 
                    ? 'linear-gradient(135deg, #ffa500, #ff8c00)' 
                    : 'linear-gradient(135deg, #00d4ff, #00ffff)',
                  color: toilet.isGoldenBowl ? '#1a1306' : '#0d1620',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '0.95em',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  transition: 'all 0.3s ease',
                  boxShadow: toilet.isGoldenBowl
                    ? '0 4px 15px rgba(255, 165, 0, 0.4)'
                    : '0 4px 15px rgba(0, 212, 255, 0.4)'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = toilet.isGoldenBowl
                    ? '0 6px 20px rgba(255, 165, 0, 0.6)'
                    : '0 6px 20px rgba(0, 212, 255, 0.6)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = toilet.isGoldenBowl
                    ? '0 4px 15px rgba(255, 165, 0, 0.4)'
                    : '0 4px 15px rgba(0, 212, 255, 0.4)';
                }}
              >
                {toilet.isGoldenBowl ? '❌ Remove Crown' : '👑 Crown This Bowl'}
              </button>
            </div>
          ))}
      </div>
    </div>
  );
};

export default ToiletList;