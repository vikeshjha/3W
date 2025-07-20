import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5000/api';

const App = () => {
  const [users, setUsers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [message, setMessage] = useState('');
  const [recentlyUpdated, setRecentlyUpdated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/users`);
      setUsers(res.data);
      if (res.data.length > 0 && !selectedUser) {
        setSelectedUser(res.data[0]._id);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setError("Failed to fetch users. Please check if the server is running.");
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get(`${API_URL}/leaderboard`);
      setLeaderboard(res.data);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/history`);
      setHistory(res.data);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      await axios.post(`${API_URL}/users`, { name: newUserName.trim() });
      setNewUserName('');
      setMessage(`User "${newUserName.trim()}" added successfully!`);
      await fetchUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error("Failed to add user:", error);
      if (error.response && error.response.status === 400) {
        setError("This name already exists. Please choose a different name.");
      } else {
        setError("Failed to add user. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClaimPoints = async () => {
    if (!selectedUser) {
      setError("Please select a user to claim points");
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post(`${API_URL}/claim`, { userId: selectedUser });
      setMessage(res.data.message);
      setRecentlyUpdated(selectedUser);
      
      await Promise.all([fetchLeaderboard(), fetchHistory()]);
      
      setTimeout(() => setMessage(''), 3000);
      setTimeout(() => setRecentlyUpdated(null), 1500);
      
    } catch (error) {
      console.error("Failed to claim points:", error);
      setError("Failed to claim points. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError('');
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchLeaderboard(), fetchHistory()]);
      setLoading(false);
    };
    
    initializeData();
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (loading && users.length === 0) {
    return (
      <div className="app-container">
        <div className="loading">Loading application...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <h1>🏆 Leaderboard Application</h1>

      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button className="error-close" onClick={clearError}>×</button>
        </div>
      )}

      <div className="add-user-form">
        <h2>➕ Add New User</h2>
        <form onSubmit={handleAddUser}>
          <input
            type="text"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            placeholder="Enter new user's name"
            disabled={loading}
            maxLength="50"
          />
          <button type="submit" disabled={loading || !newUserName.trim()}>
            {loading ? 'Adding...' : 'Add User'}
          </button>
        </form>
      </div>

      <div className="controls">
        <h2>🎯 Claim Points</h2>
        <div className="claim-section">
          <select 
            value={selectedUser} 
            onChange={(e) => setSelectedUser(e.target.value)}
            disabled={loading}
          >
            <option value="">Select a user...</option>
            {users.map(user => (
              <option key={user._id} value={user._id}>
                {user.name}
              </option>
            ))}
          </select>
          <button 
            onClick={handleClaimPoints}
            disabled={loading || !selectedUser}
            className="claim-button"
          >
            {loading ? 'Claiming...' : 'Claim Points 🎲'}
          </button>
        </div>
        {message && <p className="success-message">{message}</p>}
      </div>

      <div className="leaderboard">
        <h2>🏅 Leaderboard</h2>
        {leaderboard.length === 0 ? (
          <p className="no-data">No users found. Add some users to get started!</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Total Points</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map(user => (
                <tr 
                  key={user._id} 
                  className={user._id === recentlyUpdated ? 'highlight-update' : ''}
                >
                  <td>
                    <span className={`rank-badge rank-${user.rank}`}>
                      #{user.rank}
                    </span>
                  </td>
                  <td className="user-name">{user.name}</td>
                  <td className="points">{user.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="history">
        <h2>📋 Claim History</h2>
        {history.length === 0 ? (
          <p className="no-data">No claim history yet. Start claiming points!</p>
        ) : (
          <div className="history-table-container">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Points Claimed</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 10).map(entry => (
                  <tr key={entry._id}>
                    <td className="user-name">
                      {entry.userId ? entry.userId.name : 'Unknown User'}
                    </td>
                    <td className="points-claimed">+{entry.pointsClaimed}</td>
                    <td className="timestamp">
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
