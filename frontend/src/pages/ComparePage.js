import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ScaleIcon, 
  UserIcon, 
  TrophyIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  StarIcon,
  FireIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const ComparePage = () => {
  const [selectedSport, setSelectedSport] = useState('running');
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock professional athletes data
  const professionalAthletes = {
    running: [
      {
        id: 1,
        name: 'Eliud Kipchoge',
        country: 'Kenya',
        specialty: 'Marathon',
        avatar: '🇰🇪',
        stats: {
          marathonPR: '2:01:39',
          weeklyMileage: 200,
          raceWins: 15,
          avgPace: '2:53',
          careerDistance: 50000
        },
        achievements: ['Olympic Gold 2016, 2020', 'World Record Holder', 'Berlin Marathon Winner']
      },
      {
        id: 2,
        name: 'Paula Radcliffe',
        country: 'UK',
        specialty: 'Marathon',
        avatar: '🇬🇧',
        stats: {
          marathonPR: '2:15:25',
          weeklyMileage: 160,
          raceWins: 12,
          avgPace: '3:13',
          careerDistance: 45000
        },
        achievements: ['World Record Holder (2003-2019)', 'World Champion', 'Commonwealth Games Gold']
      }
    ],
    tennis: [
      {
        id: 3,
        name: 'Novak Djokovic',
        country: 'Serbia',
        specialty: 'All Courts',
        avatar: '🇷🇸',
        stats: {
          grandSlams: 24,
          weeksAtNo1: 400,
          careerWins: 1050,
          winPercentage: 83.5,
          aces: 12000
        },
        achievements: ['24 Grand Slam Titles', '400+ Weeks at #1', 'Career Grand Slam']
      }
    ]
  };

  // Mock user stats
  const userStats = {
    running: {
      marathonPR: '3:45:22',
      weeklyMileage: 45,
      raceWins: 2,
      avgPace: '5:20',
      careerDistance: 2500
    },
    tennis: {
      grandSlams: 0,
      weeksAtNo1: 0,
      careerWins: 156,
      winPercentage: 68.2,
      aces: 245
    }
  };

  const sports = [
    { id: 'running', name: 'Running', icon: '🏃‍♂️' },
    { id: 'tennis', name: 'Tennis', icon: '🎾' },
    { id: 'cycling', name: 'Cycling', icon: '🚴‍♂️' },
    { id: 'swimming', name: 'Swimming', icon: '🏊‍♂️' }
  ];

  const getComparisonData = () => {
    if (!selectedAthlete || !userStats[selectedSport]) return [];

    const proStats = selectedAthlete.stats;
    const myStats = userStats[selectedSport];

    if (selectedSport === 'running') {
      return [
        {
          attribute: 'Weekly Mileage',
          professional: proStats.weeklyMileage,
          you: myStats.weeklyMileage,
          fullMark: proStats.weeklyMileage
        },
        {
          attribute: 'Race Wins',
          professional: proStats.raceWins,
          you: myStats.raceWins,
          fullMark: proStats.raceWins
        },
        {
          attribute: 'Career Distance (1000s km)',
          professional: proStats.careerDistance / 1000,
          you: myStats.careerDistance / 1000,
          fullMark: proStats.careerDistance / 1000
        }
      ];
    }

    return [];
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
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-2">
          Compare with Pros
        </h1>
        <p className="text-gray-400 text-lg">See how you stack up against professional athletes</p>
      </motion.div>

      {/* Sport Selection */}
      <motion.div variants={itemVariants} className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
        <h3 className="text-xl font-bold text-white mb-6">Select Sport</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sports.map((sport) => (
            <motion.button
              key={sport.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedSport(sport.id);
                setSelectedAthlete(null);
              }}
              className={`p-4 rounded-xl transition-all duration-300 ${
                selectedSport === sport.id
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                  : 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50 hover:text-white'
              }`}
            >
              <div className="text-3xl mb-2">{sport.icon}</div>
              <p className="font-semibold">{sport.name}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Athlete Selection */}
      <motion.div variants={itemVariants} className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Choose a Professional Athlete</h3>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search athletes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>
        </div>

        {professionalAthletes[selectedSport] && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {professionalAthletes[selectedSport].map((athlete) => (
              <motion.div
                key={athlete.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedAthlete(athlete)}
                className={`p-6 rounded-xl cursor-pointer transition-all duration-300 ${
                  selectedAthlete?.id === athlete.id
                    ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/50'
                    : 'bg-gray-700/30 hover:bg-gray-700/50'
                } border border-gray-600/50`}
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="text-3xl">{athlete.avatar}</div>
                  <div>
                    <h4 className="font-semibold text-white">{athlete.name}</h4>
                    <p className="text-sm text-gray-400">{athlete.specialty}</p>
                    <p className="text-xs text-gray-500">{athlete.country}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {athlete.achievements.slice(0, 2).map((achievement, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <TrophyIcon className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      <span className="text-xs text-gray-400 truncate">{achievement}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!professionalAthletes[selectedSport] && (
          <div className="text-center py-8">
            <UserIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">Professional athletes data coming soon for {sports.find(s => s.id === selectedSport)?.name}</p>
          </div>
        )}
      </motion.div>

      {/* Comparison Results */}
      <AnimatePresence>
        {selectedAthlete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Head-to-Head Cards */}
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-center mb-8">
                <div className="flex items-center space-x-8">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-3">
                      <UserIcon className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="font-bold text-white">You</h3>
                    <p className="text-sm text-gray-400">Amateur</p>
                  </div>
                  
                  <div className="text-4xl text-orange-400">⚡</div>
                  
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-3 text-2xl">
                      {selectedAthlete.avatar}
                    </div>
                    <h3 className="font-bold text-white">{selectedAthlete.name}</h3>
                    <p className="text-sm text-gray-400">Professional</p>
                  </div>
                </div>
              </div>

              {/* Stats Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(selectedAthlete.stats).map(([key, value], index) => {
                  const userValue = userStats[selectedSport]?.[key];
                  const isYouBetter = userValue && userValue > value;
                  
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-700/30 rounded-xl p-4"
                    >
                      <h4 className="text-sm font-medium text-gray-400 mb-3 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-semibold">Pro:</span>
                          <span className="text-orange-400 font-bold">{value}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-white font-semibold">You:</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-blue-400 font-bold">
                              {userValue || 'N/A'}
                            </span>
                            {userValue && (
                              isYouBetter ? (
                                <ArrowUpIcon className="w-4 h-4 text-green-400" />
                              ) : (
                                <ArrowDownIcon className="w-4 h-4 text-red-400" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Radar Chart Comparison */}
            {getComparisonData().length > 0 && (
              <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
                <h3 className="text-xl font-bold text-white mb-6">Performance Radar</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={getComparisonData()}>
                      <PolarGrid stroke="#374151" />
                      <PolarAngleAxis dataKey="attribute" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                      <PolarRadiusAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                      <Radar 
                        name="Professional" 
                        dataKey="professional" 
                        stroke="#F59E0B" 
                        fill="#F59E0B" 
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                      <Radar 
                        name="You" 
                        dataKey="you" 
                        stroke="#3B82F6" 
                        fill="#3B82F6" 
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Motivation Section */}
            <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-8">
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-block mb-4"
                >
                  <FireIcon className="w-12 h-12 text-orange-400" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-4">Keep Pushing Your Limits!</h3>
                <p className="text-gray-300 max-w-2xl mx-auto">
                  Every professional was once an amateur. Every pro was once a beginner. 
                  Use this comparison as motivation to reach new heights in your athletic journey.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-6 bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-orange-700 hover:to-red-700 transition-all duration-300"
                >
                  Set New Goals
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ComparePage;