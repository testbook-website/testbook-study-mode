import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '.db-data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export let isFallback = false;

// Simple helper to load/save JSON tables for fallback mode
class JSONTable {
  constructor(name) {
    this.filePath = path.join(DATA_DIR, `${name}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
    }
  }

  read() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error(`Error reading database file ${this.filePath}`, err);
      return [];
    }
  }

  write(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(`Error writing database file ${this.filePath}`, err);
    }
  }
}

// Mimics a Mongoose query/document interface for local JSON DB
class MockQuery {
  constructor(data) {
    this.data = data;
  }

  sort(options) {
    if (!options) return this;
    const key = Object.keys(options)[0];
    const order = options[key]; // 1 or -1, or 'desc'/'asc'
    this.data.sort((a, b) => {
      let valA = a[key];
      let valB = b[key];
      if (typeof valA === 'string') {
        return order === -1 || order === 'desc' 
          ? valB.localeCompare(valA) 
          : valA.localeCompare(valB);
      }
      return order === -1 || order === 'desc' 
        ? (valB - valA) 
        : (valA - valB);
    });
    return this;
  }

  limit(num) {
    this.data = this.data.slice(0, num);
    return this;
  }

  then(onfulfilled, onrejected) {
    return Promise.resolve(this.data).then(onfulfilled, onrejected);
  }
}

class MockModel {
  constructor(name) {
    this.name = name;
    this.table = new JSONTable(name);
  }

  async find(query = {}) {
    const list = this.table.read();
    const filtered = list.filter(item => {
      for (let key in query) {
        // Simple nested path or direct match
        if (query[key] !== undefined && item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
    return new MockQuery(filtered);
  }

  async findOne(query = {}) {
    const list = this.table.read();
    const item = list.find(item => {
      for (let key in query) {
        if (query[key] !== undefined && item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
    return item || null;
  }

  async findById(id) {
    return this.findOne({ _id: id });
  }

  async create(doc) {
    const list = this.table.read();
    const newDoc = {
      _id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
      ...doc
    };
    list.push(newDoc);
    this.table.write(list);
    return newDoc;
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const list = this.table.read();
    const idx = list.findIndex(item => item._id === id);
    if (idx === -1) return null;
    
    // Apply updates (support Mongoose flat update style)
    const updated = {
      ...list[idx],
      ...(update.$set || update),
      updatedAt: new Date().toISOString()
    };
    list[idx] = updated;
    this.table.write(list);
    return updated;
  }

  async findByIdAndDelete(id) {
    const list = this.table.read();
    const idx = list.findIndex(item => item._id === id);
    if (idx === -1) return null;
    const removed = list.splice(idx, 1)[0];
    this.table.write(list);
    return removed;
  }

  async countDocuments(query = {}) {
    const results = await this.find(query);
    return results.data.length;
  }

  async deleteMany(query = {}) {
    const list = this.table.read();
    const remaining = list.filter(item => {
      for (let key in query) {
        if (query[key] !== undefined && item[key] === query[key]) {
          return false;
        }
      }
      return true;
    });
    this.table.write(remaining);
    return { deletedCount: list.length - remaining.length };
  }
}

// Standard Mongoose schemas configuration
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'student'], default: 'student' },
  createdAt: { type: Date, default: Date.now }
});

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  description: { type: String, default: '' },
  thumbnailUrl: { type: String, default: '' },
  pdfUrl: { type: String, required: true },
  publishedBy: { type: String, default: 'Admin' },
  isPublished: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const readingSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  bookId: { type: String, required: true },
  currentPage: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 },
  studyTimeSeconds: { type: Number, default: 0 },
  lastReadAt: { type: Date, default: Date.now }
});

const highlightSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  bookId: { type: String, required: true },
  pageNumber: { type: Number, required: true },
  highlightedText: { type: String, required: true },
  color: { type: String, default: 'yellow' },
  createdAt: { type: Date, default: Date.now }
});

const noteSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  bookId: { type: String, required: true },
  pageNumber: { type: Number, required: true },
  noteText: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const audioByteSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  subject: { type: String, required: true },
  audioUrl: { type: String, required: true },
  keyPoints: [{ type: String }],
  webLink: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const bookmarkSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  bookId: { type: String, required: true },
  pageNumber: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

let db = {
  User: null,
  Book: null,
  ReadingSession: null,
  Highlight: null,
  Note: null,
  AudioByte: null,
  Bookmark: null
};

export async function connectDB(uri) {
  if (uri) {
    try {
      console.log('Attempting MongoDB connection...');
      await mongoose.connect(uri);
      console.log('MongoDB Connected Successfully!');
      isFallback = false;
      db.User = mongoose.model('User', userSchema);
      db.Book = mongoose.model('Book', bookSchema);
      db.ReadingSession = mongoose.model('ReadingSession', readingSessionSchema);
      db.Highlight = mongoose.model('Highlight', highlightSchema);
      db.Note = mongoose.model('Note', noteSchema);
      db.AudioByte = mongoose.model('AudioByte', audioByteSchema);
      db.Bookmark = mongoose.model('Bookmark', bookmarkSchema);
      return;
    } catch (err) {
      console.error('MongoDB connection failed. Falling back to local JSON database.', err.message);
    }
  } else {
    console.log('No MONGODB_URI env provided. Initializing local JSON database...');
  }

  // Set up local file fallbacks
  isFallback = true;
  db.User = new MockModel('users');
  db.Book = new MockModel('books');
  db.ReadingSession = new MockModel('readingSessions');
  db.Highlight = new MockModel('highlights');
  db.Note = new MockModel('notes');
  db.Bookmark = new MockModel('bookmarks');
  db.AudioByte = new MockModel('audio_bytes');
  console.log('Local JSON Database initialized.');
}

export default db;
