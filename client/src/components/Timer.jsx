import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer as TimerIcon, Trophy, Sparkles, X } from 'lucide-react';

export default function Timer({ bookId, currentPage, totalPages, onSaveProgress }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(true); // Auto-starts when student opens a book
  
  // Stopwatch
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);

  // Goal Timer
  const [goalMinutes, setGoalMinutes] = useState(0);
  const [goalSecondsLeft, setGoalSecondsLeft] = useState(0);
  const [goalActive, setGoalActive] = useState(false);
  const [showMotivational, setShowMotivational] = useState(false);

  // Auto-save interval tracking
  const secondsSinceLastSave = useRef(0);

  // Tick the stopwatch and countdown
  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        // Increment stopwatch
        setStopwatchSeconds((prev) => prev + 1);
        secondsSinceLastSave.current += 1;

        // Auto-save progress every 10 seconds
        if (secondsSinceLastSave.current >= 10) {
          onSaveProgress(10);
          secondsSinceLastSave.current = 0;
        }

        // Decrement goal if active
        if (goalActive && goalSecondsLeft > 0) {
          setGoalSecondsLeft((prev) => {
            if (prev <= 1) {
              setGoalActive(false);
              setShowMotivational(true);
              // Save remaining time
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, goalActive, goalSecondsLeft, bookId, currentPage, totalPages]);

  // Save progress on unmount (e.g. leaving page)
  useEffect(() => {
    return () => {
      if (secondsSinceLastSave.current > 0) {
        onSaveProgress(secondsSinceLastSave.current);
        secondsSinceLastSave.current = 0;
      }
    };
  }, [bookId, currentPage, totalPages]);

  const startGoal = (mins) => {
    setGoalMinutes(mins);
    setGoalSecondsLeft(mins * 60);
    setGoalActive(true);
    setShowMotivational(false);
    setIsOpen(true);
  };

  const cancelGoal = () => {
    setGoalActive(false);
    setGoalSecondsLeft(0);
    setGoalMinutes(0);
  };

  const formatTime = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    
    const pad = (num) => String(num).padStart(2, '0');
    
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  const getMotivationalQuote = () => {
    const quotes = [
      "Believe you can and you're halfway there. Excellent focus today!",
      "Success is the sum of small efforts, repeated day in and day out. Outstanding job!",
      "The only limit to our realization of tomorrow will be our doubts of today. Keep going!",
      "It always seems impossible until it's done. You crushed your goal!",
      "Your focus today shapes your future tomorrow. Be proud of your dedication!"
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  return (
    <>
      {/* Floating Circle Button */}
      <div className="fixed bottom-6 left-6 z-[80]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer ${
            goalActive
              ? 'animate-pulse text-white'
              : 'bg-white border border-gray-200 text-orange-500 hover:border-orange-300 hover:shadow-orange-100'
          }`}
          style={goalActive ? { background: 'linear-gradient(135deg, #f97316, #ef4444)' } : {}}
          title="Study Timer"
        >
          <TimerIcon className="w-6 h-6" />
        </button>

        {!isOpen && (
          <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-white border border-gray-200 px-3 py-1 rounded-xl text-xs text-gray-600 font-mono pointer-events-none whitespace-nowrap shadow-md">
            {formatTime(stopwatchSeconds)}
            {goalActive && ` / ${formatTime(goalSecondsLeft)}`}
          </div>
        )}

        {isOpen && (
          <div className="absolute bottom-18 left-0 w-80 bg-white border border-gray-100 rounded-3xl p-5 shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)' }}>
                  <TimerIcon className="w-3.5 h-3.5" />
                </div>
                <span className="font-black text-sm text-gray-800">Study Timer</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 mb-5">
              <div className="text-center bg-orange-50 rounded-2xl py-4">
                <p className="text-[10px] text-orange-400 font-black uppercase tracking-wider">Reading Duration</p>
                <h2 className="text-3xl font-black font-mono text-orange-600 mt-1 tracking-tight">
                  {formatTime(stopwatchSeconds)}
                </h2>
              </div>
              <div className="flex justify-center gap-3 pt-1">
                <button
                  onClick={() => setIsActive(!isActive)}
                  className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-500 hover:text-white'
                  }`}
                >
                  {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isActive ? 'Pause' : 'Resume'}</span>
                </button>
                <button
                  onClick={() => { setStopwatchSeconds(0); secondsSinceLastSave.current = 0; }}
                  className="px-4 py-2 bg-gray-100 border border-gray-200 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 font-bold">Study Goal</p>
                {goalActive && (
                  <button onClick={cancelGoal} className="text-[10px] text-red-400 hover:underline cursor-pointer font-semibold">Cancel</button>
                )}
              </div>

              {goalActive ? (
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-3 text-center">
                  <p className="text-[10px] text-orange-400 uppercase font-black">Time Remaining</p>
                  <h3 className="text-2xl font-black font-mono text-orange-600 mt-1">{formatTime(goalSecondsLeft)}</h3>
                  <div className="w-full h-2 bg-orange-100 rounded-full overflow-hidden mt-3">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${(goalSecondsLeft / (goalMinutes * 60)) * 100}%`, background: 'linear-gradient(90deg, #f97316, #ef4444)' }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] text-gray-400">Set a focus goal — get an alert when done:</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 15, 30, 45].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => startGoal(mins)}
                        className="py-2 bg-orange-50 border border-orange-200 hover:bg-orange-500 hover:text-white hover:border-orange-500 rounded-xl text-xs font-bold text-orange-600 cursor-pointer transition-all"
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Motivational Modal */}
      {showMotivational && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-orange-100 max-w-md w-full p-8 text-center relative overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-3xl" style={{ background: 'linear-gradient(90deg, #f97316, #ef4444)' }} />

            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white mx-auto mb-5 shadow-lg" style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)' }}>
              <Trophy className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black text-gray-800 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-400" />
              Goal Reached!
              <Sparkles className="w-5 h-5 text-orange-400" />
            </h2>
            <p className="text-gray-400 text-sm mt-1 font-semibold">{goalMinutes}-Minute Study Target Completed</p>

            <blockquote className="my-6 p-4 bg-orange-50 border-l-4 border-orange-400 text-gray-600 text-sm font-serif-book italic rounded-r-2xl text-left">
              "{getMotivationalQuote()}"
            </blockquote>

            <button
              onClick={() => setShowMotivational(false)}
              className="w-full text-white font-bold py-3 rounded-2xl shadow-lg active:translate-y-[1px] transition-all cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)' }}
            >
              Continue Studying
            </button>
          </div>
        </div>
      )}
    </>
  );
}
