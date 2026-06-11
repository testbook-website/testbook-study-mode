import fs from 'fs';

let content = fs.readFileSync('client/src/components/Reader.jsx', 'utf8');

// 1. Hide Header and Footer
content = content.replace(
  /<header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-8 shrink-0 z-10 shadow-sm relative">/,
  `<header className="hidden">`
);

content = content.replace(
  /<div className="w-full max-w-md flex flex-col items-center gap-2 py-3 px-4 shrink-0 select-none border-t border-slate-200 bg-slate-100">/,
  `<div className="hidden">`
);

// 2. Remove the 1.12 scaling
content = content.replace(
  /transform: 'scale\(1\.12\)'/g,
  `transform: 'none'`
);

// 3. Inject Floating Toolbars inside the "flex-1 w-full relative" wrapper
const toolbars = `              {/* TOP RIGHT FLOATING TOOLBAR */}
              <div className="absolute top-4 right-4 z-50 flex items-center gap-2 pointer-events-auto">
                <div className="flex items-center gap-1 bg-white/80 backdrop-blur-md border border-gray-200 p-1 rounded-xl shadow-sm">
                  <button onClick={() => setZoom(z => Math.max(1.0, z - 0.25))} className="p-1.5 text-gray-500 hover:text-orange-500 rounded-lg cursor-pointer"><ZoomOut className="w-4 h-4" /></button>
                  <span className="text-[10px] font-bold text-gray-600 w-8 text-center">{Math.round(zoom * 100)}%</span>
                  <button onClick={() => setZoom(z => Math.min(2.5, z + 0.25))} className="p-1.5 text-gray-500 hover:text-orange-500 rounded-lg cursor-pointer"><ZoomIn className="w-4 h-4" /></button>
                  <div className="w-px h-4 bg-gray-300 mx-1"></div>
                  <button onClick={() => { setViewMode(viewMode === 'double' ? 'single' : 'double'); setZoom(1.0); }} className="p-1.5 text-gray-500 hover:text-orange-500 rounded-lg flex gap-1 items-center text-[11px] font-bold cursor-pointer"><BookOpen className="w-4 h-4" />{viewMode === 'double' ? '2-Page' : '1-Page'}</button>
                </div>
                <button onClick={() => { setSummaryRange({ start: pageNumber, end: Math.min(pageNumber + 2, numPages) }); setShowSummaryModal(true); }} className="p-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-sm hover:shadow-md cursor-pointer"><Sparkles className="w-4 h-4" /></button>
                <button onClick={() => setActivePanel(activePanel === 'annotations' ? null : 'annotations')} className="p-2 bg-white/80 backdrop-blur-md border border-gray-200 text-gray-600 rounded-xl shadow-sm hover:text-orange-500 cursor-pointer"><FileText className="w-4 h-4" /></button>
                <button onClick={() => setActivePanel(activePanel === 'doubts' ? null : 'doubts')} className="p-2 bg-white/80 backdrop-blur-md border border-gray-200 text-gray-600 rounded-xl shadow-sm hover:text-orange-500 cursor-pointer"><MessageSquare className="w-4 h-4" /></button>
                <button onClick={() => navigate('/dashboard')} className="p-2 bg-white/80 backdrop-blur-md border border-gray-200 text-gray-600 rounded-xl shadow-sm hover:text-orange-500 cursor-pointer"><X className="w-4 h-4" /></button>
              </div>\n`;

content = content.replace(
  /(<div\s+className=\{\`flex-1 w-full relative.*\`\}\s+style=\{\{ padding: isMobile \? '8px' : '12px 48px' \}\}\s+onTouchStart=\{handleTouchStart\}\s+onTouchMove=\{handleTouchMove\}\s+onTouchEnd=\{handleTouchEnd\}\s+>)/,
  `$1\n${toolbars}`
);

// 4. Remove padding from the "flex-1 w-full relative" container to maximize width
content = content.replace(
  /style=\{\{ padding: isMobile \? '8px' : '12px 48px' \}\}/,
  `style={{ padding: 0 }}`
);

// 5. Expand the book container to fill height
content = content.replace(
  /style=\{bookDimensions\.width \? \{ width: \`\$\{bookDimensions\.width\}px\`, height: \`\$\{bookDimensions\.height\}px\` \} : \{\}\}/,
  `style={bookDimensions.width ? { width: \`\${bookDimensions.width}px\`, height: \`\${bookDimensions.height}px\`, maxHeight: '100vh' } : {}}`
);

// 6. Fix PDF scaling calculation to incorporate zoom directly!
content = content.replace(
  /const scale = \(displayW \/ unscaledViewport\.width\) \* dpr;/g,
  `const scale = (displayW / unscaledViewport.width) * dpr * zoom;`
);

// 7. Make book background gray not light-blue
content = content.replace(
  /<div className="flex-1 flex flex-col items-center overflow-hidden bg-slate-100"/,
  `<div className="flex-1 flex flex-col items-center overflow-hidden bg-slate-200"`
);

// 8. Fix Chevron positioning (Make them absolute inside the window, not inside the book width)
// Prev Arrow
content = content.replace(
  /className="absolute left-[-24px] lg:left-[-48px] top-1\/2 -translate-y-1\/2 z-20/g,
  `className="fixed left-4 top-1/2 -translate-y-1/2 z-50`
);
// Next Arrow
content = content.replace(
  /className="absolute right-[-24px] lg:right-[-48px] top-1\/2 -translate-y-1\/2 z-20/g,
  `className="fixed right-4 top-1/2 -translate-y-1/2 z-50`
);

fs.writeFileSync('client/src/components/Reader.jsx', content);
console.log('Refactoring 5 complete');
