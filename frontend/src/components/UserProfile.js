import React from 'react';

const interests = [
  'esports',
  'formula 1',
  'skiing',
  'soccer',
  'hiking',
  'american football',
  'tennis',
  'trail running',
  'recreational running',
  'track running',
];

function UserProfile({ selectedInterests, setSelectedInterests }) {
  const toggleInterest = async (interest) => {
    let newSelectedInterests;
    if (selectedInterests.includes(interest)) {
      newSelectedInterests = selectedInterests.filter(i => i !== interest);
    } else {
      newSelectedInterests = [...selectedInterests, interest];
    }
    setSelectedInterests(newSelectedInterests);

    // Save interests to the backend
    try {
      const response = await fetch('/api/v1/users/me/interests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(newSelectedInterests.map(name => ({ name }))),
      });
      if (!response.ok) {
        throw new Error('Failed to update interests');
      }
    } catch (error) {
      console.error('Error saving interests:', error);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Your Interests</h2>
      <div className="flex flex-wrap gap-2">
        {interests.map(interest => (
          <button
            key={interest}
            onClick={() => toggleInterest(interest)}
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              selectedInterests.includes(interest)
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}>
            {interest}
          </button>
        ))}
      </div>
    </div>
  );
}

export default UserProfile;