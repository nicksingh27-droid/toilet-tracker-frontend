import React from 'react';
import axios from 'axios';

const ToiletList = ({ toilets = [], fetchData }) => {
  if (!toilets || toilets.length === 0) {
    return <p>No toilets logged yet — time to start your quest! 🚽</p>;
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
    <div style={{ marginTop: '40px', textAlign: 'left', maxWidth: '600px', margin: '40px auto' }}>
      <h2>Your Logged Toilets ({toilets.length})</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {toilets
          .sort((a, b) => new Date(b.visitedAt) - new Date(a.visitedAt))
          .map((toilet) => (
            <li
              key={toilet._id}
              style={{
                padding: '15px',
                borderBottom: '1px solid #ddd',
                background: toilet.isGoldenBowl ? '#fffbe6' : 'white'
              }}
            >
              <strong>
                {toilet.name} {toilet.isGoldenBowl && '🏆 Golden Bowl'}
              </strong>
              <br />
              📍 {toilet.address || 'GPS Location'}
              <br />
              🕐 {new Date(toilet.visitedAt).toLocaleString()}
              <br />
              <button
                onClick={() => toggleGoldenBowl(toilet._id, toilet.isGoldenBowl)}
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  background: toilet.isGoldenBowl ? '#FFD700' : '#4CAF50',
                  color: toilet.isGoldenBowl ? 'black' : 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {toilet.isGoldenBowl ? '❌ Remove Golden Bowl' : '⭐ Make Golden Bowl'}
              </button>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default ToiletList;