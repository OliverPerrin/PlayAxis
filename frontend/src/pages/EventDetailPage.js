import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { CalendarIcon, MapPinIcon, UserGroupIcon, ArrowLeftIcon, StarIcon } from '@heroicons/react/24/outline';
import { getEventById } from '../api';

const normalizeEvent = (e, fallback) => {
  if (!e && fallback) return fallback;
  if (!e) return null;

  const title = e.title || e?.name?.text || fallback?.title || 'Untitled Event';
  const description = e.description || e?.description?.text || fallback?.description || '';
  const startLocal = e?.start?.local || e?.start || e?.date || fallback?.start?.local || fallback?.date || null;
  const venueName = e?.venue?.name || e?.location || e?.venue || fallback?.venue?.name || fallback?.location || 'Location TBA';
  const isFree = typeof e?.is_free === 'boolean' ? e.is_free : (e?.price === 'Free' || fallback?.price === 'Free');
  const price = isFree ? 'Free' : (e?.price || e?.ticket_price || fallback?.price || 'See site');
  const participants = e?.participants || e?.attending_count || e?.yes_rsvp_count || fallback?.participants || 0;
  const maxParticipants = e?.capacity || e?.maxParticipants || fallback?.maxParticipants || null;
  const rating = e?.rating || fallback?.rating || 4.6;
  const difficulty = e?.difficulty || fallback?.difficulty || 'All Levels';

  return {
    id: e?.id || e?.event_id || fallback?.id,
    title,
    description,
    date: startLocal ? new Date(startLocal).toISOString() : null,
    location: venueName,
    participants,
    maxParticipants,
    price,
    rating,
    difficulty,
    organizer: e?.organizer || e?.organization_id || fallback?.organizer || 'Organizer',
    image: e?.image || fallback?.image || '🎯',
  };
};

const EventDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { state } = useLocation();
  const [event, setEvent] = useState(state?.event || null);
  const [loading, setLoading] = useState(!state?.event);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    if (!event) {
      (async () => {
        setLoading(true);
        setError('');
        try {
          const data = await getEventById(id);
          if (!mounted) return;
          const normalized = normalizeEvent(data, state?.event);
          setEvent(normalized);
        } catch (e) {
          setError('Unable to load event details.');
        } finally {
          if (mounted) setLoading(false);
        }
      })();
    } else {
      setEvent(prev => normalizeEvent(prev, prev));
      setLoading(false);
    }
    return () => { mounted = false; };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="p-6 text-white">Loading event...</div>;

  if (error || !event) {
    return (
      <div className="p-6">
        <button onClick={() => navigate(-1)} className="text-emerald-300 hover:text-emerald-200 inline-flex items-center gap-2 mb-4">
          <ArrowLeftIcon className="w-5 h-5" /> Back
        </button>
        <div className="text-red-300">Event not found.</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <button onClick={() => navigate(-1)} className="text-emerald-300 hover:text-emerald-200 inline-flex items-center gap-2 mb-6">
        <ArrowLeftIcon className="w-5 h-5" /> Back
      </button>

      <div className="max-w-5xl mx-auto grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/10 border border-white/20 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-6xl">{event.image}</div>
            <div>
              <h1 className="text-3xl font-bold text-white">{event.title}</h1>
              <div className="text-gray-300">{event.organizer}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-300 mb-4">
            <div className="flex items-center gap-1">
              <CalendarIcon className="w-4 h-4" />
              <span>{event.date ? new Date(event.date).toLocaleString() : 'Date TBA'}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPinIcon className="w-4 h-4" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <UserGroupIcon className="w-4 h-4" />
              <span>{event.participants}{event.maxParticipants ? `/${event.maxParticipants}` : ''}</span>
            </div>
          </div>

          <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
            {event.description || 'Event description coming soon.'}
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <div className="text-white font-semibold mb-3">Quick Info</div>
            <div className="space-y-2 text-gray-300 text-sm">
              <div className="flex items-center justify-between">
                <span>Difficulty</span>
                <span className="text-white font-medium">{event.difficulty}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Rating</span>
                <div className="flex items-center gap-1 text-cyan-300">
                  <StarIcon className="w-4 h-4" />
                  <span className="text-white">{event.rating}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Price</span>
                <span className="text-white font-medium">{event.price}</span>
              </div>
            </div>

            <button className="w-full mt-4 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg">
              {event.maxParticipants && event.participants >= event.maxParticipants ? 'Join Waitlist' : 'Get Ticket'}
            </button>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <div className="text-white font-semibold mb-3">Organizer</div>
            <div className="text-gray-300">{event.organizer}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;