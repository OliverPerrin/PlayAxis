import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SparklesIcon, ArrowRightIcon, CheckIcon } from '@heroicons/react/24/outline';

const FEATURES = [
  { title: 'Discover Events', desc: 'Find sports events and activities near you.' },
  { title: 'Track Performance', desc: 'Visualize your progress and personal records.' },
  { title: 'Compare & Compete', desc: 'See how you stack up with friends and pros.' },
  { title: 'Join Community', desc: 'Clubs, challenges, and training buddies.' },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % FEATURES.length), 2500);
    return () => clearInterval(t);
  }, []); // FEATURES.length is constant; safe to leave empty

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Nav */}
      <nav className="p-6 relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">PlayAxis</span>
          </div>
          <button onClick={() => navigate('/auth')} className="px-5 py-2.5 bg-white/10 rounded-xl text-white hover:bg-white/20">
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative z-10 pt-10 pb-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-6xl md:text-7xl font-black text-white">
            Elevate Your Athletic Journey
          </motion.h1>
          <p className="mt-6 text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
            Discover events, track performance, and join a vibrant community of athletes and fans.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('/auth')} className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold hover:shadow-lg">
              Get Started
            </button>
            <button className="px-8 py-4 bg-white/10 text-white rounded-2xl hover:bg-white/20">
              Watch Demo
            </button>
          </div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
            {[
              { number: '50K+', label: 'Active Users' },
              { number: '1M+', label: 'Events Tracked' },
              { number: '200+', label: 'Sports Covered' },
              { number: '95%', label: 'Satisfaction' },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="text-3xl font-bold text-white">{s.number}</div>
                <div className="text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="relative z-10 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-10">Built for Every Athlete</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className={`rounded-2xl p-6 bg-white/5 border border-white/10 ${idx === i ? 'ring-2 ring-purple-500/40' : ''}`}>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                  <CheckIcon className="w-6 h-6 text-white" />
                </div>
                <div className="text-white font-semibold text-lg">{f.title}</div>
                <div className="text-gray-300 mt-1">{f.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-white/10 rounded-3xl p-10 text-center">
            <h3 className="text-4xl font-bold text-white mb-3">Ready to Level Up?</h3>
            <p className="text-gray-300 mb-6">Join thousands of athletes improving every day on PlayAxis.</p>
            <button onClick={() => navigate('/auth')} className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold inline-flex items-center gap-2">
              Start Free <ArrowRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      <footer className="pb-10 text-center text-gray-400">© 2024 PlayAxis. All rights reserved.</footer>
    </div>
  );
};

export default LandingPage;