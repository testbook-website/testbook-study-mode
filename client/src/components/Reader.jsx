import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import { useAuth, API_URL } from '../AuthContext';
import Timer from './Timer';
import { 
  ArrowLeft, ChevronLeft, ChevronRight, Bookmark, Highlighter, 
  MessageSquare, Sparkles, AlertCircle, BookmarkCheck, FileText, Send, X,
  ZoomIn, ZoomOut, BookOpen
} from 'lucide-react';

// Initialize PDF.js Worker via CDN unpkg matching exact package version
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

const MARKETING_TEXTS = [
  "Generating response... Did you know? 1 out of 10 questions in SSC Exams are directly from Testbook Mock Tests!",
  "Thinking... Testbook Pass gives you access to 70,000+ Mock Tests for 700+ Exams. Keep practicing!",
  "Analyzing... Over 3.5 Crore students trust Testbook for their exam preparation.",
  "Reading context... Top Rankers use Testbook! Practice daily to secure your rank.",
  "Formulating answer... Testbook SuperCoaching offers video lessons from India's Super Teachers."
];

export default function Reader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, authenticatedFetch } = useAuth();

  // Book meta
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // PDF rendering state
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [pageAspect, setPageAspect] = useState(0.707); // Default A4 aspect ratio (1 / sqrt(2))
  const [bookDimensions, setBookDimensions] = useState({ width: 0, height: 0 });
  const [viewMode, setViewMode] = useState('double'); // 'double' or 'single'
  const [zoom, setZoom] = useState(1.0); // 1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5

  // 3D Flip animation state
  const [animationState, setAnimationState] = useState(null); // 'flipping-next' or 'flipping-prev'
  const [isFlipped, setIsFlipped] = useState(false); // Triggers CSS rotate transition
  
  // Annotations (Bookmarks, Notes, Highlights)
  const [bookmarks, setBookmarks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [highlights, setHighlights] = useState([]);
  
  // Note edit input
  const [currentPageNote, setCurrentPageNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Active panel (notes/bookmarks, doubt drawer)
  const [activePanel, setActivePanel] = useState(null); // 'annotations' or 'doubts'

  // Doubt solver state (Gemini)
  const [userDoubt, setUserDoubt] = useState('');
  const [doubtHistory, setDoubtHistory] = useState([]);
  const [doubtLoading, setDoubtLoading] = useState(false);

  // Summary state (OpenAI)
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryRange, setSummaryRange] = useState({ start: 1, end: 1 });

  // Highlighting selection popup state
  const [selectionBox, setSelectionBox] = useState(null); // { x, y, text }
  const [selectedText, setSelectedText] = useState('');

  // Canvases references
  const leftCanvasRef = useRef(null);
  const rightCanvasRef = useRef(null);
  const flipFrontCanvasRef = useRef(null);
  const flipBackCanvasRef = useRef(null);
  
  // Touch coordinates for swipe gestures
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  
  // Render task management (prevents parallel drawing errors)
  const activeRenderTasks = useRef({});
  const containerRef = useRef(null);

  // Listen to window size changes
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Resize observer to handle panel toggles and window resizes
  useEffect(() => {
    if (!containerRef.current || !pdfDoc || loading) return;

    let timeoutId = null;

    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      if (!width || !height) return;

      if (animationState) return;

      if (timeoutId) clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        const isSingle = isMobile || viewMode === 'single';
        const bookAspect = isSingle ? pageAspect : 2 * pageAspect;
        const containerAspect = width / height;

        let bookW, bookH;
        if (bookAspect > containerAspect) {
          // Width limited
          bookW = width;
          bookH = width / bookAspect;
        } else {
          // Height limited
          bookH = height;
          bookW = height * bookAspect;
        }

        setBookDimensions({ 
          width: Math.floor(bookW * zoom), 
          height: Math.floor(bookH * zoom) 
        });
      }, 50); // Small debounce to avoid intermediate layouts
    });

    observer.observe(containerRef.current);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [pdfDoc, pageAspect, isMobile, loading, animationState, viewMode, zoom]);

  // Fetch book metadata & user annotations
  useEffect(() => {
    const loadBookData = async () => {
      try {
        setLoading(true);
        // Book details
        const bookRes = await authenticatedFetch(`${API_URL}/books/${id}`);
        if (!bookRes.ok) throw new Error('Book not found or unavailable');
        const bookData = await bookRes.json();
        setBook(bookData);

        // Bookmarks
        const bmRes = await authenticatedFetch(`${API_URL}/bookmarks/${id}`);
        if (bmRes.ok) setBookmarks(await bmRes.json());

        // Notes
        const notesRes = await authenticatedFetch(`${API_URL}/notes/${id}`);
        if (notesRes.ok) {
          const notesData = await notesRes.json();
          setNotes(notesData);
        }

        // Highlights
        const hlRes = await authenticatedFetch(`${API_URL}/highlights/${id}`);
        if (hlRes.ok) setHighlights(await hlRes.json());

        // Reading session progress (resume page)
        const progRes = await authenticatedFetch(`${API_URL}/progress/${id}`);
        if (progRes.ok) {
          const progData = await progRes.json();
          if (progData && progData.currentPage) {
            setPageNumber(progData.currentPage);
          }
        }

        // Load PDF Document via PDF.js
        const finalPdfUrl = bookData.pdfUrl.startsWith('/uploads') 
          ? `${API_URL.replace('/api', '')}${bookData.pdfUrl}` 
          : bookData.pdfUrl;

        const loadingTask = pdfjsLib.getDocument(finalPdfUrl);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setSummaryRange({ start: 1, end: Math.min(5, pdf.numPages) });

        // Get page aspect ratio
        try {
          const firstPage = await pdf.getPage(1);
          const unscaledViewport = firstPage.getViewport({ scale: 1.0 });
          if (unscaledViewport.width && unscaledViewport.height) {
            setPageAspect(unscaledViewport.width / unscaledViewport.height);
          }
        } catch (e) {
          console.error("Error getting page aspect ratio:", e);
        }
      } catch (err) {
        setError(err.message || 'Error loading PDF study book');
      } finally {
        setLoading(false);
      }
    };

    loadBookData();
  }, [id, token]);

  // Load current note for text area when page turns
  useEffect(() => {
    const note = notes.find(n => n.pageNumber === pageNumber);
    setCurrentPageNote(note ? note.noteText : '');
  }, [pageNumber, notes]);

  // Helper to cancel ongoing render tasks
  const cancelRenderTask = (key) => {
    if (activeRenderTasks.current[key]) {
      try {
        activeRenderTasks.current[key].cancel();
      } catch (e) {
        // Task already completed or cancelled
      }
      delete activeRenderTasks.current[key];
    }
  };

  // Main rendering routine for a page onto a canvas
  const drawPage = useCallback(async (pageNum, canvas, taskKey) => {
    if (!pdfDoc || !canvas) return;

    cancelRenderTask(taskKey);

    try {
      const page = await pdfDoc.getPage(pageNum);
      const ctx = canvas.getContext('2d');

      // Now canvas.parentElement is the container which has the exact size we want!
      const parent = canvas.parentElement;
      const style = window.getComputedStyle(parent);
      const paddingX = parseFloat(style.paddingLeft || 0) + parseFloat(style.paddingRight || 0);
      const paddingY = parseFloat(style.paddingTop || 0) + parseFloat(style.paddingBottom || 0);
      
      const displayW = parent.clientWidth - paddingX;
      const displayH = parent.clientHeight - paddingY;

      if (!displayW || !displayH) return;

      const unscaledViewport = page.getViewport({ scale: 1.0 });

      // Render at a higher device pixel ratio for crisp text (at least 2.5x)
      const dpr = Math.max(window.devicePixelRatio || 1, 2.5);
      const scale = (displayW / unscaledViewport.width) * dpr;
      const viewport = page.getViewport({ scale });

      // Ensure canvas dimensions are integers
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      
      // CSS size = exact display width and height in pixels
      canvas.style.width = `${displayW}px`;
      canvas.style.height = `${displayH}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const renderTask = page.render({ canvasContext: ctx, viewport });
      activeRenderTasks.current[taskKey] = renderTask;
      await renderTask.promise;
      delete activeRenderTasks.current[taskKey];
    } catch (err) {
      if (err.name !== 'RenderingCancelledException') {
        console.error('PDF.js render error:', err);
      }
    }
  }, [pdfDoc]);

  // Draw pages whenever page/dimension changes (skip during flip animation)
  useEffect(() => {
    if (!pdfDoc || loading || animationState) return;
    if (isMobile) {
      drawPage(pageNumber, leftCanvasRef.current, 'left');
    } else {
      drawPage(pageNumber, leftCanvasRef.current, 'left');
      if (pageNumber + 1 <= numPages) {
        drawPage(pageNumber + 1, rightCanvasRef.current, 'right');
      } else {
        const c = rightCanvasRef.current;
        if (c) { const ctx = c.getContext('2d'); ctx.clearRect(0, 0, c.width, c.height); }
      }
    }
  }, [pdfDoc, pageNumber, isMobile, loading, animationState, drawPage, numPages, bookDimensions.width, bookDimensions.height]);

  // Helper to extract text from a page range for AI tasks
  const extractTextFromPages = async (start, end) => {
    if (!pdfDoc) return '';
    let combinedText = '';
    const startPage = Math.max(1, start);
    const endPage = Math.min(numPages, end);
    
    for (let p = startPage; p <= endPage; p++) {
      try {
        const page = await pdfDoc.getPage(p);
        const textContent = await page.getTextContent();
        const items = textContent.items.map(item => item.str);
        combinedText += `\n--- Page ${p} ---\n` + items.join(' ');
      } catch (err) {
        console.error(`Failed to extract text from page ${p}:`, err);
      }
    }
    return combinedText;
  };

  // Progress saver callback called incrementally by Timer and page changes
  const handleSaveProgress = async (additionalSeconds = 0) => {
    try {
      await authenticatedFetch(`${API_URL}/progress/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookId: id,
          currentPage: pageNumber,
          totalPages: numPages,
          studyTimeSeconds: additionalSeconds
        })
      });
    } catch (err) {
      console.error('Error saving reading progress:', err);
    }
  };


  // Next page — with 3D flip
  const handleNextPage = async () => {
    const isSingle = isMobile || viewMode === 'single';
    const step = isSingle ? 1 : 2;
    if (animationState || pageNumber + step > numPages) return;
    handleSaveProgress(0);

    if (zoom > 1.0) { 
      setPageNumber(p => p + step); 
      return; 
    }

    setAnimationState('flipping-next');
    setIsFlipped(false);

    if (isSingle) {
      const nextLeft = pageNumber + 1;
      await Promise.all([
        drawPage(nextLeft, leftCanvasRef.current, 'left'),
        drawPage(pageNumber, flipFrontCanvasRef.current, 'flipFront'),
        drawPage(nextLeft, flipBackCanvasRef.current, 'flipBack'),
      ]);
      requestAnimationFrame(() => { setTimeout(() => setIsFlipped(true), 30); });
      setTimeout(() => { setPageNumber(nextLeft); setAnimationState(null); setIsFlipped(false); }, 630);
    } else {
      const nextLeft = pageNumber + 2;
      const nextRight = pageNumber + 3;
      await Promise.all([
        drawPage(pageNumber, leftCanvasRef.current, 'left'),
        drawPage(nextRight <= numPages ? nextRight : null, rightCanvasRef.current, 'right'),
        drawPage(pageNumber + 1, flipFrontCanvasRef.current, 'flipFront'),
        drawPage(nextLeft, flipBackCanvasRef.current, 'flipBack'),
      ]);
      requestAnimationFrame(() => { setTimeout(() => setIsFlipped(true), 30); });
      setTimeout(() => { setPageNumber(nextLeft); setAnimationState(null); setIsFlipped(false); }, 630);
    }
  };

  // Prev page — with 3D flip
  const handlePrevPage = async () => {
    const isSingle = isMobile || viewMode === 'single';
    const step = isSingle ? 1 : 2;
    if (animationState || pageNumber <= 1) return;
    handleSaveProgress(0);

    if (zoom > 1.0) { 
      setPageNumber(p => Math.max(1, p - step)); 
      return; 
    }

    setAnimationState('flipping-prev');
    setIsFlipped(false);

    if (isSingle) {
      const prevLeft = pageNumber - 1;
      await Promise.all([
        drawPage(pageNumber, leftCanvasRef.current, 'left'),
        drawPage(prevLeft, flipFrontCanvasRef.current, 'flipFront'),
        drawPage(prevLeft, flipBackCanvasRef.current, 'flipBack'),
      ]);
      setIsFlipped(true);
      requestAnimationFrame(() => { setTimeout(() => setIsFlipped(false), 30); });
      setTimeout(() => { setPageNumber(prevLeft); setAnimationState(null); setIsFlipped(false); }, 630);
    } else {
      const prevLeft = pageNumber - 2;
      const prevRight = pageNumber - 1;
      await Promise.all([
        drawPage(prevLeft >= 1 ? prevLeft : null, leftCanvasRef.current, 'left'),
        drawPage(pageNumber + 1 <= numPages ? pageNumber + 1 : null, rightCanvasRef.current, 'right'),
        drawPage(pageNumber, flipFrontCanvasRef.current, 'flipFront'),
        drawPage(prevRight, flipBackCanvasRef.current, 'flipBack'),
      ]);
      setIsFlipped(true);
      requestAnimationFrame(() => { setTimeout(() => setIsFlipped(false), 30); });
      setTimeout(() => { setPageNumber(prevLeft >= 1 ? prevLeft : 1); setAnimationState(null); setIsFlipped(false); }, 630);
    }
  };

  // Jump to specific page (align to odd for two-page spread on desktop)
  const handlePageJump = (e) => {
    if (e.key === 'Enter') {
      const page = parseInt(e.target.value);
      if (page >= 1 && page <= numPages) {
        setPageNumber((isMobile || viewMode === 'single') ? page : (page % 2 === 0 ? page - 1 : page));
      }
      e.target.blur();
    }
  };

  // Toggle Bookmark
  const toggleBookmark = async (pageNum) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/bookmarks/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bookId: id, pageNumber: pageNum })
      });
      if (res.ok) {
        // Refetch bookmarks
        const bmRes = await authenticatedFetch(`${API_URL}/bookmarks/${id}`);
        if (bmRes.ok) setBookmarks(await bmRes.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save personal notes for the current page
  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bookId: id, pageNumber, noteText: currentPageNote })
      });
      if (res.ok) {
        // Refetch notes
        const notesRes = await authenticatedFetch(`${API_URL}/notes/${id}`);
        if (notesRes.ok) setNotes(await notesRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNote(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') handleNextPage();
      if (e.key === 'ArrowLeft') handlePrevPage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pdfDoc, pageNumber, animationState, isMobile]);

  // Swipe gesture touch handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].clientX;
    touchEndX.current = e.changedTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.changedTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 60) {
      handleNextPage();
    } else if (diff < -60) {
      handlePrevPage();
    }
  };

  // text highlights capture mouseup listener
  const handleMouseUpTextSelection = (e) => {
    const selection = window.getSelection();
    const selText = selection.toString().trim();
    if (selText.length > 3) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setSelectedText(selText);
      setSelectionBox({
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY - 45
      });
    } else {
      setSelectionBox(null);
    }
  };

  const clearSelection = () => {
    window.getSelection().removeAllRanges();
    setSelectionBox(null);
  };

  // Save Text Highlight to database
  const saveHighlight = async (color) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/highlights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookId: id,
          pageNumber,
          highlightedText: selectedText,
          color
        })
      });
      if (res.ok) {
        // Refetch highlights
        const hlRes = await authenticatedFetch(`${API_URL}/highlights/${id}`);
        if (hlRes.ok) setHighlights(await hlRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      clearSelection();
    }
  };

  // Delete highlight
  const deleteHighlight = async (hlId) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/highlights/${hlId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setHighlights(prev => prev.filter(h => h._id !== hlId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete note
  const deleteNote = async (noteId) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/notes/${noteId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setNotes(prev => prev.filter(n => n._id !== noteId));
        if (noteId === notes.find(n => n.pageNumber === pageNumber)?._id) {
          setCurrentPageNote('');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit doubt query to Google Gemini API
  const handleAskDoubtSubmit = async (e) => {
    e.preventDefault();
    if (!userDoubt.trim()) return;

    const doubtMsg = userDoubt.trim();
    setUserDoubt('');
    setDoubtHistory(prev => [...prev, { role: 'user', content: doubtMsg }]);
    setDoubtLoading(true);

    try {
      // Extract page text for real-time Gemini context
      const pageText = await extractTextFromPages(pageNumber, isMobile ? pageNumber : pageNumber + 1);

      const res = await authenticatedFetch(`${API_URL}/ai/ask-doubt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookTitle: book.title,
          subject: book.subject,
          pageNumber,
          pageContent: pageText,
          doubtHistory: doubtHistory.slice(-6), // Send last 3 turns
          userDoubt: doubtMsg
        })
      });

      if (!res.ok) throw new Error('Doubt solver currently unavailable');
      const data = await res.json();
      
      setDoubtHistory(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      setDoubtHistory(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${err.message}` }]);
    } finally {
      setDoubtLoading(false);
    }
  };

  // Get OpenAI GPT-4o Smart Summary
  const handleGetSummary = async () => {
    setShowSummaryModal(true);
    setSummaryLoading(true);
    setSummaryText('');

    try {
      // Extract text content within selected range
      const content = await extractTextFromPages(summaryRange.start, summaryRange.end);

      const res = await authenticatedFetch(`${API_URL}/ai/summarise`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookTitle: book.title,
          subject: book.subject,
          pageStart: summaryRange.start,
          pageEnd: summaryRange.end,
          contentText: content
        })
      });

      if (!res.ok) throw new Error('Smart summarizer currently unavailable');
      const data = await res.json();
      setSummaryText(data.summary);
    } catch (err) {
      setSummaryText(`⚠️ Error: ${err.message}. Please verify OpenAI connection credentials.`);
    } finally {
      setSummaryLoading(false);
    }
  };

  const isPageBookmarked = (pageNum) => bookmarks.some(b => b.pageNumber === pageNum);

  const TB_LOGO = 'https://testbook-trickbook.duckdns.org/_next/image?url=%2Flogos%2Ftestbook-icon.png&w=48&q=75';

  return (
    <div className="h-screen bg-slate-100 text-gray-800 flex flex-col overflow-hidden relative font-sans">

      {/* Selection Tooltip for Highlighting */}
      {selectionBox && (
        <div
          className="absolute z-[999] bg-white border border-gray-200 rounded-2xl px-3 py-2 flex items-center gap-2 shadow-xl animate-in fade-in zoom-in-95 duration-100"
          style={{ top: `${selectionBox.y}px`, left: `${selectionBox.x}px`, transform: 'translateX(-50%)' }}
        >
          <Highlighter className="w-3.5 h-3.5 text-zinc-400" />
          <div className="flex gap-1.5 border-r border-[#27272a] pr-2 mr-0.5">
            {['yellow', 'green', 'blue', 'pink'].map(color => (
              <button
                key={color}
                onClick={() => saveHighlight(color)}
                className={`w-5 h-5 rounded-full hover:scale-110 active:scale-95 transition-all cursor-pointer ${
                  color === 'yellow' ? 'bg-amber-400' :
                  color === 'green' ? 'bg-emerald-400' :
                  color === 'blue' ? 'bg-blue-400' : 'bg-pink-400'
                }`}
                title={`Highlight ${color}`}
              />
            ))}
          </div>
          <button 
            onClick={clearSelection} 
            className="text-[10px] text-zinc-500 hover:text-zinc-300 font-semibold"
          >
            Cancel
          </button>
        </div>
      )}

      {/* TOP HEADER CONTROLS */}
      <header className="border-b border-orange-100 bg-white/90 backdrop-blur-md py-3 px-6 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 border border-gray-200 hover:border-orange-300 hover:bg-orange-50 rounded-xl text-gray-500 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <img src={TB_LOGO} alt="Testbook" className="w-7 h-7 rounded-lg hidden sm:block" onError={e => { e.target.style.display='none'; }} />
          <div>
            <h1 className="font-bold text-sm text-gray-800 max-w-xs sm:max-w-md line-clamp-1">
              {book ? book.title : 'Loading Book...'}
            </h1>
            <p className="text-[10px] text-orange-500 uppercase tracking-widest font-bold mt-0.5">
              {book ? book.subject : 'Subject'}
            </p>
          </div>
        </div>

        {/* Zoom & Page Layout Controls */}
        {book && (
          <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1">
            <button
              onClick={() => setZoom(z => Math.max(1.0, z - 0.25))}
              disabled={zoom <= 1.0}
              className="p-1 text-gray-500 hover:text-orange-500 hover:bg-white rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-gray-600 min-w-[36px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(z => Math.min(2.5, z + 0.25))}
              disabled={zoom >= 2.5}
              className="p-1 text-gray-500 hover:text-orange-500 hover:bg-white rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-gray-200 mx-1" />

            <button
              onClick={() => {
                setViewMode(viewMode === 'double' ? 'single' : 'double');
                setZoom(1.0); // Reset zoom on layout toggle
              }}
              className={`p-1.5 text-gray-500 hover:text-orange-500 hover:bg-white rounded-lg transition-all flex items-center gap-1.5 text-[11px] font-bold cursor-pointer ${
                viewMode === 'single' ? 'bg-orange-50 border-orange-200 text-orange-600' : ''
              }`}
              title={viewMode === 'double' ? "Switch to Single Page View" : "Switch to Double Page View"}
            >
              <BookOpen className="w-4 h-4" />
              <span>{viewMode === 'double' ? '2-Page' : '1-Page'}</span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          {book && (
            <button
              onClick={() => {
                setSummaryRange({ start: pageNumber, end: Math.min(pageNumber + 2, numPages) });
                setShowSummaryModal(true);
              }}
              className="px-3.5 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Summarise</span>
            </button>
          )}

          <button
            onClick={() => setActivePanel(activePanel === 'annotations' ? null : 'annotations')}
            className={`p-2 border rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              activePanel === 'annotations'
                ? 'bg-orange-500 border-orange-500 text-white'
                : 'bg-white border-gray-200 hover:border-orange-300 text-gray-600'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Notes & Marks</span>
          </button>

          <button
            onClick={() => setActivePanel(activePanel === 'doubts' ? null : 'doubts')}
            className={`p-2 border rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              activePanel === 'doubts'
                ? 'bg-orange-500 border-orange-500 text-white'
                : 'bg-white border-gray-200 hover:border-orange-300 text-gray-600'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Ask Doubt</span>
          </button>
        </div>
      </header>

      {/* CORE VIEWPORT BODY SPLIT */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* CENTER PDF READER */}
        <div className="flex-1 flex flex-col items-center overflow-hidden bg-slate-100" onMouseUp={handleMouseUpTextSelection}
          style={{ gap: 0 }}>
             {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin" />
              <p className="text-gray-400 text-xs mt-3 font-medium">Loading book pages...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
              <p className="text-red-500 text-sm font-semibold">{error}</p>
              <Link to="/" className="text-xs text-orange-500 underline mt-2 font-medium">Return to library</Link>
            </div>
          ) : (
            /* Two-page book spread (single on mobile) — fills all available space */
            <div
              className={`flex-1 w-full relative ${zoom === 1.0 ? 'overflow-hidden flex items-center justify-center' : 'overflow-auto'}`}
              style={{ padding: isMobile ? '8px' : '12px 48px' }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Prev arrow */}
              <button
                onClick={handlePrevPage}
                disabled={pageNumber <= 1 || !!animationState}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white border border-gray-200 hover:border-orange-400 hover:text-orange-500 rounded-full flex items-center justify-center text-gray-400 shadow-md disabled:opacity-20 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Book spread */}
              <div 
                ref={containerRef} 
                className={`book-perspective w-full h-full ${zoom === 1.0 ? 'flex items-center justify-center' : 'flex p-4 justify-start items-start'}`}
              >
                <div 
                  className="book-viewport"
                  style={zoom > 1.0 ? { display: 'flex', width: 'auto', height: 'auto', transformStyle: 'preserve-3d', margin: 'auto' } : {}}
                >
                  <div 
                    className={`book-wrapper ${(isMobile || viewMode === 'single') ? 'single-page-mode' : ''}`}
                    style={bookDimensions.width ? { width: `${bookDimensions.width}px`, height: `${bookDimensions.height}px` } : {}}
                  >

                    {!isMobile && viewMode === 'double' && <div className="book-spine-shadow" />}

                    {/* LEFT PAGE */}
                    <div 
                      className="book-page-half left-page relative select-text"
                      style={(isMobile || viewMode === 'single') ? { width: '100%', borderRadius: '12px' } : {}}
                    >
                      {isPageBookmarked(pageNumber) && (
                        <div className="absolute top-0 right-3 z-20 text-orange-500">
                          <BookmarkCheck className="w-7 h-9 fill-current" />
                        </div>
                      )}
                      <div className="w-full h-full flex items-center justify-center" style={{ padding: isMobile ? '6px' : '8px' }}>
                        <canvas ref={leftCanvasRef} className="pointer-events-none" style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }} />
                      </div>
                      <div className="absolute bottom-1.5 left-3 text-[9px] text-gray-400 font-bold uppercase tracking-wider select-none">
                        Page {pageNumber}
                      </div>
                      <button onClick={() => toggleBookmark(pageNumber)} className="absolute top-2 left-3 text-gray-300 hover:text-orange-500 cursor-pointer transition-colors">
                        <Bookmark className={`w-4 h-4 ${isPageBookmarked(pageNumber) ? 'fill-orange-500 text-orange-500' : ''}`} />
                      </button>
                    </div>

                    {/* RIGHT PAGE — desktop only */}
                    {!isMobile && viewMode === 'double' && (
                      <div className="book-page-half right-page relative select-text">
                        {pageNumber + 1 <= numPages ? (
                          <>
                            {isPageBookmarked(pageNumber + 1) && (
                              <div className="absolute top-0 right-3 z-20 text-orange-500">
                                <BookmarkCheck className="w-7 h-9 fill-current" />
                              </div>
                            )}
                            <div className="w-full h-full flex items-center justify-center" style={{ padding: '8px' }}>
                              <canvas ref={rightCanvasRef} className="pointer-events-none" style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }} />
                            </div>
                            <div className="absolute bottom-1.5 right-3 text-[9px] text-gray-400 font-bold uppercase tracking-wider select-none">
                              Page {pageNumber + 1}
                            </div>
                            <button onClick={() => toggleBookmark(pageNumber + 1)} className="absolute top-2 right-3 text-gray-300 hover:text-orange-500 cursor-pointer transition-colors">
                              <Bookmark className={`w-4 h-4 ${isPageBookmarked(pageNumber + 1) ? 'fill-orange-500 text-orange-500' : ''}`} />
                            </button>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-200 text-sm italic">End of book</div>
                        )}
                      </div>
                    )}

                    {/* 3D FLIP SHEET */}
                    {animationState && (
                      <div className={`flipping-sheet ${animationState === 'flipping-next' ? 'right-to-left' : 'left-to-right'} ${isFlipped ? (animationState === 'flipping-next' ? 'flipped-rtl' : 'flipped-ltr') : ''}`}>
                        <div className="page-face face-front flex items-center justify-center" style={{ padding: '8px' }}>
                          <canvas ref={flipFrontCanvasRef} className="pointer-events-none" style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }} />
                        </div>
                        <div className="page-face face-back flex items-center justify-center" style={{ padding: '8px' }}>
                          <canvas ref={flipBackCanvasRef} className="pointer-events-none" style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }} />
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>

              {/* Next arrow */}
              <button
                onClick={handleNextPage}
                disabled={pageNumber + (isMobile ? 1 : 2) > numPages || !!animationState}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white border border-gray-200 hover:border-orange-400 hover:text-orange-500 rounded-full flex items-center justify-center text-gray-400 shadow-md disabled:opacity-20 transition-all cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* READER BOTTOM NAVIGATION */}
          {book && (
            <div className="w-full max-w-md flex flex-col items-center gap-2 py-3 px-4 shrink-0 select-none border-t border-slate-200 bg-slate-100">
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePrevPage}
                  disabled={pageNumber <= 1}
                  className="p-2.5 bg-white border border-gray-200 hover:border-orange-400 disabled:opacity-30 rounded-xl text-gray-500 transition-all cursor-pointer shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
                  <span>Page</span>
                  <input
                    type="number"
                    min="1"
                    max={numPages}
                    className="w-12 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 text-center text-gray-800 focus:outline-none focus:border-orange-400 font-bold"
                    defaultValue={pageNumber}
                    key={pageNumber}
                    onKeyDown={handlePageJump}
                  />
                  <span>of {numPages}</span>
                </div>

                <button
                  onClick={handleNextPage}
                  disabled={pageNumber >= numPages}
                  className="p-2.5 bg-white border border-gray-200 hover:border-orange-400 disabled:opacity-30 rounded-xl text-gray-500 transition-all cursor-pointer shadow-sm"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="w-full flex items-center gap-3">
                <div className="flex-1 h-2 bg-white rounded-full overflow-hidden shadow-inner border border-gray-200">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(pageNumber / numPages) * 100}%`,
                      background: 'linear-gradient(90deg, #f97316, #ef4444)'
                    }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 font-bold">
                  {Math.round((pageNumber / numPages) * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDE DRAWER PANEL */}
        {activePanel && (
          <div className="w-96 bg-white border-l border-gray-100 flex flex-col shrink-0 animate-in slide-in-from-right duration-200 z-50 shadow-lg">

            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <span className="font-black text-sm text-gray-800">
                {activePanel === 'annotations' ? 'Notes & Annotations' : 'AI Doubt Solver'}
              </span>
              <button
                onClick={() => setActivePanel(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ANNOTATIONS PANEL */}
            {activePanel === 'annotations' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-orange-500 font-black uppercase tracking-wider">Page {pageNumber} Notes</span>
                    {currentPageNote.trim() && (
                      <button
                        onClick={handleSaveNote}
                        disabled={savingNote}
                        className="text-[10px] bg-orange-500 text-white px-2.5 py-1 rounded-lg cursor-pointer transition-all hover:bg-orange-600 font-bold"
                      >
                        {savingNote ? 'Saving...' : 'Save Note'}
                      </button>
                    )}
                  </div>
                  <textarea
                    rows="4"
                    placeholder="Jot down notes or formulas for this page..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-700 placeholder-gray-400 font-serif-book focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none"
                    value={currentPageNote}
                    onChange={(e) => setCurrentPageNote(e.target.value)}
                  />
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Highlights ({highlights.length})</h3>
                    {highlights.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Select text on the page to highlight it.</p>
                    ) : (
                      <div className="space-y-2">
                        {highlights.map(hl => (
                          <div key={hl._id} className="p-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs space-y-2 group">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-bold">pg {hl.pageNumber}</span>
                              <button onClick={() => deleteHighlight(hl._id)} className="text-red-400 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity hover:underline">Delete</button>
                            </div>
                            <blockquote className={`pl-2 border-l-2 text-gray-600 italic font-serif-book ${
                              hl.color === 'yellow' ? 'border-amber-400' :
                              hl.color === 'green' ? 'border-emerald-400' :
                              hl.color === 'blue' ? 'border-blue-400' : 'border-pink-400'
                            }`}>"{hl.highlightedText}"</blockquote>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Page Notes ({notes.length})</h3>
                    {notes.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No notes yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {notes.map(note => (
                          <div key={note._id} className="p-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs space-y-2 group">
                            <div className="flex justify-between items-center">
                              <button
                                onClick={() => setPageNumber(note.pageNumber)}
                                className="text-[10px] bg-orange-100 text-orange-600 hover:underline px-1.5 py-0.5 rounded-full font-bold"
                              >
                                Page {note.pageNumber}
                              </button>
                              <button onClick={() => deleteNote(note._id)} className="text-red-400 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity hover:underline">Delete</button>
                            </div>
                            <p className="text-gray-600 font-serif-book whitespace-pre-line">{note.noteText}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* DOUBT CHAT PANEL */}
            {activePanel === 'doubts' && (
              <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {doubtHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
                        <MessageSquare className="w-7 h-7 text-white" />
                      </div>
                      <h4 className="font-black text-sm text-gray-700">Ask Testbook Guru</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Type any doubt about this topic. Testbook Guru reads the current page text to give contextual answers!
                      </p>
                    </div>
                  ) : (
                    doubtHistory.map((msg, i) => (
                      <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <span className="text-[9px] text-gray-400 mb-1 font-bold uppercase tracking-wider">
                          {msg.role === 'user' ? 'You' : 'Testbook Guru'}
                        </span>
                        <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs whitespace-pre-line leading-relaxed ${
                          msg.role === 'user'
                            ? 'text-white rounded-tr-none shadow-sm'
                            : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none font-serif-book shadow-sm'
                        }`}
                          style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #f97316, #ef4444)' } : {}}>
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}
                  {doubtLoading && (
                    <div className="flex flex-col items-start w-full">
                      <span className="text-[9px] text-gray-400 mb-1 font-bold uppercase tracking-wider">Testbook Guru</span>
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none p-3.5 flex flex-col items-start gap-3 shadow-sm max-w-[85%]">
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <div className="text-[10px] text-gray-500 font-medium italic border-l-2 border-orange-300 pl-2">
                          {MARKETING_TEXTS[doubtHistory.length % MARKETING_TEXTS.length]}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleAskDoubtSubmit} className="p-3 border-t border-gray-100 bg-white flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Ask a doubt about this page..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    value={userDoubt}
                    onChange={(e) => setUserDoubt(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={doubtLoading || !userDoubt.trim()}
                    className="p-2.5 text-white disabled:opacity-40 rounded-xl transition-all cursor-pointer shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)' }}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

      </div>

      {/* FLOAT TIMERS STOPWATCH/GOALS */}
      {book && (
        <Timer 
          bookId={id} 
          currentPage={pageNumber} 
          totalPages={numPages} 
          onSaveProgress={handleSaveProgress} 
        />
      )}

      {/* OPENAI SMART SUMMARY MODAL */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-100 max-w-2xl w-full flex flex-col max-h-[85vh] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-black text-gray-800 text-sm">Smart Summary (GPT-4o)</h3>
              </div>
              <button onClick={() => setShowSummaryModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-orange-50 border-b border-orange-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs text-gray-600 font-semibold">
                <span>Pages:</span>
                <input type="number" min="1" max={numPages}
                  className="w-14 bg-white border border-gray-200 px-2 py-1 rounded-lg text-center text-gray-800 font-bold focus:outline-none focus:border-orange-400"
                  value={summaryRange.start}
                  onChange={e => setSummaryRange({ ...summaryRange, start: Math.max(1, parseInt(e.target.value) || 1) })}
                />
                <span>to</span>
                <input type="number" min={summaryRange.start} max={numPages}
                  className="w-14 bg-white border border-gray-200 px-2 py-1 rounded-lg text-center text-gray-800 font-bold focus:outline-none focus:border-orange-400"
                  value={summaryRange.end}
                  onChange={e => setSummaryRange({ ...summaryRange, end: Math.min(numPages, Math.max(summaryRange.start, parseInt(e.target.value) || numPages)) })}
                />
              </div>
              <button onClick={handleGetSummary} disabled={summaryLoading}
                className="px-4 py-2 text-white text-xs font-bold rounded-xl cursor-pointer transition-all disabled:opacity-50 shadow-sm"
                style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)' }}>
                {summaryLoading ? 'Generating...' : 'Summarise Pages'}
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-amber-50/20">
              {summaryLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin" />
                  <p className="text-gray-400 text-xs">Summarising pages {summaryRange.start}–{summaryRange.end}...</p>
                </div>
              ) : summaryText ? (
                <div className="prose prose-xs text-gray-700 font-serif-book leading-relaxed whitespace-pre-line">
                  {summaryText}
                </div>
              ) : (
                <div className="text-center py-20 text-gray-400 text-xs italic">
                  Select a page range above and click "Summarise Pages" to generate key concepts.
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-white flex justify-end shrink-0">
              <button onClick={() => setShowSummaryModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-xl">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
