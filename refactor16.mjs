import fs from 'fs';

let content = fs.readFileSync('client/src/components/Reader.jsx', 'utf8');

// Header
content = content.replace(
  /<header className="border-b border-orange-100 bg-white\/90 backdrop-blur-md py-3 px-6 flex items-center justify-between shrink-0 shadow-sm">/,
  '<header className="hidden">'
);

// Footer
content = content.replace(
  /<div className="w-full max-w-md flex flex-col items-center gap-2 py-3 px-4 shrink-0 select-none border-t border-slate-200 bg-slate-100">/,
  '<div className="hidden">'
);

// Container padding
content = content.replace(
  /style=\{\{ padding: isMobile \? '8px' : '12px 48px' \}\}/g,
  "style={{ padding: 0 }}"
);

// Background
content = content.replace(
  /className="flex-1 flex flex-col items-center overflow-hidden bg-slate-100"/,
  'className="flex-1 flex flex-col items-center overflow-hidden bg-[#e0e0e0]"'
);

// Gap
content = content.replace(
  /style=\{\{ gap: isMobile \? 12 : 24 \}\}/,
  "style={{ gap: 0 }}"
);

// Scale
content = content.replace(
  /<canvas ref=\{([^}]+)\} className="pointer-events-none" style=\{\{ display: 'block', maxWidth: '100%', maxHeight: '100%' \}\}\s*\/>/g,
  '<canvas ref={$1} className="pointer-events-none" style={{ display: \'block\', width: \'100%\', height: \'100%\', transform: \'scale(1.06)\', transformOrigin: \'center center\' }} />'
);

// Overflow hidden
content = content.replace(
  /style=\{\{ padding: isMobile \? '6px' : '8px' \}\}/g,
  "style={{ overflow: 'hidden' }}"
);
content = content.replace(
  /style=\{\{ padding: '8px' \}\}/g,
  "style={{ overflow: 'hidden' }}"
);

// Chevrons (only replace if they are still visible)
content = content.replace(
  /<button\s+onClick=\{handlePrevPage\}\s+disabled=\{pageNumber <= 1 \|\| !!animationState\}\s+className="absolute left-\[-24px\] lg:left-\[-48px\] top-1\/2 -translate-y-1\/2 z-20 w-9 h-9 bg-white border border-gray-200 hover:border-orange-400 hover:text-orange-500 rounded-full flex items-center justify-center text-gray-400 shadow-md disabled:opacity-20 transition-all cursor-pointer"\s+>\s+<ChevronLeft className="w-5 h-5" \/>\s+<\/button>/,
  '<button onClick={handlePrevPage} disabled={pageNumber <= 1 || !!animationState} className="absolute left-0 top-0 w-[15%] h-full z-20 cursor-pointer opacity-0" />'
);

content = content.replace(
  /<button\s+onClick=\{handleNextPage\}\s+disabled=\{pageNumber \+ \(isMobile \? 1 : 2\) > numPages \|\| !!animationState\}\s+className="absolute right-\[-24px\] lg:right-\[-48px\] top-1\/2 -translate-y-1\/2 z-20 w-9 h-9 bg-white border border-gray-200 hover:border-orange-400 hover:text-orange-500 rounded-full flex items-center justify-center text-gray-400 shadow-md disabled:opacity-20 transition-all cursor-pointer"\s+>\s+<ChevronRight className="w-5 h-5" \/>\s+<\/button>/,
  '<button onClick={handleNextPage} disabled={pageNumber + (isMobile ? 1 : 2) > numPages || !!animationState} className="absolute right-0 top-0 w-[15%] h-full z-20 cursor-pointer opacity-0" />'
);

// Note: If chevrons were different in HEAD, let's just make sure they match
content = content.replace(
  /<button\s+onClick=\{handlePrevPage\}\s+disabled=\{pageNumber <= 1 \|\| !!animationState\}\s+className="absolute left-2 top-1\/2 -translate-y-1\/2 z-20 w-9 h-9 bg-white border border-gray-200 hover:border-orange-400 hover:text-orange-500 rounded-full flex items-center justify-center text-gray-400 shadow-md disabled:opacity-20 transition-all cursor-pointer"\s+>\s+<ChevronLeft className="w-5 h-5" \/>\s+<\/button>/,
  '<button onClick={handlePrevPage} disabled={pageNumber <= 1 || !!animationState} className="absolute left-0 top-0 w-[15%] h-full z-20 cursor-pointer opacity-0" />'
);

content = content.replace(
  /<button\s+onClick=\{handleNextPage\}\s+disabled=\{pageNumber \+ \(isMobile \? 1 : 2\) > numPages \|\| !!animationState\}\s+className="absolute right-2 top-1\/2 -translate-y-1\/2 z-20 w-9 h-9 bg-white border border-gray-200 hover:border-orange-400 hover:text-orange-500 rounded-full flex items-center justify-center text-gray-400 shadow-md disabled:opacity-20 transition-all cursor-pointer"\s+>\s+<ChevronRight className="w-5 h-5" \/>\s+<\/button>/,
  '<button onClick={handleNextPage} disabled={pageNumber + (isMobile ? 1 : 2) > numPages || !!animationState} className="absolute right-0 top-0 w-[15%] h-full z-20 cursor-pointer opacity-0" />'
);

// Imports
content = content.replace(
  /ZoomIn, ZoomOut, BookOpen/,
  'ZoomIn, ZoomOut, BookOpen, Maximize, Minimize'
);

// State
content = content.replace(
  /const \[zoom, setZoom\] = useState\(1\.0\); \/\/ 1\.0, 1\.25, 1\.5, 1\.75, 2\.0, 2\.25, 2\.5/,
  "const [zoom, setZoom] = useState(1.0);\n  const [isFullscreen, setIsFullscreen] = useState(false);"
);

// Effect
content = content.replace(
  /const handleResize = \(\) => setIsMobile\(window\.innerWidth <= 768\);\n\s*window\.addEventListener\('resize', handleResize\);\n\s*return \(\) => window\.removeEventListener\('resize', handleResize\);/,
  `const handleResize = () => setIsMobile(window.innerWidth <= 768);
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    
    window.addEventListener('resize', handleResize);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };`
);

// Buttons and double-click
const buttonsUI = `
              {/* TOP LEFT ACTION BUTTONS */}
              <div className="absolute top-4 left-6 z-[60] flex flex-col sm:flex-row items-center gap-2 pointer-events-auto">
                <div className="flex bg-white/90 backdrop-blur-md border border-gray-200 rounded-full shadow-md overflow-hidden">
                  <button onClick={() => setZoom(z => Math.max(1.0, z - 0.25))} className="p-2 text-gray-600 hover:bg-gray-50 hover:text-orange-500 transition-colors cursor-pointer" title="Zoom Out">
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <div className="w-px bg-gray-200 my-1"></div>
                  <button onClick={() => setZoom(z => Math.min(3.0, z + 0.25))} className="p-2 text-gray-600 hover:bg-gray-50 hover:text-orange-500 transition-colors cursor-pointer" title="Zoom In">
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <div className="w-px bg-gray-200 my-1"></div>
                  <button onClick={() => { setViewMode(viewMode === 'double' ? 'single' : 'double'); setZoom(1.0); }} className="px-3 py-2 text-gray-600 hover:bg-gray-50 hover:text-orange-500 transition-colors font-bold text-xs flex items-center gap-1.5 cursor-pointer" title="Toggle Layout">
                    <BookOpen className="w-4 h-4" />
                    {viewMode === 'double' ? '2-Page' : '1-Page'}
                  </button>
                  <div className="w-px bg-gray-200 my-1"></div>
                  <button onClick={() => {
                    if (!document.fullscreenElement) {
                      document.documentElement.requestFullscreen().catch(err => console.log(err));
                    } else {
                      if (document.exitFullscreen) {
                        document.exitFullscreen();
                      }
                    }
                  }} className="px-3 py-2 text-gray-600 hover:bg-gray-50 hover:text-orange-500 transition-colors font-bold text-xs flex items-center gap-1.5 cursor-pointer" title="Toggle Fullscreen">
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    {isFullscreen ? 'Exit' : 'Full-View'}
                  </button>
                </div>
              </div>

              {/* TOP RIGHT ACTION BUTTONS */}
              <div className="absolute top-4 right-6 z-[60] flex flex-col sm:flex-row items-center gap-2 pointer-events-auto">
                <button onClick={() => { setSummaryRange({ start: pageNumber, end: Math.min(pageNumber + 2, numPages) }); setShowSummaryModal(true); }} className="p-2 bg-white/90 backdrop-blur-md border border-gray-200 text-orange-500 rounded-full shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer" title="Summarise Pages">
                  <Sparkles className="w-4 h-4" />
                </button>
                <button onClick={() => setActivePanel(activePanel === 'annotations' ? null : 'annotations')} className="p-2 bg-white/90 backdrop-blur-md border border-gray-200 text-gray-600 rounded-full shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer hover:text-orange-500" title="Notes & Marks">
                  <FileText className="w-4 h-4" />
                </button>
                <button onClick={() => setActivePanel(activePanel === 'doubts' ? null : 'doubts')} className="p-2 bg-white/90 backdrop-blur-md border border-gray-200 text-gray-600 rounded-full shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer hover:text-orange-500" title="Ask Doubt">
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>`;

content = content.replace(
  /(<div\s+className=\{\`flex-1 w-full relative \$\{zoom === 1\.0 \? 'overflow-hidden flex items-center justify-center' : 'overflow-auto'\}\`\}\s+style=\{\{ padding: 0 \}\}\s+onTouchStart=\{handleTouchStart\}\s+onTouchMove=\{handleTouchMove\}\s+onTouchEnd=\{handleTouchEnd\}\s+)(>)/,
  `$1\nonDoubleClick={(e) => { e.preventDefault(); setZoom(z => z > 1.0 ? 1.0 : 2.0); }}\n$2\n${buttonsUI}`
);

fs.writeFileSync('client/src/components/Reader.jsx', content);
console.log("Refactoring 16 done");
