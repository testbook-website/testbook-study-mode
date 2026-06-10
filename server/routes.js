import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from './db.js';
import { upload, uploadToStorage, authMiddleware, adminMiddleware } from './middleware.js';
import { askDoubt, summariseContent } from './aiService.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();


const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_key_12345';

// ----------------------------------------------------
// AUTH ENDPOINTS
// ----------------------------------------------------

// Register a new user (admin or student)
router.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await db.User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.User.create({
      name,
      email,
      password: hashedPassword,
      role: email.toLowerCase() === 'medeti.prasad@testbook.com' ? 'admin' : 'student'
    });

    // Supabase Lead Sync
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
    const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;
    
    if (supabase) {
      try {
        const { error } = await supabase
          .from('leads')
          .insert([
            { name: user.name, email: user.email, role: user.role }
          ]);
        if (error) {
          console.error('Failed to sync lead to Supabase:', error.message);
        } else {
          console.log('Successfully synced lead to Supabase:', user.email);
        }
      } catch (sbErr) {
        console.error('Supabase integration error:', sbErr);
      }
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ message: 'Server error during registration' });
  }
});

// User login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await db.User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error during login' });
  }
});

// Get currently logged-in user profile
router.get('/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await db.User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ message: 'Server error fetching profile' });
  }
});


// ----------------------------------------------------
// BOOK PORTAL ENDPOINTS
// ----------------------------------------------------

// Admin Upload Book
router.post('/admin/books', authMiddleware, adminMiddleware, upload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, subject, description, publishedBy, isPublished } = req.body;
    
    if (!title || !subject) {
      return res.status(400).json({ message: 'Title and subject are required' });
    }

    const pdfFiles = req.files['pdf'];
    if (!pdfFiles || pdfFiles.length === 0) {
      return res.status(400).json({ message: 'PDF file is required' });
    }

    // Upload files using middleware config (either S3 or Local Fallback)
    const pdfUrl = await uploadToStorage(pdfFiles[0], 'pdfs');
    
    const thumbnailFiles = req.files['thumbnail'];
    let thumbnailUrl = '';
    if (thumbnailFiles && thumbnailFiles.length > 0) {
      thumbnailUrl = await uploadToStorage(thumbnailFiles[0], 'thumbnails');
    }

    const book = await db.Book.create({
      title,
      subject,
      description: description || '',
      thumbnailUrl,
      pdfUrl,
      publishedBy: publishedBy || 'Admin',
      isPublished: isPublished === undefined ? true : (isPublished === 'true' || isPublished === true)
    });

    return res.status(201).json(book);
  } catch (err) {
    console.error('Error uploading book:', err);
    return res.status(500).json({ message: 'Server error uploading book' });
  }
});

// Admin Get All Books
router.get('/admin/books', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const books = await db.Book.find({});
    return res.status(200).json(books);
  } catch (err) {
    console.error('Error fetching admin books:', err);
    return res.status(500).json({ message: 'Server error fetching books' });
  }
});

// Admin Update Book
router.put('/admin/books/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const updatedBook = await db.Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedBook) {
      return res.status(404).json({ message: 'Book not found' });
    }
    return res.status(200).json(updatedBook);
  } catch (err) {
    console.error('Error updating book:', err);
    return res.status(500).json({ message: 'Server error updating book' });
  }
});

// Admin Delete Book
router.delete('/admin/books/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const deletedBook = await db.Book.findByIdAndDelete(req.params.id);
    if (!deletedBook) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Clean up associated student sessions, notes, highlights, bookmarks
    await db.ReadingSession.deleteMany({ bookId: req.params.id });
    await db.Highlight.deleteMany({ bookId: req.params.id });
    await db.Note.deleteMany({ bookId: req.params.id });
    await db.Bookmark.deleteMany({ bookId: req.params.id });

    return res.status(200).json({ message: 'Book and all related data deleted successfully' });
  } catch (err) {
    console.error('Error deleting book:', err);
    return res.status(500).json({ message: 'Server error deleting book' });
  }
});

// Student Get All Published Books
router.get('/books', authMiddleware, async (req, res) => {
  try {
    const books = await db.Book.find({ isPublished: true });
    return res.status(200).json(books);
  } catch (err) {
    console.error('Error fetching student books:', err);
    return res.status(500).json({ message: 'Server error fetching books' });
  }
});

// Student Get Book details by ID
router.get('/books/:id', authMiddleware, async (req, res) => {
  try {
    const book = await db.Book.findById(req.params.id);
    if (!book || (!book.isPublished && req.user.role !== 'admin')) {
      return res.status(404).json({ message: 'Book not found' });
    }
    return res.status(200).json(book);
  } catch (err) {
    console.error('Error fetching book details:', err);
    return res.status(500).json({ message: 'Server error fetching book details' });
  }
});


// ----------------------------------------------------
// READING PROGRESS / SESSION ENDPOINTS
// ----------------------------------------------------

// Save Reading Progress and Study Duration
router.post('/progress/save', authMiddleware, async (req, res) => {
  try {
    const { bookId, currentPage, totalPages, studyTimeSeconds } = req.body;
    if (!bookId) {
      return res.status(400).json({ message: 'bookId is required' });
    }

    const userId = req.user.id;
    let session = await db.ReadingSession.findOne({ userId, bookId });

    if (session) {
      session = await db.ReadingSession.findByIdAndUpdate(session._id, {
        currentPage: currentPage || session.currentPage,
        totalPages: totalPages || session.totalPages,
        studyTimeSeconds: (session.studyTimeSeconds || 0) + (studyTimeSeconds || 0),
        lastReadAt: new Date().toISOString()
      }, { new: true });
    } else {
      session = await db.ReadingSession.create({
        userId,
        bookId,
        currentPage: currentPage || 1,
        totalPages: totalPages || 1,
        studyTimeSeconds: studyTimeSeconds || 0,
        lastReadAt: new Date().toISOString()
      });
    }

    return res.status(200).json(session);
  } catch (err) {
    console.error('Error saving reading progress:', err);
    return res.status(500).json({ message: 'Server error saving reading progress' });
  }
});

// Get all reading progress sessions for the user
router.get('/progress', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const sessions = await db.ReadingSession.find({ userId });
    return res.status(200).json(sessions);
  } catch (err) {
    console.error('Error getting all progress sessions:', err);
    return res.status(500).json({ message: 'Server error getting progress list' });
  }
});

// Get Reading Progress for a book
router.get('/progress/:bookId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const session = await db.ReadingSession.findOne({ userId, bookId: req.params.bookId });
    if (!session) {
      return res.status(200).json({ currentPage: 1, totalPages: 1, studyTimeSeconds: 0 });
    }
    return res.status(200).json(session);
  } catch (err) {
    console.error('Error getting progress:', err);
    return res.status(500).json({ message: 'Server error getting progress' });
  }
});


// ----------------------------------------------------
// HIGHLIGHTS ENDPOINTS
// ----------------------------------------------------

router.get('/highlights/:bookId', authMiddleware, async (req, res) => {
  try {
    const highlights = await db.Highlight.find({ userId: req.user.id, bookId: req.params.bookId });
    return res.status(200).json(highlights);
  } catch (err) {
    console.error('Error getting highlights:', err);
    return res.status(500).json({ message: 'Server error getting highlights' });
  }
});

router.post('/highlights', authMiddleware, async (req, res) => {
  try {
    const { bookId, pageNumber, highlightedText, color } = req.body;
    if (!bookId || !pageNumber || !highlightedText) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const highlight = await db.Highlight.create({
      userId: req.user.id,
      bookId,
      pageNumber,
      highlightedText,
      color: color || 'yellow'
    });
    return res.status(201).json(highlight);
  } catch (err) {
    console.error('Error creating highlight:', err);
    return res.status(500).json({ message: 'Server error saving highlight' });
  }
});

router.delete('/highlights/:id', authMiddleware, async (req, res) => {
  try {
    const highlight = await db.Highlight.findById(req.params.id);
    if (!highlight) {
      return res.status(404).json({ message: 'Highlight not found' });
    }
    if (highlight.userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized action' });
    }
    await db.Highlight.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: 'Highlight deleted' });
  } catch (err) {
    console.error('Error deleting highlight:', err);
    return res.status(500).json({ message: 'Server error deleting highlight' });
  }
});


// ----------------------------------------------------
// NOTES ENDPOINTS
// ----------------------------------------------------

router.get('/notes/:bookId', authMiddleware, async (req, res) => {
  try {
    const notes = await db.Note.find({ userId: req.user.id, bookId: req.params.bookId });
    return res.status(200).json(notes);
  } catch (err) {
    console.error('Error getting notes:', err);
    return res.status(500).json({ message: 'Server error getting notes' });
  }
});

router.post('/notes', authMiddleware, async (req, res) => {
  try {
    const { bookId, pageNumber, noteText } = req.body;
    if (!bookId || !pageNumber) {
      return res.status(400).json({ message: 'bookId and pageNumber are required' });
    }

    const userId = req.user.id;
    let note = await db.Note.findOne({ userId, bookId, pageNumber });

    if (note) {
      note = await db.Note.findByIdAndUpdate(note._id, { noteText }, { new: true });
    } else {
      note = await db.Note.create({ userId, bookId, pageNumber, noteText });
    }
    return res.status(200).json(note);
  } catch (err) {
    console.error('Error saving note:', err);
    return res.status(500).json({ message: 'Server error saving note' });
  }
});

router.delete('/notes/:id', authMiddleware, async (req, res) => {
  try {
    const note = await db.Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    if (note.userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized action' });
    }
    await db.Note.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: 'Note deleted' });
  } catch (err) {
    console.error('Error deleting note:', err);
    return res.status(500).json({ message: 'Server error deleting note' });
  }
});


// ----------------------------------------------------
// BOOKMARKS ENDPOINTS (WITH TOGGLE CAPABILITY)
// ----------------------------------------------------

router.get('/bookmarks/:bookId', authMiddleware, async (req, res) => {
  try {
    const bookmarks = await db.Bookmark.find({ userId: req.user.id, bookId: req.params.bookId });
    return res.status(200).json(bookmarks);
  } catch (err) {
    console.error('Error getting bookmarks:', err);
    return res.status(500).json({ message: 'Server error getting bookmarks' });
  }
});

router.post('/bookmarks/toggle', authMiddleware, async (req, res) => {
  try {
    const { bookId, pageNumber } = req.body;
    if (!bookId || !pageNumber) {
      return res.status(400).json({ message: 'bookId and pageNumber are required' });
    }

    const userId = req.user.id;
    const existing = await db.Bookmark.findOne({ userId, bookId, pageNumber });

    if (existing) {
      await db.Bookmark.findByIdAndDelete(existing._id);
      return res.status(200).json({ message: 'Bookmark removed', status: 'removed' });
    } else {
      const bookmark = await db.Bookmark.create({ userId, bookId, pageNumber });
      return res.status(201).json({ message: 'Bookmark added', bookmark, status: 'added' });
    }
  } catch (err) {
    console.error('Error toggling bookmark:', err);
    return res.status(500).json({ message: 'Server error toggling bookmark' });
  }
});


// ----------------------------------------------------
// AI SERVICE ROUTING
// ----------------------------------------------------

router.post('/ai/ask-doubt', authMiddleware, async (req, res) => {
  try {
    const { bookTitle, subject, pageNumber, pageContent, doubtHistory, userDoubt } = req.body;
    if (!userDoubt) {
      return res.status(400).json({ message: 'Doubt query is required' });
    }

    const responseText = await askDoubt({
      bookTitle: bookTitle || 'Unknown Book',
      subject: subject || 'General Subject',
      pageNumber: pageNumber || 1,
      pageContent: pageContent || '',
      doubtHistory: doubtHistory || [],
      userDoubt
    });

    return res.status(200).json({ answer: responseText });
  } catch (err) {
    console.error('Ask Doubt AI error:', err);
    return res.status(500).json({ message: 'Server error processing AI doubt solver query' });
  }
});

router.post('/ai/summarise', authMiddleware, async (req, res) => {
  try {
    const { bookTitle, subject, pageStart, pageEnd, contentText } = req.body;
    if (!contentText && !bookTitle) {
      return res.status(400).json({ message: 'Content to summarize is required' });
    }

    const summaryText = await summariseContent({
      bookTitle: bookTitle || 'Unknown Book',
      subject: subject || 'General Subject',
      pageStart: pageStart || 1,
      pageEnd: pageEnd || 1,
      contentText: contentText || ''
    });

    return res.status(200).json({ summary: summaryText });
  } catch (err) {
    console.error('AI summary error:', err);
    return res.status(500).json({ message: 'Server error processing AI summarization request' });
  }
});


// ----------------------------------------------------
// ADMIN ANALYTICS & STATS ENDPOINTS
// ----------------------------------------------------

router.get('/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const allBooks = await db.Book.find({});
    const allUsers = await db.User.find({});
    const allSessions = await db.ReadingSession.find({});

    const totalBooks = allBooks.length;
    const activeStudents = allUsers.filter(u => u.role === 'student').length;

    // Aggregate cumulative study times by book ID
    const timeByBook = {};
    allSessions.forEach(session => {
      const bId = session.bookId;
      timeByBook[bId] = (timeByBook[bId] || 0) + (session.studyTimeSeconds || 0);
    });

    // Match books and sort to get most read books
    const bookMap = {};
    allBooks.forEach(b => {
      bookMap[b._id] = b;
    });

    const mostReadBooks = Object.keys(timeByBook)
      .map(bId => {
        const book = bookMap[bId];
        return {
          bookId: bId,
          title: book ? book.title : 'Deleted Book',
          subject: book ? book.subject : 'N/A',
          thumbnailUrl: book ? book.thumbnailUrl : '',
          totalStudyTimeSeconds: timeByBook[bId]
        };
      })
      .sort((a, b) => b.totalStudyTimeSeconds - a.totalStudyTimeSeconds)
      .slice(0, 5);

    // Map detail stats per session for list display
    const userMap = {};
    allUsers.forEach(u => {
      userMap[u._id] = u;
    });

    const studentStats = allSessions.map(session => {
      const student = userMap[session.userId];
      const book = bookMap[session.bookId];
      return {
        _id: session._id,
        studentName: student ? student.name : 'Unknown Student',
        studentEmail: student ? student.email : 'N/A',
        bookTitle: book ? book.title : 'Deleted Book',
        bookSubject: book ? book.subject : 'N/A',
        currentPage: session.currentPage,
        totalPages: session.totalPages,
        studyTimeSeconds: session.studyTimeSeconds,
        lastReadAt: session.lastReadAt
      };
    });

    return res.status(200).json({
      totalBooks,
      activeStudents,
      mostReadBooks,
      studentStats
    });
  } catch (err) {
    console.error('Error fetching admin statistics:', err);
    return res.status(500).json({ message: 'Server error aggregating statistics' });
  }
});

// Get all audio bytes
router.get('/audio-bytes', authMiddleware, async (req, res) => {
  try {
    let audioBytes = await db.AudioByte.find({});
    const data = audioBytes.data || audioBytes;
    const sorted = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching audio bytes' });
  }
});

// Admin upload audio byte
router.post('/admin/audio-bytes', authMiddleware, adminMiddleware, upload.single('audio'), async (req, res) => {
  try {
    const { topic, subject, keyPoints, webLink } = req.body;
    
    if (!req.file || !topic || !subject) {
      return res.status(400).json({ message: 'Audio file, topic, and subject are required' });
    }

    const audioUrl = await uploadToStorage(req.file, 'audio-bytes');
    if (!audioUrl) {
      return res.status(500).json({ message: 'Failed to upload audio file' });
    }

    const parsedKeyPoints = keyPoints ? keyPoints.split(',').map(k => k.trim()).filter(k => k) : [];

    const newByte = await db.AudioByte.create({
      topic,
      subject,
      audioUrl,
      keyPoints: parsedKeyPoints,
      webLink: webLink || ''
    });

    res.status(201).json(newByte);
  } catch (err) {
    console.error('Audio Byte creation error:', err);
    res.status(500).json({ message: 'Server error while creating audio byte' });
  }
});

// Admin delete audio byte
router.delete('/admin/audio-bytes/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const deletedByte = await db.AudioByte.findByIdAndDelete(req.params.id);
    if (!deletedByte) {
      return res.status(404).json({ message: 'Audio Byte not found' });
    }
    return res.status(200).json({ message: 'Audio Byte deleted successfully' });
  } catch (err) {
    console.error('Error deleting Audio Byte:', err);
    return res.status(500).json({ message: 'Server error deleting Audio Byte' });
  }
});

export default router;
