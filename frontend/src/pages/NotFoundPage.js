import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="text-7xl font-black text-white">404</div>
        <div className="text-gray-300 mt-2">The page you’re looking for doesn’t exist.</div>
        <button onClick={() => navigate('/')} className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20">
          <ArrowLeftIcon className="w-5 h-5" /> Go Home
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;