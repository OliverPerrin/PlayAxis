
import React, { useEffect, useState } from 'react';
import UserProfile from './UserProfile';

function Profile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/v1/users/me', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data);
          setFullName(data.full_name || '');
          setSelectedInterests(data.interests.map(i => i.name));
        } else {
          setError('Failed to fetch user');
        }
      } catch (error) {
        setError(error.message);
      }
    };

    if (localStorage.getItem('token')) {
      fetchUser();
    }
  }, []);

  const handleFullNameChange = async () => {
    try {
      const response = await fetch('/api/v1/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ full_name: fullName }),
      });
      if (!response.ok) {
        throw new Error('Failed to update full name');
      }
      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error('Error updating full name:', error);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 mt-4">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Your Profile</h2>
      {error && <p className="text-red-500">{error}</p>}
      {user && (
        <div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="full-name">
              Full Name
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="full-name"
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onBlur={handleFullNameChange} // Save on blur
            />
          </div>
          <p><span className="font-semibold">Email:</span> {user.email}</p>
          <UserProfile selectedInterests={selectedInterests} setSelectedInterests={setSelectedInterests} />
        </div>
      )}
    </div>
  );
}

export default Profile;
