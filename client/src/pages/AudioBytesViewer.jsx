import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API_URL } from '../AuthContext';
import { Play, Pause, ChevronLeft, Bookmark, ExternalLink, Music, ListVideo } from 'lucide-react';

const TB_LOGO = 'https://testbook-trickbook.duckdns.org/_next/image?url=%2Flogos%2Ftestbook-icon.png&w=48&q=75';

// Helper component for a single Audio Byte slide
function AudioByteSlide({ byte, isActive, autoPlayEnabled, onEnded }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      if (autoPlayEnabled && audioRef.current) {
        audioRef.current.play().catch(err => console.log('Autoplay prevented:', err));
        setIsPlaying(true);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
        setProgress(0);
      }
    }
  }, [isActive, autoPlayEnabled]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const { currentTime, duration } = audioRef.current;
    setProgress((currentTime / duration) * 100 || 0);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(100);
    if (onEnded) onEnded();
  };

  // Calculate SVG dash array for progress ring
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-full h-full snap-start flex flex-col justify-center items-center shrink-0">
      
      {/* Background Graphic */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-black overflow-hidden z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/10 blur-[100px] rounded-full" />
      </div>

      <style>
        {`
          @keyframes wave {
            0% { height: 10%; }
            50% { height: 100%; }
            100% { height: 10%; }
          }
          .animate-wave {
            animation: wave 1s ease-in-out infinite alternate;
          }
        `}
      </style>

      <audio 
        ref={audioRef}
        src={byte.audioUrl.startsWith('/uploads') ? `${API_URL.replace('/api', '')}${byte.audioUrl}` : byte.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        preload="metadata"
      />

      <div className="relative z-10 w-full max-w-sm px-6 pb-20 pt-16 h-full flex flex-col justify-between">
        
        {/* Top Header */}
        <div className="flex justify-between items-start">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-white text-xs font-bold uppercase tracking-wider">{byte.subject}</span>
          </div>
          
          <button 
            onClick={() => setIsBookmarked(!isBookmarked)}
            className="p-3 rounded-full bg-white/5 backdrop-blur-md hover:bg-white/10 transition-colors"
          >
            <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-orange-400 text-orange-400' : 'text-white'}`} />
          </button>
        </div>

        {/* Center UI: Title & Play Button */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-8 cursor-pointer group" onClick={togglePlay}>
            {/* Progress Ring */}
            <svg className="w-24 h-24 transform -rotate-90">
              <circle cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/10" />
              <circle 
                cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" 
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="text-orange-500 transition-all duration-100 ease-linear"
              />
            </svg>
            
            {/* Play/Pause Icon */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center text-orange-600 shadow-xl group-hover:scale-105 transition-transform">
              {isPlaying ? <Pause className="w-6 h-6 ml-0.5" /> : <Play className="w-6 h-6 ml-1" />}
            </div>
          </div>

          <h1 className="text-3xl font-black text-white text-center leading-tight mb-4">{byte.topic}</h1>

          {/* Visualizer */}
          <div className="flex items-end justify-center gap-1.5 h-12 w-full mt-2">
            {[...Array(16)].map((_, i) => (
              <div
                key={i}
                className={`w-1.5 bg-gradient-to-t from-orange-600 to-orange-400 rounded-full ${isPlaying ? 'animate-wave' : 'h-1 transition-all duration-300'}`}
                style={{
                  animationDelay: `${Math.random() * -1}s`,
                  height: isPlaying ? '100%' : '4px'
                }}
              />
            ))}
          </div>
        </div>

        {/* Bottom UI: Key Points & Action */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 mb-8">
          <h3 className="text-orange-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
            <ListVideo className="w-4 h-4" /> Key Points
          </h3>
          <ul className="space-y-3">
            {byte.keyPoints?.map((kp, idx) => (
              <li key={idx} className="text-white/90 text-sm flex gap-2">
                <span className="text-orange-500 mt-1">•</span> {kp}
              </li>
            ))}
          </ul>

          {byte.webLink && (
            <div className="mt-5 pt-5 border-t border-white/10">
              <a href={byte.webLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-white text-gray-900 rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors">
                <ExternalLink className="w-4 h-4" /> Read Full Topic
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AudioBytesViewer() {
  const { authenticatedFetch } = useAuth();
  const navigate = useNavigate();
  const [bytes, setBytes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  
  const containerRef = useRef(null);

  useEffect(() => {
    const loadBytes = async () => {
      try {
        const res = await authenticatedFetch(`${API_URL}/audio-bytes`);
        if (res.ok) setBytes(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadBytes();
  }, []);

  // Set up IntersectionObserver to detect which slide is currently active
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.getAttribute('data-index'));
          setActiveIndex(index);
        }
      });
    }, {
      root: containerRef.current,
      threshold: 0.6 // Element must be 60% visible to become active
    });

    const slides = containerRef.current.querySelectorAll('.snap-start');
    slides.forEach(slide => observer.observe(slide));

    return () => observer.disconnect();
  }, [bytes]);

  const scrollToNext = () => {
    if (!containerRef.current) return;
    const slides = containerRef.current.querySelectorAll('.snap-start');
    if (activeIndex + 1 < slides.length) {
      slides[activeIndex + 1].scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return <div className="h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;
  }

  if (bytes.length === 0) {
    return (
      <div className="h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
        <Music className="w-16 h-16 text-gray-700 mb-4" />
        <h2 className="text-xl font-bold mb-2">No Audio Bytes Yet</h2>
        <p className="text-gray-400 mb-6">Check back later for new study bites.</p>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-orange-500 rounded-xl font-bold">Go Back</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex justify-center">
      
      {/* Absolute Back Button */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-50 p-2 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10 hover:bg-white/20 transition-colors"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Autoplay Toggle */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full px-4 py-2 border border-white/10">
        <span className="text-xs font-bold text-white uppercase tracking-wider">Autoplay Next</span>
        <div 
          className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${autoPlayEnabled ? 'bg-orange-500' : 'bg-gray-600'}`}
          onClick={() => setAutoPlayEnabled(!autoPlayEnabled)}
        >
          <div className={`w-3 h-3 bg-white rounded-full transition-transform ${autoPlayEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
        </div>
      </div>

      {/* Snap Scrolling Container */}
      <div 
        ref={containerRef}
        className="w-full h-full max-w-md overflow-y-auto overflow-x-hidden"
        style={{ scrollSnapType: 'y mandatory', scrollBehavior: 'smooth' }}
      >
        {bytes.map((byte, idx) => (
          <div key={byte._id} data-index={idx} className="h-full w-full">
            <AudioByteSlide 
              byte={byte} 
              isActive={activeIndex === idx} 
              autoPlayEnabled={autoPlayEnabled}
              onEnded={scrollToNext}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
