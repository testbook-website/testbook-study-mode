import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, API_URL } from '../AuthContext';
import {
  BookOpen, Plus, Trash2, Edit, Check, Eye, EyeOff,
  BookMarked, Users, Clock, UploadCloud, CheckCircle2, AlertCircle, LogOut, Music
} from 'lucide-react';

const TB_LOGO = 'https://testbook-trickbook.duckdns.org/_next/image?url=%2Flogos%2Ftestbook-icon.png&w=48&q=75';

const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all";

export default function Dashboard() {
  const { logout, authenticatedFetch, token } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ totalBooks: 0, activeStudents: 0, mostReadBooks: [], studentStats: [] });
  const [books, setBooks] = useState([]);
  const [audioBytes, setAudioBytes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [publishedBy, setPublishedBy] = useState('Admin');
  const [isPublished, setIsPublished] = useState(true);
  const [pdfFile, setPdfFile] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');

  const [editingBook, setEditingBook] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsPublished, setEditIsPublished] = useState(true);

  const [audioTopic, setAudioTopic] = useState('');
  const [audioSubject, setAudioSubject] = useState('');
  const [audioKeyPoints, setAudioKeyPoints] = useState('');
  const [audioWebLink, setAudioWebLink] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [audioUploadProgress, setAudioUploadProgress] = useState(false);
  const [audioUploadSuccess, setAudioUploadSuccess] = useState('');
  const [audioUploadError, setAudioUploadError] = useState('');

  const [activeTab, setActiveTab] = useState('books'); // 'books' or 'audio'

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const statsRes = await authenticatedFetch(`${API_URL}/admin/stats`);
      if (!statsRes.ok) throw new Error('Failed to load stats');
      setStats(await statsRes.json());
      const booksRes = await authenticatedFetch(`${API_URL}/admin/books`);
      if (!booksRes.ok) throw new Error('Failed to load books');
      setBooks(await booksRes.json());
      const audioRes = await authenticatedFetch(`${API_URL}/audio-bytes`);
      if (audioRes.ok) setAudioBytes(await audioRes.json());
    } catch (err) {
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboardData(); }, [token]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadError(''); setUploadSuccess('');
    if (!pdfFile) { setUploadError('PDF Book file is required.'); return; }
    setUploadProgress(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('subject', subject);
    formData.append('description', description);
    formData.append('publishedBy', publishedBy);
    formData.append('isPublished', isPublished);
    formData.append('pdf', pdfFile);
    if (thumbFile) formData.append('thumbnail', thumbFile);
    try {
      const res = await authenticatedFetch(`${API_URL}/admin/books`, { method: 'POST', body: formData });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed to upload'); }
      setUploadSuccess('Book uploaded successfully!');
      setTitle(''); setSubject(''); setDescription(''); setPdfFile(null); setThumbFile(null);
      document.getElementById('pdf-input').value = '';
      const ti = document.getElementById('thumb-input'); if (ti) ti.value = '';
      loadDashboardData();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploadProgress(false);
    }
  };

  const handleTogglePublish = async (book) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/admin/books/${book._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !book.isPublished })
      });
      if (res.ok) loadDashboardData();
    } catch (err) { console.error(err); }
  };

  const handleDeleteBook = async (id) => {
    if (!window.confirm('Delete this book? All student notes, highlights and bookmarks will be wiped.')) return;
    try {
      const res = await authenticatedFetch(`${API_URL}/admin/books/${id}`, { method: 'DELETE' });
      if (res.ok) loadDashboardData();
    } catch (err) { console.error(err); }
  };

  const handleDeleteAudioByte = async (id) => {
    if (!window.confirm('Delete this Audio Byte?')) return;
    try {
      const res = await authenticatedFetch(`${API_URL}/admin/audio-bytes/${id}`, { method: 'DELETE' });
      if (res.ok) loadDashboardData();
    } catch (err) { console.error(err); }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await authenticatedFetch(`${API_URL}/admin/books/${editingBook._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, subject: editSubject, description: editDescription, isPublished: editIsPublished })
      });
      if (res.ok) { setEditingBook(null); loadDashboardData(); }
    } catch (err) { console.error(err); }
  };

  const handleAudioUploadSubmit = async (e) => {
    e.preventDefault();
    setAudioUploadError(''); setAudioUploadSuccess('');
    if (!audioFile) { setAudioUploadError('Audio file is required.'); return; }
    setAudioUploadProgress(true);
    const formData = new FormData();
    formData.append('topic', audioTopic);
    formData.append('subject', audioSubject);
    formData.append('keyPoints', audioKeyPoints);
    formData.append('webLink', audioWebLink);
    formData.append('audio', audioFile);
    try {
      const res = await authenticatedFetch(`${API_URL}/admin/audio-bytes`, { method: 'POST', body: formData });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Failed to upload audio'); }
      setAudioUploadSuccess('Audio Byte uploaded successfully!');
      setAudioTopic(''); setAudioSubject(''); setAudioKeyPoints(''); setAudioWebLink(''); setAudioFile(null);
      const ai = document.getElementById('audio-input'); if (ai) ai.value = '';
      loadDashboardData();
    } catch (err) {
      setAudioUploadError(err.message);
    } finally {
      setAudioUploadProgress(false);
    }
  };

  const startEdit = (book) => {
    setEditingBook(book);
    setEditTitle(book.title);
    setEditSubject(book.subject);
    setEditDescription(book.description || '');
    setEditIsPublished(book.isPublished);
  };

  const formatStudyTime = (s) => {
    if (!s) return '0m';
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="min-h-screen pb-16" style={{ background: 'linear-gradient(135deg, #f8faff 0%, #fff7ed 100%)' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-orange-100 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={TB_LOGO} alt="Testbook" className="w-9 h-9 rounded-xl" onError={e => { e.target.style.display='none'; }} />
            <div>
              <span className="font-black text-lg text-orange-600 tracking-tight">Testbook Study Mode</span>
              <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold uppercase tracking-wider rounded-full">Admin Panel</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-orange-300 text-gray-700 text-sm font-semibold rounded-xl transition-all shadow-sm">
              <BookOpen className="w-4 h-4 text-orange-500" />
              Library View
            </Link>
            <button onClick={logout} className="p-2.5 bg-red-50 border border-red-100 hover:border-red-300 text-red-400 hover:text-red-600 rounded-xl transition-all cursor-pointer" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: BookMarked, label: 'Total Books', value: stats.totalBooks, color: 'orange' },
            { icon: Users, label: 'Active Students', value: stats.activeStudents, color: 'blue' },
            { icon: Clock, label: 'Total Sessions', value: stats.studentStats.length, color: 'emerald' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white rounded-3xl border border-gray-100 p-6 flex items-center gap-4 shadow-sm">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                color === 'orange' ? 'bg-orange-100 text-orange-500' :
                color === 'blue' ? 'bg-blue-100 text-blue-500' : 'bg-emerald-100 text-emerald-500'
              }`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{label}</p>
                <h3 className="text-3xl font-black text-gray-800 mt-0.5">{value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Most Read Books */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-black text-gray-800 mb-4">Most Read Books</h2>
          {stats.mostReadBooks.length === 0 ? (
            <p className="text-gray-400 text-sm">No reading statistics yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {stats.mostReadBooks.map((mrb, i) => (
                <div key={mrb.bookId} className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
                  <span className="text-[10px] bg-orange-500 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">#{i + 1} {mrb.subject}</span>
                  <h4 className="font-bold text-sm text-gray-800 line-clamp-1 mt-2">{mrb.title}</h4>
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    {formatStudyTime(mrb.totalStudyTimeSeconds)} read
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabs for Books vs Audio Bytes */}
        <div className="flex gap-4 border-b border-gray-200">
          <button 
            className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'books' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            onClick={() => setActiveTab('books')}
          >
            Manage Books
          </button>
          <button 
            className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'audio' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            onClick={() => setActiveTab('audio')}
          >
            Audio Prep Bytes
          </button>
        </div>

        {/* Split: Upload + Manage */}
        {activeTab === 'books' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Book Upload Form */}
            <div className="lg:col-span-1 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm h-fit">
              <h2 className="text-lg font-black text-gray-800 mb-5">Upload New Book</h2>
              
              {uploadError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />{uploadError}
                </div>
              )}
              {uploadSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />{uploadSuccess}
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-600 text-xs font-bold uppercase tracking-wider mb-1.5">Book Title</label>
                  <input type="text" required placeholder="e.g. Inorganic Chemistry Vol 2" className={inputCls} value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div>
                  <label className="block text-gray-600 text-xs font-bold uppercase tracking-wider mb-1.5">Subject / Category</label>
                  <input type="text" required placeholder="e.g. Chemistry" className={inputCls} value={subject} onChange={e => setSubject(e.target.value)} />
                </div>
                <div>
                  <label className="block text-gray-600 text-xs font-bold uppercase tracking-wider mb-1.5">Description</label>
                  <textarea placeholder="Brief overview..." rows="3" className={`${inputCls} resize-none`} value={description} onChange={e => setDescription(e.target.value)} />
                </div>

                {/* PDF Upload */}
                <div>
                  <label className="block text-gray-600 text-xs font-bold uppercase tracking-wider mb-1.5">PDF File *</label>
                  <div className="relative border-2 border-dashed border-orange-200 hover:border-orange-400 rounded-2xl p-5 flex flex-col items-center justify-center bg-orange-50/50 transition-colors cursor-pointer">
                    <input id="pdf-input" type="file" required accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setPdfFile(e.target.files[0])} />
                    <UploadCloud className="w-7 h-7 text-orange-400 mb-1.5" />
                    <span className="text-xs font-semibold text-gray-600">{pdfFile ? pdfFile.name : 'Select or drag PDF'}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">PDF (Max 50MB)</span>
                  </div>
                </div>

                {/* Cover Upload */}
                <div>
                  <label className="block text-gray-600 text-xs font-bold uppercase tracking-wider mb-1.5">Cover Image (Optional)</label>
                  <div className="relative border-2 border-dashed border-gray-200 hover:border-orange-300 rounded-2xl p-4 flex flex-col items-center justify-center bg-gray-50 transition-colors cursor-pointer">
                    <input id="thumb-input" type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setThumbFile(e.target.files[0])} />
                    <UploadCloud className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-xs font-semibold text-gray-500">{thumbFile ? thumbFile.name : 'Select cover image'}</span>
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="rounded border-gray-300 text-orange-500 focus:ring-orange-300" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} />
                  <span className="text-xs text-gray-600 font-medium">Publish immediately (visible to students)</span>
                </label>

                <button type="submit" disabled={uploadProgress}
                  className="w-full text-white font-bold py-3 rounded-2xl shadow-md shadow-orange-200 active:translate-y-[1px] transition-all disabled:opacity-50 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)' }}>
                  {uploadProgress ? 'Uploading...' : 'Upload Book'}
                </button>
              </form>
            </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Book List */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-lg font-black text-gray-800 mb-4">Manage Library Books</h2>
              {books.length === 0 ? (
                <p className="text-gray-400 text-sm py-4">No books in the system yet.</p>
              ) : (
                <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
                  {books.map(book => (
                    <div key={book._id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-orange-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-12 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                          {book.thumbnailUrl ? (
                            <img src={book.thumbnailUrl.startsWith('/uploads') ? `${API_URL.replace('/api', '')}${book.thumbnailUrl}` : book.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <BookOpen className="w-5 h-5 text-orange-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-gray-800 line-clamp-1">{book.title}</h4>
                          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mt-0.5">{book.subject}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleTogglePublish(book)}
                          className={`p-2 rounded-xl border transition-all ${book.isPublished ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-gray-100 border-gray-200 text-gray-400 hover:bg-orange-50'}`}
                          title={book.isPublished ? 'Unpublish' : 'Publish'}>
                          {book.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button onClick={() => startEdit(book)}
                          className="p-2 bg-blue-50 border border-blue-200 text-blue-500 rounded-xl transition-all hover:bg-blue-100"
                          title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteBook(book._id)}
                          className="p-2 bg-red-50 border border-red-200 text-red-400 rounded-xl hover:bg-red-100 transition-all"
                          title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Student Stats Table */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-lg font-black text-gray-800 mb-4">Student Reading Statistics</h2>
              {stats.studentStats.length === 0 ? (
                <p className="text-gray-400 text-sm py-4">No reading statistics recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 text-xs uppercase tracking-wider font-bold">
                        <th className="pb-3">Student</th>
                        <th className="pb-3">Book</th>
                        <th className="pb-3 text-center">Pages</th>
                        <th className="pb-3 text-right">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm text-gray-600">
                      {stats.studentStats.map(session => (
                        <tr key={session._id} className="hover:bg-orange-50/40 transition-colors">
                          <td className="py-3 pr-2">
                            <p className="font-semibold text-gray-800">{session.studentName}</p>
                            <p className="text-xs text-gray-400">{session.studentEmail}</p>
                          </td>
                          <td className="py-3 pr-2">
                            <p className="line-clamp-1 font-medium text-gray-700">{session.bookTitle}</p>
                            <p className="text-xs text-gray-400">{session.bookSubject}</p>
                          </td>
                          <td className="py-3 text-center text-gray-500 text-xs">{session.currentPage} / {session.totalPages}</td>
                          <td className="py-3 text-right font-bold text-orange-600">{formatStudyTime(session.studyTimeSeconds)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Audio Upload Form */}
            <div className="lg:col-span-1 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm h-fit">
              <h2 className="text-lg font-black text-gray-800 mb-5">Upload Audio Byte</h2>
              
              {audioUploadError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />{audioUploadError}
                </div>
              )}
              {audioUploadSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />{audioUploadSuccess}
                </div>
              )}

              <form onSubmit={handleAudioUploadSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-600 text-xs font-bold uppercase tracking-wider mb-1.5">Topic</label>
                  <input type="text" required placeholder="e.g. Fundamental Rights" className={inputCls} value={audioTopic} onChange={e => setAudioTopic(e.target.value)} />
                </div>
                <div>
                  <label className="block text-gray-600 text-xs font-bold uppercase tracking-wider mb-1.5">Subject / Tag</label>
                  <input type="text" required placeholder="e.g. Polity" className={inputCls} value={audioSubject} onChange={e => setAudioSubject(e.target.value)} />
                </div>
                <div>
                  <label className="block text-gray-600 text-xs font-bold uppercase tracking-wider mb-1.5">Key Points (Comma separated)</label>
                  <textarea placeholder="e.g. Part III of Constitution, Articles 12-35, Justiciable" rows="3" className={`${inputCls} resize-none`} value={audioKeyPoints} onChange={e => setAudioKeyPoints(e.target.value)} />
                </div>
                <div>
                  <label className="block text-gray-600 text-xs font-bold uppercase tracking-wider mb-1.5">Read Full Topic Link (Optional)</label>
                  <input type="text" placeholder="e.g. /reader/12345" className={inputCls} value={audioWebLink} onChange={e => setAudioWebLink(e.target.value)} />
                </div>

                {/* Audio Upload */}
                <div>
                  <label className="block text-gray-600 text-xs font-bold uppercase tracking-wider mb-1.5">Audio File *</label>
                  <div className="relative border-2 border-dashed border-orange-200 hover:border-orange-400 rounded-2xl p-5 flex flex-col items-center justify-center bg-orange-50/50 transition-colors cursor-pointer">
                    <input id="audio-input" type="file" required accept="audio/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setAudioFile(e.target.files[0])} />
                    <Music className="w-7 h-7 text-orange-400 mb-1.5" />
                    <span className="text-xs font-semibold text-gray-600">{audioFile ? audioFile.name : 'Select Audio File'}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">MP3, WAV, WebM</span>
                  </div>
                </div>

                <button type="submit" disabled={audioUploadProgress}
                  className="w-full text-white font-bold py-3 rounded-2xl shadow-md shadow-orange-200 active:translate-y-[1px] transition-all disabled:opacity-50 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)' }}>
                  {audioUploadProgress ? 'Uploading...' : 'Upload Audio Byte'}
                </button>
              </form>
            </div>

            {/* Right column: Audio List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-lg font-black text-gray-800 mb-4">Manage Audio Bytes</h2>
                {audioBytes.length === 0 ? (
                  <p className="text-gray-400 text-sm py-4">No audio bytes uploaded yet.</p>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                    {audioBytes.map(byte => (
                      <div key={byte._id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                            <Music className="w-5 h-5 text-orange-500" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-gray-800">{byte.topic}</h4>
                            <p className="text-xs text-orange-600 font-bold uppercase tracking-wider mt-0.5">{byte.subject}</p>
                            {byte.keyPoints?.length > 0 && (
                              <div className="mt-2 flex gap-1 flex-wrap">
                                {byte.keyPoints.slice(0, 2).map((kp, idx) => (
                                  <span key={idx} className="text-[10px] bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full line-clamp-1 max-w-[150px]">
                                    {kp}
                                  </span>
                                ))}
                                {byte.keyPoints.length > 2 && <span className="text-[10px] text-gray-400">+{byte.keyPoints.length - 2}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                        <button onClick={() => handleDeleteAudioByte(byte._id)}
                          className="p-2 bg-red-50 border border-red-200 text-red-400 rounded-xl hover:bg-red-100 transition-all shrink-0"
                          title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {editingBook && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-md w-full p-7 space-y-4">
            <h3 className="text-lg font-black text-gray-800">Edit Book</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-600 text-xs font-bold uppercase tracking-wider mb-1.5">Title</label>
                <input type="text" required className={inputCls} value={editTitle} onChange={e => setEditTitle(e.target.value)} />
              </div>
              <div>
                <label className="block text-gray-600 text-xs font-bold uppercase tracking-wider mb-1.5">Subject</label>
                <input type="text" required className={inputCls} value={editSubject} onChange={e => setEditSubject(e.target.value)} />
              </div>
              <div>
                <label className="block text-gray-600 text-xs font-bold uppercase tracking-wider mb-1.5">Description</label>
                <textarea rows="3" className={`${inputCls} resize-none`} value={editDescription} onChange={e => setEditDescription(e.target.value)} />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-orange-500" checked={editIsPublished} onChange={e => setEditIsPublished(e.target.checked)} />
                <span className="text-xs text-gray-600 font-medium">Published (visible to students)</span>
              </label>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setEditingBook(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-xl">Cancel</button>
                <button type="submit"
                  className="px-5 py-2 text-white text-xs font-bold rounded-xl cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
