import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Header from './components/Header';
import Calendar from './components/Calendar';
import UserProfile from './components/UserProfile';
import EventList from './components/EventList';
import Weather from './components/Weather';
import Login from './components/Login';
import Signup from './components/Signup';
import Profile from './components/Profile';

function App() {
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [showLogin, setShowLogin] = useState(true);

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Calendar selectedInterests={selectedInterests} />
                  </div>
                  <div>
                    {showLogin ? (
                      <Login />
                    ) : (
                      <Signup />
                    )}
                    <button onClick={() => setShowLogin(!showLogin)} className="text-blue-500 hover:underline mt-4">
                      {showLogin ? 'Need to create an account?' : 'Already have an account?'}
                    </button>
                    <UserProfile selectedInterests={selectedInterests} setSelectedInterests={setSelectedInterests} />
                    <Weather />
                    <EventList selectedInterests={selectedInterests} />
                  </div>
                </div>
              } />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;