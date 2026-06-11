import fs from 'fs';

let content = fs.readFileSync('client/src/components/Reader.jsx', 'utf8');

const importsReplacement = `import HTMLFlipBook from 'react-pageflip';
import { Volume2, VolumeX } from 'lucide-react';

const playPageTurnSound = (isMuted) => {
  if (isMuted) return;
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const bufferSize = audioCtx.sampleRate * 0.12;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.03));
    }
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 600;
    filter.Q.value = 1.0;
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.5;
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    source.start();
  } catch (err) {}
};

const Page = React.forwardRef((props, ref) => {
  return (
    <div className="page bg-white shadow-[0_0_5px_rgba(0,0,0,0.1)] overflow-hidden flex items-center justify-center relative select-text" ref={ref} data-density="soft">
      {props.children}
    </div>
  );
});

const PdfPageRenderer = ({ pdf, pageNum, zoom, isBookmarked, toggleBookmark }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!pdf || !canvasRef.current) return;
    let renderTask;
    let isMounted = true;
    const renderPage = async () => {
      try {
        const page = await pdf.getPage(pageNum);
        const unscaled = page.getViewport({ scale: 1.0 });
        const dpr = window.devicePixelRatio || 1;
        const parent = canvasRef.current.parentElement;
        const displayW = parent.clientWidth;
        const baseScale = displayW / unscaled.width;
        const renderScale = baseScale * dpr * 2.0;
        const viewport = page.getViewport({ scale: renderScale });
        const canvas = canvasRef.current;
        if (!canvas || !isMounted) return;
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        const ctx = canvas.getContext('2d');
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        renderTask = page.render({ canvasContext: ctx, viewport });
        await renderTask.promise;
      } catch (err) {}
    };
    renderPage();
    return () => {
      isMounted = false;
      if (renderTask) renderTask.cancel();
    };
  }, [pdf, pageNum, zoom]);

  return (
    <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-white">
      <canvas ref={canvasRef} className="pointer-events-none origin-center" style={{ display: 'block', objectFit: 'cover', transform: \`scale(\${1.12 * zoom})\` }} />
      <div className="absolute bottom-1.5 right-3 text-[9px] text-gray-400 font-bold uppercase tracking-wider select-none z-10">
        Page {pageNum}
      </div>
      <button 
        onClick={(e) => { e.stopPropagation(); toggleBookmark(); }} 
        className="absolute top-1/2 right-3 -translate-y-1/2 z-20 p-2 bg-white/80 backdrop-blur-sm rounded-full border border-gray-100 shadow-sm text-gray-300 hover:text-orange-500 hover:scale-110 cursor-pointer transition-all pointer-events-auto"
        title="Bookmark this page"
      >
        <Bookmark className={\`w-4 h-4 \${isBookmarked ? 'fill-orange-500 text-orange-500' : ''}\`} />
      </button>
    </div>
  );
};
`;

content = content.replace(
  "import ReactMarkdown from 'react-markdown';",
  "import ReactMarkdown from 'react-markdown';\n" + importsReplacement
);

content = content.replace(
  "const [animationState, setAnimationState] = useState(null); // 'flipping-next' or 'flipping-prev'",
  "const [isSoundMuted, setIsSoundMuted] = useState(false);\n  const flipBookRef = useRef(null);"
);
content = content.replace(
  "const [isFlipped, setIsFlipped] = useState(false); // Triggers CSS rotate transition\n",
  ""
);

content = content.replace("const leftCanvasRef = useRef(null);\n", "");
content = content.replace("  const rightCanvasRef = useRef(null);\n", "");
content = content.replace("  const flipFrontCanvasRef = useRef(null);\n", "");
content = content.replace("  const flipBackCanvasRef = useRef(null);\n", "");
content = content.replace("  const activeRenderTasks = useRef({});\n", "");

content = content.replace(
  /const handleNextPage = \(\) => \{[\s\S]*?\};\n/g,
  `const handleNextPage = () => {
    if (flipBookRef.current) flipBookRef.current.pageFlip().flipNext();
  };\n`
);
content = content.replace(
  /const handlePrevPage = \(\) => \{[\s\S]*?\};\n/g,
  `const handlePrevPage = () => {
    if (flipBookRef.current) flipBookRef.current.pageFlip().flipPrev();
  };\n`
);

content = content.replace(/  \/\/ Helper to cancel ongoing render tasks[\s\S]*?delete activeRenderTasks\.current\[key\];\n    \}\n  \};\n/g, "");
content = content.replace(/  \/\/ Main rendering routine for a page onto a canvas[\s\S]*?\}, \[pdfDoc\]\);\n/g, "");

content = content.replace(/  \/\/ Draw pages whenever page\/dimension changes[\s\S]*?\}, \[pdfDoc, pageNumber[\s\S]*?\]\);\n/g, "");

content = content.replace(
  /  useEffect\(\(\) => \{[\s\S]*?const observer = new ResizeObserver[\s\S]*?return \(\) => \{[\s\S]*?observer.disconnect\(\);\n    \};\n  \}, \[pdfDoc, pageAspect, isMobile, loading, animationState, viewMode, zoom\]\);\n/g,
  `  useEffect(() => {
    if (!pdfDoc) return;
    pdfDoc.getPage(1).then(page => {
      const viewport = page.getViewport({ scale: 1.0 });
      setBookDimensions({ width: Math.floor(viewport.width), height: Math.floor(viewport.height) });
    });
  }, [pdfDoc]);\n`
);

const bookViewportReplacement = `              {/* Book spread */}
              <div 
                ref={containerRef} 
                className="w-full h-full flex items-center justify-center p-4 relative"
              >
                {bookDimensions.width > 0 && (
                  <HTMLFlipBook 
                    width={bookDimensions.width} 
                    height={bookDimensions.height} 
                    size="stretch"
                    minWidth={315}
                    maxWidth={1000}
                    minHeight={400}
                    maxHeight={1533}
                    maxShadowOpacity={0.5}
                    showCover={false}
                    mobileScrollSupport={true}
                    usePortrait={isMobile || viewMode === 'single'}
                    onFlip={(e) => {
                      setPageNumber(e.data + 1);
                      playPageTurnSound(isSoundMuted);
                      handleSaveProgress();
                    }}
                    ref={flipBookRef}
                    className="book-viewport drop-shadow-2xl"
                  >
                    {Array.from({ length: numPages }).map((_, i) => {
                      const pageIdx = i + 1;
                      const shouldRender = Math.abs(pageIdx - pageNumber) <= 4;
                      return (
                        <Page key={i}>
                          {shouldRender ? (
                            <PdfPageRenderer 
                              pdf={pdfDoc} 
                              pageNum={pageIdx} 
                              zoom={zoom} 
                              isBookmarked={isPageBookmarked(pageIdx)} 
                              toggleBookmark={() => toggleBookmark(pageIdx)} 
                            />
                          ) : (
                            <div className="w-full h-full bg-white flex items-center justify-center text-gray-300">...</div>
                          )}
                        </Page>
                      );
                    })}
                  </HTMLFlipBook>
                )}
              </div>`;

content = content.replace(
  /              \{\/\* Book spread \*\/\}[\s\S]*?\{\/\* Next arrow \*\/\}/,
  bookViewportReplacement + "\n\n              {/* Next arrow */}"
);

const soundToggle = `
            <button
              onClick={() => setIsSoundMuted(!isSoundMuted)}
              className="w-11 h-11 bg-white/90 backdrop-blur border border-gray-200 hover:border-orange-300 text-gray-600 hover:bg-white rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-md pointer-events-auto"
              title={isSoundMuted ? "Unmute Page Flip" : "Mute Page Flip"}
            >
              {isSoundMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
`;

content = content.replace(
  /<MessageSquare className="w-5 h-5" \/>\n            <\/button>/,
  `<MessageSquare className="w-5 h-5" />\n            </button>\n${soundToggle}`
);

fs.writeFileSync('client/src/components/Reader.jsx', content);
console.log('Refactoring successfully applied.');
