import fs from 'fs';

let content = fs.readFileSync('client/src/components/Reader.jsx', 'utf8');

// 1. Instant Page Turn Handlers
content = content.replace(
  /  \/\/ Next page — with 3D flip[\s\S]*?  \/\/ Prev page — with 3D flip/m,
  `  // Next page
  const handleNextPage = async () => {
    const step = (isMobile || viewMode === 'single') ? 1 : 2;
    if (pageNumber + step <= numPages) {
      setPageNumber(p => p + step);
      handleSaveProgress(0);
    }
  };

  // Prev page`
);

content = content.replace(
  /  \/\/ Prev page — with 3D flip[\s\S]*?  \/\/ Jump to specific page/m,
  `  const handlePrevPage = async () => {
    const step = (isMobile || viewMode === 'single') ? 1 : 2;
    if (pageNumber - step >= 1) {
      setPageNumber(p => p - step);
      handleSaveProgress(0);
    }
  };

  // Jump to specific page`
);

// 2. Remove 3D Flip Sheet from JSX
const flipSheetRegex = /\{\/\* 3D FLIP SHEET \*\/\}[\s\S]*?\{\/\* Next arrow \*\/\}/m;
content = content.replace(flipSheetRegex, '{/* Next arrow */}');

// 3. Hide original Header and Bottom Nav
content = content.replace(
  /<header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-8 shrink-0 z-10 shadow-sm relative">/,
  `<header className="hidden">`
);

content = content.replace(
  /<div className="w-full max-w-md flex flex-col items-center gap-2 py-3 px-4 shrink-0 select-none border-t border-slate-200 bg-slate-100">/,
  `<div className="hidden">`
);

// 4. Inject Overlay Toolbars into the book viewport
const bookSpreadStart = content.indexOf('{/* Book spread */}');
const toolbars = `              {/* TOP RIGHT FLOATING TOOLBAR */}
              <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white/80 backdrop-blur-md border border-gray-200 p-1 rounded-xl shadow-sm">
                  <button onClick={() => setZoom(Math.max(1.0, zoom - 0.25))} className="p-1.5 text-gray-500 hover:text-orange-500 rounded-lg"><ZoomOut className="w-4 h-4" /></button>
                  <span className="text-[10px] font-bold text-gray-600 w-8 text-center">{Math.round(zoom * 100)}%</span>
                  <button onClick={() => setZoom(Math.min(2.5, zoom + 0.25))} className="p-1.5 text-gray-500 hover:text-orange-500 rounded-lg"><ZoomIn className="w-4 h-4" /></button>
                  <div className="w-px h-4 bg-gray-300 mx-1"></div>
                  <button onClick={() => { setViewMode(viewMode === 'double' ? 'single' : 'double'); setZoom(1.0); }} className="p-1.5 text-gray-500 hover:text-orange-500 rounded-lg flex gap-1 items-center text-[11px] font-bold"><BookOpen className="w-4 h-4" />{viewMode === 'double' ? '2-Page' : '1-Page'}</button>
                </div>
                <button onClick={() => { setSummaryRange({ start: pageNumber, end: Math.min(pageNumber + 2, numPages) }); setShowSummaryModal(true); }} className="p-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-sm hover:shadow-md"><Sparkles className="w-4 h-4" /></button>
                <button onClick={() => setActivePanel(activePanel === 'annotations' ? null : 'annotations')} className="p-2 bg-white/80 backdrop-blur-md border border-gray-200 text-gray-600 rounded-xl shadow-sm hover:text-orange-500"><FileText className="w-4 h-4" /></button>
                <button onClick={() => setActivePanel(activePanel === 'doubts' ? null : 'doubts')} className="p-2 bg-white/80 backdrop-blur-md border border-gray-200 text-gray-600 rounded-xl shadow-sm hover:text-orange-500"><MessageSquare className="w-4 h-4" /></button>
              </div>\n\n`;

content = content.substring(0, bookSpreadStart) + toolbars + content.substring(bookSpreadStart);

// 5. Remove margins and padding from main container
content = content.replace(
  /<div className="flex-1 flex flex-col items-center overflow-hidden bg-slate-100" onMouseUp=\{handleMouseUpTextSelection\}\n\s*style=\{\{ gap: 0 \}\}>/,
  `<div className="flex-1 flex flex-col items-center overflow-hidden bg-slate-200" onMouseUp={handleMouseUpTextSelection}>`
);
content = content.replace(
  /style=\{\{ padding: isMobile \? '8px' : '12px 48px' \}\}/,
  `style={{ padding: 0 }}`
);

// 6. Fix Canvas Rendering
// Remove the 1.12 scale css trick entirely. Let the viewport strictly dictate size.
content = content.replace(
  /style=\{\{ display: 'block', maxWidth: '100%', maxHeight: '100%', transform: 'scale\(1\.12\)', transformOrigin: 'center center' \}\}/g,
  `style={{ display: 'block', width: '100%', height: '100%' }}`
);

// Fix the PDF.js render logic to not do custom scaling, just render exact viewport
content = content.replace(
  /const dpr = Math\.max\(window\.devicePixelRatio \|\| 1, 2\.5\);\n\s*const scale = \(displayW \/ unscaledViewport\.width\) \* dpr;\n\s*const viewport = page\.getViewport\(\{ scale \}\);/g,
  `const dpr = window.devicePixelRatio || 1;\n      const scale = (displayW / unscaledViewport.width) * dpr * zoom;\n      const viewport = page.getViewport({ scale });`
);

// 7. Expand Book Wrapper
content = content.replace(
  /style=\{bookDimensions\.width \? \{ width: \`\$\{bookDimensions\.width\}px\`, height: \`\$\{bookDimensions\.height\}px\` \} : \{\}\}/,
  `style={bookDimensions.width ? { width: \`\${bookDimensions.width}px\`, height: \`\${bookDimensions.height}px\`, maxHeight: '100vh' } : {}}`
);

fs.writeFileSync('client/src/components/Reader.jsx', content);
console.log('Refactoring 4 complete');
