import fs from 'fs';

let content = fs.readFileSync('client/src/components/Reader.jsx', 'utf8');

// 1. Hide Top Header
content = content.replace(
  '<header className="border-b border-orange-100 bg-white/90 backdrop-blur-md py-3 px-6 flex items-center justify-between shrink-0 shadow-sm">',
  '<header className="hidden">'
);

// 2. Hide Bottom Footer
content = content.replace(
  '<div className="w-full max-w-md flex flex-col items-center gap-2 py-3 px-4 shrink-0 select-none border-t border-slate-200 bg-slate-100">',
  '<div className="hidden">'
);

// 3. Canvas 1: Left Page
content = content.replace(
  '<div className="w-full h-full flex items-center justify-center" style={{ padding: isMobile ? \'6px\' : \'8px\' }}>\n                        <canvas ref={leftCanvasRef} className="pointer-events-none" style={{ display: \'block\', maxWidth: \'100%\', maxHeight: \'100%\' }} />\n                      </div>',
  '<div className="w-full h-full flex items-center justify-center" style={{ overflow: \'hidden\' }}>\n                        <canvas ref={leftCanvasRef} className="pointer-events-none" style={{ display: \'block\', width: \'100%\', height: \'100%\', transform: \'scale(1.12)\' }} />\n                      </div>'
);

// 4. Canvas 2: Right Page
content = content.replace(
  '<div className="w-full h-full flex items-center justify-center" style={{ padding: \'8px\' }}>\n                              <canvas ref={rightCanvasRef} className="pointer-events-none" style={{ display: \'block\', maxWidth: \'100%\', maxHeight: \'100%\' }} />\n                            </div>',
  '<div className="w-full h-full flex items-center justify-center" style={{ overflow: \'hidden\' }}>\n                              <canvas ref={rightCanvasRef} className="pointer-events-none" style={{ display: \'block\', width: \'100%\', height: \'100%\', transform: \'scale(1.12)\' }} />\n                            </div>'
);

// 5. Container Padding
content = content.replace(
  "style={{ padding: isMobile ? '8px' : '12px 48px' }}",
  "style={{ padding: 0 }}"
);

// 6. Background Gap
content = content.replace(
  "style={{ gap: isMobile ? 12 : 24 }}",
  "style={{ gap: 0 }}"
);

// 7. Book Wrapper
content = content.replace(
  'className="book-wrapper shadow-2xl relative flex"',
  'className="book-wrapper relative flex w-full h-full"'
);
content = content.replace(
  "style={bookDimensions.width > 0 ? { width: `${bookDimensions.width}px`, height: `${bookDimensions.height}px` } : {}}",
  "style={{ width: '100%', height: '100%' }}"
);

// 8. Prev Arrow
content = content.replace(
  '<button\n                onClick={handlePrevPage}\n                disabled={pageNumber <= 1 || !!animationState}\n                className="absolute left-[-24px] lg:left-[-48px] top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white border border-gray-200 hover:border-orange-400 hover:text-orange-500 rounded-full flex items-center justify-center text-gray-400 shadow-md disabled:opacity-20 transition-all cursor-pointer"\n              >\n                <ChevronLeft className="w-5 h-5" />\n              </button>',
  '<button onClick={handlePrevPage} disabled={pageNumber <= 1 || !!animationState} className="absolute left-0 top-0 w-1/4 h-full z-20 cursor-pointer opacity-0" />'
);

// 9. Next Arrow
content = content.replace(
  '<button\n                onClick={handleNextPage}\n                disabled={pageNumber + (isMobile ? 1 : 2) > numPages || !!animationState}\n                className="absolute right-[-24px] lg:right-[-48px] top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white border border-gray-200 hover:border-orange-400 hover:text-orange-500 rounded-full flex items-center justify-center text-gray-400 shadow-md disabled:opacity-20 transition-all cursor-pointer"\n              >\n                <ChevronRight className="w-5 h-5" />\n              </button>',
  '<button onClick={handleNextPage} disabled={pageNumber + (isMobile ? 1 : 2) > numPages || !!animationState} className="absolute right-0 top-0 w-1/4 h-full z-20 cursor-pointer opacity-0" />'
);

fs.writeFileSync('client/src/components/Reader.jsx', content);

// INDEX CSS changes
let css = fs.readFileSync('client/src/index.css', 'utf8');
css = css.replace('border-radius: 12px;', 'border-radius: 0px;');
css = css.replace('box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);', 'box-shadow: none;');
css = css.replace('border: 1px solid #e2e8f0;', 'border: none;');
fs.writeFileSync('client/src/index.css', css);

console.log('Done refactoring Reader.jsx');
