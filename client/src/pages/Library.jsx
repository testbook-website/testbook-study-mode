import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, API_URL } from '../AuthContext';
import { BookOpen, Search, LogOut, LayoutDashboard, Compass, BookOpenCheck, Sparkles, Star, TrendingUp, Music } from 'lucide-react';

const TB_LOGO = 'https://testbook-trickbook.duckdns.org/_next/image?url=%2Flogos%2Ftestbook-icon.png&w=48&q=75';

export default function Library() {
  const { user, token, logout, authenticatedFetch } = useAuth();
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [progress, setProgress] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLibraryData = async () => {
      try {
        setLoading(true);
        const booksRes = await authenticatedFetch(`${API_URL}/books`);
        if (!booksRes.ok) throw new Error('Failed to fetch library books');
        const booksData = await booksRes.json();
        setBooks(booksData);

        const subs = ['All', ...new Set(booksData.map(b => b.subject))];
        setSubjects(subs);

        const progressRes = await authenticatedFetch(`${API_URL}/progress`);
        if (progressRes.ok) {
          const progressData = await progressRes.json();
          const progMap = {};
          progressData.forEach(p => { progMap[p.bookId] = p; });
          setProgress(progMap);
        }
      } catch (err) {
        setError(err.message || 'Error loading library');
      } finally {
        setLoading(false);
      }
    };
    fetchLibraryData();
  }, [token]);

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.description && book.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSubject = selectedSubject === 'All' || book.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const getProgressPercentage = (bookId) => {
    const sess = progress[bookId];
    if (!sess) return 0;
    return Math.min(100, Math.max(0, Math.round((sess.currentPage / sess.totalPages) * 100)));
  };

  const getReadingLabel = (bookId) => {
    const sess = progress[bookId];
    if (!sess) return 'Start Reading';
    if (sess.currentPage >= sess.totalPages) return '✓ Completed';
    return `Resume · Page ${sess.currentPage}`;
  };

  const subjectColors = [
    'bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-200',
    'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
    'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200',
    'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200',
    'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200',
    'bg-cyan-100 text-cyan-700 border-cyan-200 hover:bg-cyan-200',
    'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-200',
    'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200',
  ];

  const cardAccents = [
    'from-violet-50 to-blue-50 border-violet-200',
    'from-blue-50 to-cyan-50 border-blue-200',
    'from-emerald-50 to-teal-50 border-emerald-200',
    'from-rose-50 to-pink-50 border-rose-200',
    'from-amber-50 to-orange-50 border-amber-200',
    'from-cyan-50 to-sky-50 border-cyan-200',
    'from-fuchsia-50 to-purple-50 border-fuchsia-200',
    'from-orange-50 to-yellow-50 border-orange-200',
  ];

  const getSubjectColorIndex = (subject) => {
    let hash = 0;
    for (let i = 0; i < subject.length; i++) hash = subject.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash) % subjectColors.length;
  };

  return (
    <div className="min-h-screen pb-16" style={{ background: 'linear-gradient(135deg, #f8faff 0%, #f0f4ff 30%, #fdf4ff 60%, #fff7ed 100%)' }}>
      {/* Decorative blobs */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-violet-200/30 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="fixed top-0 right-0 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl pointer-events-none translate-x-1/2 -translate-y-1/2" />
      <div className="fixed bottom-0 left-1/2 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl pointer-events-none -translate-x-1/2 translate-y-1/2" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/60 bg-white/70 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={TB_LOGO} alt="Testbook" className="w-10 h-10 rounded-xl shadow-md" onError={e => { e.target.style.display='none'; }} />
            <div>
              <span className="font-black text-lg text-orange-600 tracking-tight">
                Testbook Study Mode
              </span>
              <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-orange-200">
                Library
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/audio-bytes"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-orange-200"
            >
              <Music className="w-4 h-4" />
              <span>Audio Prep Bytes</span>
            </Link>

            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-violet-300 hover:bg-violet-50 text-gray-700 text-sm font-medium rounded-xl transition-all shadow-sm"
              >
                <LayoutDashboard className="w-4 h-4 text-violet-500" />
                <span>Admin Portal</span>
              </Link>
            )}

            <div className="hidden sm:block text-right">
              <p className="text-sm text-gray-800 font-semibold">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>

            <button
              onClick={logout}
              className="p-2.5 bg-red-50 border border-red-100 hover:border-red-300 text-red-400 hover:text-red-600 rounded-xl hover:bg-red-100 transition-all cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-8 relative">
        {/* Welcome Banner */}
        <div className="mb-8 relative overflow-hidden rounded-3xl shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />
          <div className="relative p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-white/80" />
                <span className="text-white/80 text-sm font-medium">Your Digital Library</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white mb-1 drop-shadow">
                Welcome back, {user?.name}! 👋
              </h2>
              <p className="text-white/80 text-sm max-w-md">
                Dive into Study Mode — read, highlight, and get your doubts solved instantly with Testbook Guru.
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="bg-white/20 backdrop-blur rounded-2xl px-5 py-3 text-center border border-white/30">
                <p className="text-2xl font-extrabold text-white">{books.length}</p>
                <p className="text-white/70 text-xs font-medium">Books</p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-2xl px-5 py-3 text-center border border-white/30">
                <p className="text-2xl font-extrabold text-white">{Object.keys(progress).length}</p>
                <p className="text-white/70 text-xs font-medium">In Progress</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-start md:items-center">
          <div className="relative w-full md:max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, subject..."
              className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {subjects.map((sub, i) => {
              const isAll = sub === 'All';
              const isActive = selectedSubject === sub;
              const colorClass = isAll
                ? (isActive
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100')
                : (isActive
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent shadow-md shadow-amber-200'
                    : `${subjectColors[getSubjectColorIndex(sub)]} border`);
              return (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold cursor-pointer transition-all border ${colorClass}`}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        </div>

        {/* Book Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-4 border-amber-200 border-t-amber-500 animate-spin" />
              <BookOpen className="w-5 h-5 text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-gray-400 text-sm mt-5 font-medium">Loading your bookshelves...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-white border border-red-100 rounded-3xl p-8 shadow-sm">
            <p className="text-red-500 font-semibold mb-1">Error loading books</p>
            <p className="text-gray-400 text-sm">{error}</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-24 bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpenCheck className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-600 font-semibold mb-1">No books found</p>
            <p className="text-gray-400 text-sm">Try modifying your search or category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredBooks.map((book, idx) => {
              const prg = getProgressPercentage(book._id);
              const hasRead = progress[book._id];
              const accentIdx = getSubjectColorIndex(book.subject);
              const accent = cardAccents[accentIdx];
              const subjectChip = subjectColors[accentIdx];
              return (
                <div
                  key={book._id}
                  onClick={() => navigate(`/book/${book._id}`)}
                  className={`bg-white border rounded-3xl overflow-hidden flex flex-col group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02] shadow-sm`}
                  style={{ borderColor: '#e5e7eb' }}
                >
                  {/* Cover */}
                  <div className={`relative aspect-[4/3] bg-gradient-to-br ${accent} flex items-center justify-center border-b border-gray-100 overflow-hidden`}>
                    {book.thumbnailUrl ? (
                      <img
                        src={book.thumbnailUrl.startsWith('/uploads') ? `${API_URL.replace('/api', '')}${book.thumbnailUrl}` : book.thumbnailUrl}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4">
                        <div className="w-14 h-14 bg-white/70 rounded-2xl shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <BookOpen className="w-7 h-7 text-amber-500" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{book.subject}</span>
                      </div>
                    )}
                    {/* Subject badge */}
                    <span className={`absolute top-3 left-3 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${subjectChip}`}>
                      {book.subject}
                    </span>
                    {hasRead && prg === 100 && (
                      <span className="absolute top-3 right-3 bg-emerald-500 text-white rounded-full px-2 py-1 text-[10px] font-bold flex items-center gap-1">
                        <Star className="w-3 h-3" /> Done
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800 group-hover:text-amber-600 text-sm line-clamp-1 mb-1.5 transition-colors">
                        {book.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 mb-2">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-gray-700">{(4.0 + (book.title.charCodeAt(0) % 10) / 10).toFixed(1)}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300 mx-0.5" />
                        <span>{(book.title.charCodeAt(book.title.length - 1) % 20 + 2.4).toFixed(1)}K Readers</span>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2 h-8 leading-relaxed">
                        {book.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="mt-5 space-y-3">
                      {hasRead && (
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Progress</span>
                            <span className={prg === 100 ? 'text-emerald-500' : 'text-amber-500'}>{prg}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${prg === 100 ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : 'bg-gradient-to-r from-amber-400 to-orange-400'}`}
                              style={{ width: `${prg}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <button
                        className={`w-full py-2.5 px-4 rounded-2xl text-xs font-bold tracking-wide transition-all ${
                          hasRead && prg === 100
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-500 hover:text-white hover:border-emerald-500'
                            : hasRead
                            ? 'bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-500 hover:text-white hover:border-amber-500'
                            : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-200 hover:shadow-lg hover:shadow-amber-300 hover:from-amber-600 hover:to-orange-600'
                        }`}
                      >
                        {getReadingLabel(book._id)}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
