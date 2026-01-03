import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ToiletMap from './components/Map';
import ToiletList from './components/ToiletList';
import './App.css';

// Replace with your actual Render backend URL
const API_URL = 'https://toilet-tracker-backend-1.onrender.com';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [progress, setProgress] = useState(null);
  const [toilets, setToilets] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [mapCenter, setMapCenter] = useState([51.505, -0.09]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Manual entry fields
  const [manualName, setManualName] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  const [manualAddress, setManualAddress] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [progRes, toiletsRes, leaderRes] = await Promise.all([
        axios.get('/api/toilets/my-progress'),
        axios.get('/api/toilets'),
        axios.get('/api/toilets/leaderboard')
      ]);
      setProgress(progRes.data);
      setToilets(toiletsRes.data);
      setLeaderboard(leaderRes.data);
      setUser({ loggedIn: true });

      if (toiletsRes.data.length > 0) {
        const latest = toiletsRes.data[0];
        setMapCenter([latest.location.coordinates[1], latest.location.coordinates[0]]);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      logout();
    }
  }, []);

  useEffect(() => {
    axios.defaults.baseURL = API_URL;
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchData();
    }
  }, [token, fetchData]);

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      handleSuccessfulAuth(res.data.token);
    } catch (err) {
      if (err.response?.data?.message.includes('Invalid')) {
        try {
          const signupRes = await axios.post('/api/auth/signup', { email, password });
          handleSuccessfulAuth(signupRes.data.token);
        } catch (signupErr) {
          alert('Signup failed: ' + (signupErr.response?.data?.message || 'Error'));
        }
      } else {
        alert('Login failed: ' + (err.response?.data?.message || 'Error'));
      }
    }
  };

  const handleSuccessfulAuth = (newToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    fetchData();
  };

  const logCurrentLocation = () => {
    setLoading(true);
    setMessage('Getting your location...');

    if (!navigator.geolocation) {
      setMessage('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setMapCenter([lat, lon]);

        try {
          await axios.post('/api/toilets', {
            name: 'Toilet at Current Location',
            latitude: lat,
            longitude: lon,
            address: 'Auto-detected via GPS'
          });
          setMessage('🚽 Toilet logged successfully!');
          fetchData();
        } catch (err) {
          setMessage('Error: ' + (err.response?.data?.message || 'Already logged here?'));
        }
        setLoading(false);
      },
      (error) => {
        setMessage('Location access denied or timed out');
        setLoading(false);
      },
      { timeout: 15000 }
    );
  };

  const logManualToilet = async (e) => {
    e.preventDefault();
    if (!manualName || !manualLat || !manualLon) {
      setMessage('Name, latitude, and longitude are required!');
      return;
    }

    setLoading(true);
    setMessage('Logging manual toilet...');

    try {
      await axios.post('/api/toilets', {
        name: manualName,
        latitude: parseFloat(manualLat),
        longitude: parseFloat(manualLon),
        address: manualAddress || 'Manual entry'
      });
      setMessage('🚽 Manual toilet logged!');
      setManualName('');
      setManualLat('');
      setManualLon('');
      setManualAddress('');
      fetchData();
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.message || 'Failed'));
    }
    setLoading(false);
  };

  const logout = () => {
    setToken('');
    setUser(null);
    setProgress(null);
    setToilets([]);
    setLeaderboard([]);
    setMessage('');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  if (!user) {
    return (
      <div className="App" style={{ textAlign: 'center', padding: '40px' }}>
        <h1>🚽 Toilet Tracker</h1>
        <h2>Join the race to 400 unique toilets</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const email = e.target.email.value.trim();
            const password = e.target.password.value;
            if (email && password) {
              login(email, password);
            } else {
              alert('Please enter email and password');
            }
          }}
        >
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            style={{ padding: '12px', margin: '10px 0', width: '320px', fontSize: '1em' }}
          />
          <br />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            style={{ padding: '12px', margin: '10px 0', width: '320px', fontSize: '1em' }}
          />
          <br />
          <button
            type="submit"
            style={{
              padding: '15px 40px',
              fontSize: '1.3em',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              marginTop: '30px'
            }}
          >
            Login or Sign Up
          </button>
        </form>
        <p style={{ marginTop: '30px' }}>
          New here? Just enter any email & password — it will create your account automatically!
        </p>
      </div>
    );
  }

  return (
    <div className="App" style={{ padding: '20px' }}>
      <h1>🚽 Toilet Tracker</h1>
      <p>
        Welcome back! <button onClick={logout}>Logout</button>
      </p>

      {progress && (
        <div>
          <h2>Your Progress</h2>
          <h1>{progress.total} / 400 Unique Toilets</h1>
          <div style={{ width: '80%', margin: '20px auto' }}>
            <progress value={progress.total} max="400" style={{ width: '100%', height: '40px' }} />
          </div>
          <h3>{progress.message}</h3>
        </div>
      )}

      <div style={{ margin: '40px 0' }}>
        <button
          onClick={logCurrentLocation}
          disabled={loading}
          style={{ fontSize: '1.5em', padding: '20px 40px', marginBottom: '20px' }}
        >
          {loading ? 'Locating...' : '🚽 Log Toilet at My Current Location'}
        </button>

        <h3>Manual Entry (No GPS)</h3>
        <form onSubmit={logManualToilet}>
          <input
            type="text"
            placeholder="Toilet Name (e.g., Cafe Restroom)"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            required
            style={{ display: 'block', margin: '10px auto', padding: '10px', width: '300px' }}
          />
          <input
            type="number"
            step="any"
            placeholder="Latitude (e.g., 40.7128)"
            value={manualLat}
            onChange={(e) => setManualLat(e.target.value)}
            required
            style={{ display: 'block', margin: '10px auto', padding: '10px', width: '300px' }}
          />
          <input
            type="number"
            step="any"
            placeholder="Longitude (e.g., -74.0060)"
            value={manualLon}
            onChange={(e) => setManualLon(e.target.value)}
            required
            style={{ display: 'block', margin: '10px auto', padding: '10px', width: '300px' }}
          />
          <input
            type="text"
            placeholder="Address (optional)"
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            style={{ display: 'block', margin: '10px auto', padding: '10px', width: '300px' }}
          />
          <button type="submit" disabled={loading}>Log Manual Toilet</button>
        </form>

        <p style={{ fontSize: '1.2em', minHeight: '30px', marginTop: '20px' }}>{message}</p>
      </div>

      <h2>Map of Your Conquests</h2>
      <ToiletMap center={mapCenter} toilets={toilets} />

      <ToiletList toilets={toilets} fetchData={fetchData} />

      <div style={{ marginTop: '60px' }}>
        <h2>Leaderboard 🏆</h2>
        {leaderboard.length === 0 ? (
          <p>No users on the board yet — be the first!</p>
        ) : (
          <table style={{ width: '80%', margin: '0 auto', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ borderBottom: '2px solid #ddd', padding: '12px' }}>Rank</th>
                <th style={{ borderBottom: '2px solid #ddd', padding: '12px' }}>User</th>
                <th style={{ borderBottom: '2px solid #ddd', padding: '12px' }}>Toilets</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => (
                <tr key={index}>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{index + 1}</td>
                  <td style={{ padding: '12px' }}>{entry.email.split('@')[0]}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{entry.total}/400</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default App;