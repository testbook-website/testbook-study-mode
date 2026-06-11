import fs from 'fs';

let content = fs.readFileSync('client/src/components/Reader.jsx', 'utf8');

// 1. Hide the top header
content = content.replace(
  /<header className="border-b border-orange-100 bg-white\/90 backdrop-blur-md py-3 px-6 flex items-center justify-between shrink-0 shadow-sm">/,
  `<header className="hidden">`
);

// 2. Hide the bottom navigation
content = content.replace(
  /<div className="w-full max-w-md flex flex-col items-center gap-2 py-3 px-4 shrink-0 select-none border-t border-slate-200 bg-slate-100">/,
  `<div className="hidden">`
);

// 3. Remove the 1.12 scaling to fit 100%
content = content.replace(
  /transform: 'scale\(1\.12\)'/g,
  `transform: 'none'`
);

// 4. Incorporate zoom into scale properly
content = content.replace(
  /const scale = \(displayW \/ unscaledViewport\.width\) \* dpr;/g,
  `const scale = (displayW / unscaledViewport.width) * dpr * zoom;`
);

// 5. Remove padding from viewport container for 100% stretch
content = content.replace(
  /style=\{\{ padding: isMobile \? '8px' : '12px 48px' \}\}/,
  `style={{ padding: 0 }}`
);

// 6. Make book area background dark so pages stand out better, no gap
content = content.replace(
  /className="flex-1 flex flex-col items-center overflow-hidden bg-slate-100" onMouseUp=\{handleMouseUpTextSelection\}\n\s*style=\{\{ gap: isMobile \? 12 : 24 \}\}/,
  `className="flex-1 flex flex-col items-center overflow-hidden bg-slate-200" onMouseUp={handleMouseUpTextSelection}\n          style={{ gap: 0 }}`
);

// 7. Inject the floating toolbar inside the flex-1 w-full relative container
const viewportRegex = /(<div\s+className=\{\`flex-1 w-full relative \$\{zoom === 1\.0 \? 'overflow-hidden flex items-center justify-center' : 'overflow-auto'\}\`\}\s+style=\{\{ padding: 0 \}\}\s+onTouchStart=\{handleTouchStart\}\s+onTouchMove=\{handleTouchMove\}\s+onTouchEnd=\{handleTouchEnd\}\s+>)/;

const newToolbar = `
              {/* TOP RIGHT FLOATING TOOLBAR */}
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
              </div>`;

content = content.replace(viewportRegex, `$1\n${newToolbar}`);

fs.writeFileSync('client/src/components/Reader.jsx', content);
console.log('Refactor 7 complete');
