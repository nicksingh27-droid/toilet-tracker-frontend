import React from 'react';

const ToiletList = ({ toilets = [] }) => {  // ← Default to empty array
  if (!toilets || toilets.length === 0) {
    return <p>No toilets logged yet — time to start your quest! 🚽</p>;
  }

  return (
    <div style={{ marginTop: '40px', textAlign: 'left', maxWidth: '600px', margin: '40px auto' }}>
      <h2>Your Logged Toilets ({toilets.length})</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {toilets
          .sort((a, b) => new Date(b.visitedAt) - new Date(a.visitedAt))
          .map((toilet) => (
            <li key={toilet._id} style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>
              <strong>{toilet.name}</strong><br />
              📍 {toilet.address || 'GPS Location'}<br />
              🕐 {new Date(toilet.visitedAt).toLocaleString()}
            </li>
          ))}
      </ul>
    </div>
  );
};

export default ToiletList;