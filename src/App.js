import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ToiletMap from './components/Map';
import ToiletList from './components/ToiletList';
import './App.css';

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

  const [manualName, setManualName] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  const [manualAddress, setManualAddress] = useState('');

  useEffect(() => {
    axios.defaults.baseURL = API_URL;
  }, []);

  const fetchData = useCallback(async () => {
    if (!token) return;
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [progRes, toiletsRes, leaderRes] = await Promise.all([
        axios.get('/api/toilets/my-progress', { headers }),
        axios.get('/api/toilets', { headers }),
        axios.get('/api/toilets/leaderboard', { headers })
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
      if (err.response?.status === 401) {
        logout();
      }
    }
  }, [token]);

  useEffect(() => {
    if (token) {
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
  };

  const logCurrentLocation = () => {
    setLoading(true);
    setMessage('🎯 Acquiring target coordinates...');

    if (!navigator.geolocation) {
      setMessage('⚠️ GPS offline - use manual entry');
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
            name: 'Throne at Current Location',
            latitude: lat,
            longitude: lon,
            address: 'GPS Drop Zone'
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setMessage('💩 THRONE CLAIMED! Another one bites the dust!');
          fetchData();
        } catch (err) {
          setMessage('❌ ' + (err.response?.data?.message || 'Target already claimed!'));
        }
        setLoading(false);
      },
      (error) => {
        setMessage('⚠️ Location denied - go manual');
        setLoading(false);
      },
      { timeout: 15000 }
    );
  };

  const logManualToilet = async (e) => {
    e.preventDefault();
    if (!manualName || !manualLat || !manualLon) {
      setMessage('⚠️ Need name and coordinates to claim this throne!');
      return;
    }

    setLoading(true);
    setMessage('🎯 Locking onto target...');

    try {
      await axios.post('/api/toilets', {
        name: manualName,
        latitude: parseFloat(manualLat),
        longitude: parseFloat(manualLon),
        address: manualAddress || 'Manual Drop Zone'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('💩 BOOM! Throne conquered!');
      setManualName('');
      setManualLat('');
      setManualLon('');
      setManualAddress('');
      fetchData();
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Mission failed!'));
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
  };

  const getStreak = () => {
    if (!toilets.length) return 0;
    const dates = toilets.map(t => new Date(t.visitedAt).toDateString());
    const uniqueDates = [...new Set(dates)];
    return uniqueDates.length;
  };

  const goldenBowlCount = toilets.filter(t => t.isGoldenBowl).length;

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: "'Rajdhani', sans-serif"
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1a2a3a, #0d1620)',
          border: '2px solid #00d4ff',
          borderRadius: '15px',
          padding: '50px',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 10px 40px rgba(0, 212, 255, 0.3)'
        }}>
          <h1 style={{
            fontSize: '3em',
            color: '#00d4ff',
            textAlign: 'center',
            marginBottom: '10px',
            textShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
            letterSpacing: '3px',
            fontFamily: "'Bebas Neue', cursive"
          }}>
            🚽 TOILET TRACKER
          </h1>
          <p style={{
            textAlign: 'center',
            color: '#8fb3c7',
            marginBottom: '30px',
            fontSize: '1.1em',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Throne Conquest • Bowl Domination
          </p>
          <form onSubmit={(e) => {
            e.preventDefault();
            const email = e.target.email.value.trim();
            const password = e.target.password.value;
            if (email && password) {
              login(email, password);
            } else {
              alert('⚠️ Enter credentials to proceed');
            }
          }}>
            <input
              type="email"
              name="email"
              placeholder="EMAIL"
              required
              style={{
                width: '100%',
                padding: '15px',
                margin: '10px 0',
                background: '#0d1620',
                border: '2px solid #1a2a3a',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '1em',
                fontWeight: '600',
                letterSpacing: '1px'
              }}
            />
            <input
              type="password"
              name="password"
              placeholder="PASSWORD"
              required
              style={{
                width: '100%',
                padding: '15px',
                margin: '10px 0',
                background: '#0d1620',
                border: '2px solid #1a2a3a',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '1em',
                fontWeight: '600',
                letterSpacing: '1px'
              }}
            />
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '18px',
                marginTop: '20px',
                background: 'linear-gradient(135deg, #00d4ff, #00ffff)',
                color: '#0d1620',
                border: 'none',
                borderRadius: '10px',
                fontSize: '1.3em',
                fontWeight: '700',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                fontFamily: "'Bebas Neue', cursive",
                boxShadow: '0 8px 20px rgba(0, 212, 255, 0.4)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 12px 30px rgba(0, 212, 255, 0.6)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 20px rgba(0, 212, 255, 0.4)';
              }}
            >
              🎯 Deploy
            </button>
          </form>
          <p style={{
            marginTop: '25px',
            textAlign: 'center',
            color: '#8fb3c7',
            fontSize: '0.9em'
          }}>
            New recruit? Just enter credentials to auto-enlist
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
      padding: '20px',
      fontFamily: "'Rajdhani', sans-serif",
      color: '#fff'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '4em',
            color: '#00d4ff',
            textShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
            letterSpacing: '4px',
            fontFamily: "'Bebas Neue', cursive",
            marginBottom: '10px'
          }}>
            🚽 TOILET TRACKER
          </h1>
          <p style={{
            color: '#8fb3c7',
            fontSize: '1.3em',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>
            Operation: Porcelain Domination
          </p>
          <button
            onClick={logout}
            style={{
              marginTop: '15px',
              padding: '10px 25px',
              background: 'transparent',
              border: '2px solid #00d4ff',
              color: '#00d4ff',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9em',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#00d4ff';
              e.target.style.color = '#0d1620';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = '#00d4ff';
            }}
          >
            ⬅️ Log Out
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          {[
            { emoji: '🚽', number: progress?.total || 0, label: 'Thrones Conquered' },
            { emoji: '💩', number: toilets.filter(t => new Date(t.visitedAt).toDateString() === new Date().toDateString()).length, label: "Today's Drops" },
            { emoji: '👑', number: goldenBowlCount, label: 'Royal Bowls' },
            { emoji: '🔥', number: getStreak(), label: 'Day Streak' }
          ].map((stat, i) => (
            <div key={i} style={{
              background: 'linear-gradient(135deg, #1a2a3a, #0d1620)',
              border: '2px solid #00d4ff',
              borderRadius: '10px',
              padding: '25px',
              textAlign: 'center',
              boxShadow: '0 8px 25px rgba(0, 212, 255, 0.2)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 12px 35px rgba(0, 212, 255, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 212, 255, 0.2)';
            }}>
              <div style={{ fontSize: '2.5em', marginBottom: '10px' }}>{stat.emoji}</div>
              <div style={{
                fontSize: '2.8em',
                fontWeight: '700',
                color: '#00d4ff',
                textShadow: '0 0 15px rgba(0, 212, 255, 0.7)'
              }}>{stat.number}</div>
              <div style={{
                color: '#8fb3c7',
                fontWeight: '600',
                fontSize: '1em',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Progress Section */}
        {progress && (
          <div style={{
            background: 'linear-gradient(135deg, #1a2a3a, #0d1620)',
            border: '2px solid #00d4ff',
            borderRadius: '15px',
            padding: '40px',
            marginBottom: '30px',
            boxShadow: '0 10px 30px rgba(0, 212, 255, 0.2)'
          }}>
            <h2 style={{
              textAlign: 'center',
              color: '#00d4ff',
              fontFamily: "'Bebas Neue', cursive",
              fontSize: '2.5em',
              marginBottom: '20px',
              letterSpacing: '3px',
              textShadow: '0 0 20px rgba(0, 212, 255, 0.5)'
            }}>
              OPERATION STATUS
            </h2>
            <div style={{
              background: '#0d1620',
              border: '2px solid #1a2a3a',
              borderRadius: '10px',
              height: '50px',
              overflow: 'hidden',
              position: 'relative',
              margin: '30px 0',
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
            }}>
              <div style={{
                background: 'linear-gradient(90deg, #00d4ff, #00ffff, #00d4ff)',
                height: '100%',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: '20px',
                color: '#0d1620',
                fontWeight: '700',
                fontSize: '1.3em',
                width: `${progress.percentage}%`,
                boxShadow: '0 0 20px rgba(0, 212, 255, 0.6)',
                transition: 'width 1s ease'
              }}>
                {progress.percentage}%
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
              <span style={{
                fontWeight: '700',
                color: '#00d4ff',
                fontSize: '1.2em',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                {progress.total} Bowls Claimed
              </span>
              <span style={{
                fontWeight: '700',
                color: '#00ffff',
                fontSize: '1.2em',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                {progress.remaining} Remain
              </span>
            </div>
            <div style={{
              textAlign: 'center',
              fontSize: '1.6em',
              fontWeight: '700',
              color: '#00ffff',
              marginTop: '20px',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}>
              💪 {progress.message}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ marginBottom: '30px' }}>
          <button
            onClick={logCurrentLocation}
            disabled={loading}
            style={{
              width: '100%',
              padding: '20px 50px',
              background: loading ? '#555' : 'linear-gradient(135deg, #00d4ff, #00ffff)',
              color: '#0d1620',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1.6em',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 10px 30px rgba(0, 212, 255, 0.4)',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              fontFamily: "'Bebas Neue', cursive",
              marginBottom: '20px'
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-5px)';
                e.target.style.boxShadow = '0 15px 40px rgba(0, 212, 255, 0.6)';
              }
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 10px 30px rgba(0, 212, 255, 0.4)';
            }}
          >
            {loading ? '🎯 Acquiring Target...' : '📍 Claim This Throne'}
          </button>

          {/* Manual Entry */}
          <div style={{
            background: 'linear-gradient(135deg, #1a2a3a, #0d1620)',
            border: '2px solid #1a2a3a',
            borderRadius: '15px',
            padding: '30px',
            marginTop: '20px'
          }}>
            <h3 style={{
              color: '#00d4ff',
              fontFamily: "'Bebas Neue', cursive",
              fontSize: '1.8em',
              marginBottom: '20px',
              letterSpacing: '2px',
              textAlign: 'center'
            }}>
              Manual Drop Zone Entry
            </h3>
            <form onSubmit={logManualToilet}>
              <input
                type="text"
                placeholder="Throne Name (e.g., The Golden Porcelain)"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  margin: '8px 0',
                  background: '#0d1620',
                  border: '2px solid #1a2a3a',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1em'
                }}
              />
              <input
                type="number"
                step="any"
                placeholder="Latitude"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  margin: '8px 0',
                  background: '#0d1620',
                  border: '2px solid #1a2a3a',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1em'
                }}
              />
              <input
                type="number"
                step="any"
                placeholder="Longitude"
                value={manualLon}
                onChange={(e) => setManualLon(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  margin: '8px 0',
                  background: '#0d1620',
                  border: '2px solid #1a2a3a',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1em'
                }}
              />
              <input
                type="text"
                placeholder="Address (optional)"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  margin: '8px 0',
                  background: '#0d1620',
                  border: '2px solid #1a2a3a',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1em'
                }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '15px',
                  marginTop: '10px',
                  background: 'linear-gradient(135deg, #00d4ff, #00ffff)',
                  color: '#0d1620',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1.2em',
                  fontWeight: '700',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  fontFamily: "'Bebas Neue', cursive"
                }}
              >
                💣 Deploy Drop
              </button>
            </form>
          </div>

          {message && (
            <p style={{
              fontSize: '1.2em',
              textAlign: 'center',
              marginTop: '20px',
              color: '#00ffff',
              fontWeight: '600',
              padding: '15px',
              background: 'rgba(0, 212, 255, 0.1)',
              borderRadius: '10px',
              border: '1px solid rgba(0, 212, 255, 0.3)'
            }}>
              {message}
            </p>
          )}
        </div>

        {/* Map */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{
            color: '#00d4ff',
            fontFamily: "'Bebas Neue', cursive",
            fontSize: '2.5em',
            marginBottom: '20px',
            letterSpacing: '3px',
            textAlign: 'center'
          }}>
            🗺️ Conquest Map
          </h2>
          <ToiletMap center={mapCenter} toilets={toilets} />
        </div>

        {/* Toilet List */}
        <ToiletList toilets={toilets} fetchData={fetchData} />

        {/* Leaderboard */}
        <div style={{
          background: 'linear-gradient(135deg, #1a2a3a, #0d1620)',
          border: '2px solid #00d4ff',
          borderRadius: '15px',
          padding: '40px',
          marginTop: '40px',
          boxShadow: '0 10px 30px rgba(0, 212, 255, 0.2)'
        }}>
          <h2 style={{
            textAlign: 'center',
            color: '#00d4ff',
            fontFamily: "'Bebas Neue', cursive",
            fontSize: '2.5em',
            marginBottom: '30px',
            letterSpacing: '3px',
            textShadow: '0 0 20px rgba(0, 212, 255, 0.5)'
          }}>
            🏆 HALL OF THRONE 🏆
          </h2>
          {leaderboard.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#8fb3c7', fontSize: '1.2em' }}>
              No warriors yet — be the first to dominate! 💪
            </p>
          ) : (
            <div>
              {leaderboard.map((entry, index) => {
                let bgGradient = 'linear-gradient(135deg, #1a2a3a, #0d1620)';
                let borderColor = '#2a3a4a';
                let textColor = '#fff';
                
                if (index === 0) {
                  bgGradient = 'linear-gradient(135deg, #ffd700, #ffed4e)';
                  borderColor = '#ffd700';
                  textColor = '#0d1620';
                } else if (index === 1) {
                  bgGradient = 'linear-gradient(135deg, #c0c0c0, #e8e8e8)';
                  borderColor = '#c0c0c0';
                  textColor = '#0d1620';
                } else if (index === 2) {
                  bgGradient = 'linear-gradient(135deg, #cd7f32, #e59866)';
                  borderColor = '#cd7f32';
                  textColor = '#fff';
                }

                return (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '20px',
                      marginBottom: '15px',
                      background: bgGradient,
                      border: `2px solid ${borderColor}`,
                      borderRadius: '10px',
                      color: textColor,
                      transition: 'transform 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateX(10px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{
                      fontSize: '2em',
                      fontWeight: '800',
                      marginRight: '20px',
                      minWidth: '60px',
                      textAlign: 'center'
                    }}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </div>
                    <div style={{
                      flex: 1,
                      fontSize: '1.3em',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      {entry.email.split('@')[0]}
                    </div>
                    <div style={{
                      fontSize: '1.6em',
                      fontWeight: '700'
                    }}>
                      {entry.total}/400
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;