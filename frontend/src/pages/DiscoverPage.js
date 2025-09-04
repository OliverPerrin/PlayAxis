import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, MapPinIcon, CalendarIcon, ViewColumnsIcon, ListBulletIcon,
  HeartIcon, ShareIcon, UserGroupIcon, TicketIcon, StarIcon, FireIcon, AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getEvents } from '../api';

const CATEGORY_QUERY = {
  all: 'sports',
  running: 'running',
  cycling: 'cycling',
  swimming: 'swimming',
  tennis: 'tennis',
  basketball: 'basketball',
  soccer: 'soccer',
  fitness: 'fitness',
  esports: 'esports',
  outdoor: 'outdoor'
};

const DiscoverPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('date');
  const [favorites, setFavorites] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');

  // Initialize state from URL
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const cat = searchParams.get('cat') || 'all';
    const loc = searchParams.get('loc') || 'all';
    const sort = searchParams.get('sort') || 'date';
    const view = searchParams.get('view') || 'grid';

    setSearchTerm(q);
    setSelectedCategory(cat);
    setSelectedLocation(loc);
    setSortBy(sort === 'popular' ? 'popularity' : sort);
    setViewMode(view === 'list' ? 'list' : 'grid');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // on mount only

  // Sync URL whenever controls change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (selectedCategory !== 'all') params.set('cat', selectedCategory);
    if (selectedLocation !== 'all') params.set('loc', selectedLocation);
    if (sortBy !== 'date') params.set('sort', sortBy === 'popularity' ? 'popular' : sortBy);
    if (viewMode !== 'grid') params.set('view', viewMode);

    const newStr = params.toString();
    const prevStr = searchParams.toString();
    if (newStr !== prevStr) {
      setSearchParams(params, { replace: true });
    }
  }, [searchTerm, selectedCategory, selectedLocation, sortBy, viewMode, searchParams, setSearchParams]);

  const categories = [
    { id: 'all', name: 'All Events', icon: '🎯' },
    { id: 'running', name: 'Running', icon: '🏃‍♂️' },
    { id: 'cycling', name: 'Cycling', icon: '🚴‍♂️' },
    { id: 'swimming', name: 'Swimming', icon: '🏊‍♂️' },
    { id: 'tennis', name: 'Tennis', icon: '🎾' },
    { id: 'basketball', name: 'Basketball', icon: '🏀' },
    { id: 'soccer', name: 'Soccer', icon: '⚽' },
    { id: 'fitness', name: 'Fitness', icon: '💪' },
    { id: 'outdoor', name: 'Outdoor', icon: '🏞️' },
    { id: 'esports', name: 'Esports', icon: '🎮' },
  ];

  const locations = [
    { id: 'all', name: 'All Locations' },
    { id: 'nearby', name: 'Nearby (use my location)' },
    { id: 'city', name: 'City Center' },
    { id: 'virtual', name: 'Virtual' }
  ];

  // Geolocation when nearby
  useEffect(() => {
    let cancelled = false;
    if (selectedLocation === 'nearby' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          if (!cancelled) setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        () => {
          if (!cancelled) setCoords(null);
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    } else {
      setCoords(null);
    }
    return () => { cancelled = true; };
  }, [selectedLocation]);

  // Fetch events
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const qBase = CATEGORY_QUERY[selectedCategory] || 'sports';
        const q = searchTerm ? `${qBase} ${searchTerm}` : qBase;
        const data = await getEvents(q, coords?.lat || null, coords?.lon || null);
        if (!mounted) return;

        const raw = Array.isArray(data?.events) ? data.events : [];
        const normalized = raw.map((e, idx) => {
          const title = e?.title || e?.name?.text || 'Untitled Event';
          const description = e?.description || e?.description?.text || '';
          const startLocal = e?.start?.local || e?.start || e?.date || null;
          const venueName = e?.venue?.name || e?.location || e?.venue || 'Location TBA';
          const isFree = typeof e?.is_free === 'boolean' ? e.is_free : (e?.price === 'Free');
          const price = isFree ? 'Free' : (e?.price || e?.ticket_price || 'See site');
          const participants = e?.participants || e?.attending_count || e?.yes_rsvp_count || 0;
          const maxParticipants = e?.capacity || e?.maxParticipants || null;
          const rating = e?.rating || 4 + ((idx % 10) / 10);

          return {
            id: e?.id || e?.event_id || `${idx}-${title}`,
            title,
            description,
            date: startLocal ? new Date(startLocal).toISOString().slice(0, 10) : null,
            time: startLocal ? new Date(startLocal).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
            location: venueName,
            participants,
            maxParticipants,
            price,
            difficulty: e?.difficulty || 'All Levels',
            rating: Math.round((rating + Number.EPSILON) * 10) / 10,
            image: '🎯',
            tags: (e?.tags || []).slice(0, 3),
            organizer: e?.organizer || e?.organization_id || 'Organizer',
            featured: idx < 3
          };
        });

        setEvents(normalized);
      } catch (err) {
        console.error('Discover getEvents error:', err);
        setError(err.message || 'Failed to load events');
        setEvents([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [selectedCategory, searchTerm, coords]);

  const toggleFavorite = (id) => {
    const set = new Set(favorites);
    set.has(id) ? set.delete(id) : set.add(id);
    setFavorites(set);
  };

  const diffColor = (d) => {
    switch ((d || '').toLowerCase()) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  const filtered = useMemo(() => {
    let list = events;
    if (selectedLocation === 'virtual') {
      list = list.filter(e => /virtual|online/i.test(e.location || ''));
    }
    if (sortBy === 'date') {
      list = [...list].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    } else if (sortBy === 'popularity' || sortBy === 'popular') {
      list = [...list].sort((a, b) => (b.participants || 0) - (a.participants || 0));
    } else if (sortBy === 'price') {
      list = [...list].sort((a, b) => {
        const va = a.price === 'Free' ? 0 : 9999;
        const vb = b.price === 'Free' ? 0 : 9999;
        return va - vb;
      });
    }
    return list;
  }, [events, selectedLocation, sortBy]);

  const EventCard = ({ event, index }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className={`bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-300 group cursor-pointer ${event.featured ? 'ring-2 ring-purple-500/40' : ''}`}
      onClick={() => navigate(`/events/${encodeURIComponent(event.id)}`, { state: { event } })}
    >
      <div className="relative p-6 pb-4">
        {event.featured && (
          <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1">
            <FireIcon className="w-3 h-3" />
            <span>Featured</span>
          </div>
        )}

        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); toggleFavorite(event.id); }}
            className="p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors"
          >
            {favorites.has(event.id) ? <HeartSolid className="w-5 h-5 text-red-500" /> : <HeartIcon className="w-5 h-5 text-white" />}
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors"
          >
            <ShareIcon className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex items-center gap-4 mb-3">
          <div className="text-5xl">{event.image}</div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">{event.title}</h3>
            <p className="text-gray-300 text-sm">{event.organizer}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center text-yellow-400">
                <StarIcon className="w-4 h-4 fill-current" />
                <span className="text-white text-sm ml-1">{event.rating}</span>
              </div>
              <div className={`w-2 h-2 rounded-full ${diffColor(event.difficulty)}`} />
              <span className="text-gray-300 text-sm">{event.difficulty}</span>
            </div>
          </div>
        </div>

        <p className="text-gray-300 text-sm mb-4 line-clamp-2">{event.description}</p>
      </div>

      <div className="px-6 pb-4 space-y-3">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-gray-300">
            <CalendarIcon className="w-4 h-4" />
            <span>{event.date ? new Date(event.date).toLocaleDateString() : 'TBA'}{event.time ? ` • ${event.time}` : ''}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-gray-300">
            <MapPinIcon className="w-4 h-4" />
            <span>{event.location}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-gray-300 text-sm">
            <UserGroupIcon className="w-4 h-4" />
            <span>
              {event.participants}
              {event.maxParticipants ? `/${event.maxParticipants}` : ''}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-white font-bold">{event.price}</span>
            {event.price !== 'Free' && <TicketIcon className="w-4 h-4 text-gray-300" />}
          </div>
        </div>

        {event.maxParticipants ? (
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
              style={{ width: `${Math.min(100, (event.participants / event.maxParticipants) * 100)}%` }}
            />
          </div>
        ) : null}
      </div>

      <div className="px-6 pb-6">
        <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300">
          {event.maxParticipants && event.participants >= event.maxParticipants ? 'Waitlist' : 'Join Event'}
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Discover Events</h1>
          <p className="text-gray-300 text-lg">Find and join amazing sports events near you</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events, sports, or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white"
              >
                <AdjustmentsHorizontalIcon className="w-5 h-5" />
                <span>Filters</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                >
                  <ViewColumnsIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                >
                  <ListBulletIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 pt-6 border-t border-white/20 grid md:grid-cols-3 gap-6"
              >
                <div>
                  <label className="block text-white font-medium mb-3">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-gray-900">{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white font-medium mb-3">Location</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white"
                  >
                    {locations.map((l) => (
                      <option key={l.id} value={l.id} className="bg-gray-900">{l.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white font-medium mb-3">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white"
                  >
                    <option value="date" className="bg-gray-900">Date</option>
                    <option value="popularity" className="bg-gray-900">Popularity</option>
                    <option value="price" className="bg-gray-900">Price</option>
                    <option value="distance" className="bg-gray-900" disabled>Distance (coming soon)</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <div className="mb-4 text-yellow-300">{error}</div>
        )}

        {loading ? (
          <div className="text-gray-300">Loading events...</div>
        ) : (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            <AnimatePresence mode="wait">
              {filtered.map((e, i) => <EventCard key={e.id} event={e} index={i} />)}
            </AnimatePresence>
          </div>
        )}

        <div className="text-center mt-10">
          <button className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl">Load More Events</button>
        </div>
      </div>
    </div>
  );
};

export default DiscoverPage;