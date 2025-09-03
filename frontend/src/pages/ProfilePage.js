import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserIcon, 
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  PencilIcon,
  CameraIcon,
  TrophyIcon,
  HeartIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { updateUser, updateUserInterests } from '../api';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editingInterests, setEditingInterests] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    location: '',
    bio: ''
  });
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [loading, setLoading] = useState(false);

  const availableInterests = [
    { id: 'running', name: 'Running', emoji: '🏃‍♂️', category: 'fitness' },
    { id: 'tennis', name: 'Tennis', emoji: '🎾', category: 'sports' },
    { id: 'cycling', name: 'Cycling', emoji: '🚴‍♂️', category: 'fitness' },
    { id: 'swimming', name: 'Swimming', emoji: '🏊‍♂️', category: 'fitness' },
    { id: 'soccer', name: 'Soccer', emoji: '⚽', category: 'sports' },
    { id: 'basketball', name: 'Basketball', emoji: '🏀', category: 'sports' },
    { id: 'hiking', name: 'Hiking', emoji: '🥾', category: 'outdoor' },
    { id: 'climbing', name: 'Rock Climbing', emoji: '🧗‍♂️', category: 'outdoor' },
    { id: 'esports', name: 'Esports', emoji: '🎮', category: 'gaming' },
    { id: 'formula1', name: 'Formula 1', emoji: '🏎️', category: 'motorsports' },
    { id: 'skiing', name: 'Skiing', emoji: '⛷️', category: 'winter' },
    { id: 'yoga', name: 'Yoga', emoji: '🧘‍♀️', category: 'fitness' }
  ];

  const achievements = [
    { id: 1, title: '5K Runner', description: 'Completed first 5K', date: '2025-01-10', emoji: '🏃‍♂️' },
    { id: 2, title: 'Early Bird', description: '7 morning workouts', date: '2025-01-15', emoji: '🌅' },
    { id: 3, title: 'Streak Master', description: '30 day exercise streak', date: '2025-01-20', emoji: '🔥' }
  ];

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        location: user.location || '',
        bio: user.bio || ''
      });
      setSelectedInterests(user.interests?.map(interest => interest.name) || []);
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateUser(formData);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInterests = async () => {
    setLoading(true);
    try {
      await updateUserInterests(selectedInterests);
      toast.success('Interests updated successfully!');
      setEditingInterests(false);
    } catch (error) {
      toast.error('Failed to update interests');
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interestName) => {
    setSelectedInterests(prev => 
      prev.includes(interestName) 
        ? prev.filter(name => name !== interestName)
        : [...prev, interestName]
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6 }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen p-6 space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
          My Profile
        </h1>
        <p className="text-gray-400 text-lg">Manage your account and preferences</p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Profile Card */}
        <motion.div variants={itemVariants} className="xl:col-span-2">
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/50">
            {/* Profile Header */}
            <div className="flex items-start space-x-6 mb-8">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                  <UserIcon className="w-12 h-12 text-white" />
                </div>
                <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center transition-colors">
                  <CameraIcon className="w-4 h-4 text-white" />
                </button>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{user?.full_name || 'Unknown User'}</h2>
                    <p className="text-gray-400">{user?.email}</p>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                    <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
                  </motion.button>
                </div>
                
                <div className="flex items-center space-x-6 text-sm text-gray-400">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Member since Jan 2025</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPinIcon className="w-4 h-4" />
                    <span>{formData.location || 'Location not set'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <AnimatePresence>
              {isEditing ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-400 text-sm font-medium mb-2">Full Name</label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        placeholder="Enter your full name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-400 text-sm font-medium mb-2">Location</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        placeholder="City, Country"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 text-sm font-medium mb-2">Bio</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  
                  <div className="flex space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSave}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Bio</h3>
                    <p className="text-gray-400">
                      {formData.bio || 'No bio added yet. Click edit to add one!'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Sidebar */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-bold text-white mb-4">Quick Stats</h3>
            <div className="space-y-4">
              {[
                { label: 'Workouts Logged', value: '42', icon: '💪' },
                { label: 'Total Distance', value: '156 km', icon: '📏' },
                { label: 'Active Days', value: '28', icon: '📅' },
                { label: 'Achievements', value: '12', icon: '🏆' }
              ].map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{stat.icon}</span>
                    <span className="text-gray-400">{stat.label}</span>
                  </div>
                  <span className="text-white font-semibold">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Achievements */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-bold text-white mb-4">Recent Achievements</h3>
            <div className="space-y-3">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg">
                  <span className="text-2xl">{achievement.emoji}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white text-sm">{achievement.title}</h4>
                    <p className="text-xs text-gray-400">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Interests Section */}
      <motion.div variants={itemVariants} className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">My Interests</h3>
            <p className="text-gray-400">Select sports and activities you're passionate about</p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setEditingInterests(!editingInterests)}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            <HeartIcon className="w-4 h-4" />
            <span>{editingInterests ? 'Cancel' : 'Edit Interests'}</span>
          </motion.button>
        </div>

        <AnimatePresence>
          {editingInterests ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {availableInterests.map((interest) => (
                  <motion.button
                    key={interest.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleInterest(interest.name)}
                    className={`p-4 rounded-xl transition-all duration-300 ${
                      selectedInterests.includes(interest.name)
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                        : 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50 hover:text-white'
                    }`}
                  >
                    <div className="text-2xl mb-2">{interest.emoji}</div>
                    <p className="font-semibold text-sm">{interest.name}</p>
                  </motion.button>
                ))}
              </div>
              
              <div className="flex space-x-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveInterests}
                  disabled={loading}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Interests'}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-wrap gap-3"
            >
              {selectedInterests.length > 0 ? (
                selectedInterests.map((interestName) => {
                  const interest = availableInterests.find(i => i.name === interestName);
                  return (
                    <div
                      key={interestName}
                      className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-300 px-4 py-2 rounded-full"
                    >
                      <span className="text-lg">{interest?.emoji}</span>
                      <span className="font-medium">{interestName}</span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 w-full">
                  <HeartIcon className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400">No interests selected yet. Click edit to add some!</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default ProfilePage;