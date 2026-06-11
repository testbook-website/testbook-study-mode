import fs from 'fs';

let content = fs.readFileSync('client/src/components/Reader.jsx', 'utf8');

// 1. Hide Top Header completely
content = content.replace(
  '<header className="border-b border-orange-100 bg-white/90 backdrop-blur-md py-3 px-6 flex items-center justify-between shrink-0 shadow-sm">',
  '<header className="hidden">'
);

// 2. Hide Bottom Footer completely
content = content.replace(
  '<div className="w-full max-w-md flex flex-col items-center gap-2 py-3 px-4 shrink-0 select-none border-t border-slate-200 bg-slate-100">',
  '<div className="hidden">'
);

// 3. Remove Container padding to allow stretching
content = content.replace(
  /style=\{\{ padding: isMobile \? '8px' : '12px 48px' \}\}/g,
  "style={{ padding: 0 }}"
);

// 4. Change background color to match typical flipbook style (light grey)
content = content.replace(
  /bg-slate-100/g,
  'bg-[#e0e0e0]'
);

// 5. Remove 'gap' between components (makes it flush)
content = content.replace(
  /style=\{\{ gap: isMobile \? 12 : 24 \}\}/g,
  "style={{ gap: 0 }}"
);

// 6. Scale canvases by 1.06 to crop PDF margins
content = content.replace(
  /<canvas ref=\{([^}]+)\} className="pointer-events-none" style=\{\{ display: 'block', maxWidth: '100%', maxHeight: '100%' \}\}\s*\/>/g,
  '<canvas ref={$1} className="pointer-events-none" style={{ display: \'block\', width: \'100%\', height: \'100%\', transform: \'scale(1.06)\', transformOrigin: \'center center\' }} />'
);

// 7. Add overflow: hidden to the canvas parent containers
content = content.replace(
  /style=\{\{ padding: isMobile \? '6px' : '8px' \}\}/g,
  "style={{ overflow: 'hidden' }}"
);
content = content.replace(
  /style=\{\{ padding: '8px' \}\}/g,
  "style={{ overflow: 'hidden' }}"
);

// 8. Replace original TOP RIGHT FLOATING TOOLBAR with new one
const originalToolbar = `              {/* TOP RIGHT FLOATING TOOLBAR */}
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
              </div>`;

const newToolbar = `              {/* TOP RIGHT ACTION BUTTONS */}
              <div className="absolute top-4 right-4 z-[60] flex flex-col sm:flex-row items-center gap-3 pointer-events-auto">
                <div className="flex bg-white/90 backdrop-blur-md border border-gray-200 rounded-full shadow-lg overflow-hidden">
                  <button onClick={() => setZoom(z => Math.max(1.0, z - 0.25))} className="p-3 text-gray-600 hover:bg-gray-50 hover:text-orange-500 transition-colors cursor-pointer" title="Zoom Out">
                    <ZoomOut className="w-5 h-5" />
                  </button>
                  <div className="w-px bg-gray-200 my-2"></div>
                  <button onClick={() => setZoom(z => Math.min(3.0, z + 0.25))} className="p-3 text-gray-600 hover:bg-gray-50 hover:text-orange-500 transition-colors cursor-pointer" title="Zoom In">
                    <ZoomIn className="w-5 h-5" />
                  </button>
                  <div className="w-px bg-gray-200 my-2"></div>
                  <button onClick={() => { setViewMode(viewMode === 'double' ? 'single' : 'double'); setZoom(1.0); }} className="px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-orange-500 transition-colors font-bold text-sm flex items-center gap-2 cursor-pointer" title="Toggle Layout">
                    <BookOpen className="w-5 h-5" />
                    {viewMode === 'double' ? '2-Page' : '1-Page'}
                  </button>
                </div>
                <button onClick={() => { setSummaryRange({ start: pageNumber, end: Math.min(pageNumber + 2, numPages) }); setShowSummaryModal(true); }} className="p-3 bg-white/90 backdrop-blur-md border border-gray-200 text-orange-500 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer" title="Summarise Pages">
                  <Sparkles className="w-5 h-5" />
                </button>
                <button onClick={() => setActivePanel(activePanel === 'annotations' ? null : 'annotations')} className="p-3 bg-white/90 backdrop-blur-md border border-gray-200 text-gray-600 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer hover:text-orange-500" title="Notes & Marks">
                  <FileText className="w-5 h-5" />
                </button>
                <button onClick={() => setActivePanel(activePanel === 'doubts' ? null : 'doubts')} className="p-3 bg-white/90 backdrop-blur-md border border-gray-200 text-gray-600 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer hover:text-orange-500" title="Ask Doubt">
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>`;

content = content.replace(originalToolbar, newToolbar);

// 9. Move the left/right arrows slightly inward
content = content.replace(
  'left-[-24px] lg:left-[-48px]',
  'left-2 lg:left-4'
);
content = content.replace(
  'right-[-24px] lg:right-[-48px]',
  'right-2 lg:right-4'
);

fs.writeFileSync('client/src/components/Reader.jsx', content);

// CSS Changes
let css = fs.readFileSync('client/src/index.css', 'utf8');
css = css.replace(/border-radius: 12px;/g, 'border-radius: 0px;');
css = css.replace(/box-shadow: 0 25px 50px -12px rgba\(0,0,0,0\.25\);/g, 'box-shadow: none;');
css = css.replace(/border: 1px solid #e2e8f0;/g, 'border: none;');
fs.writeFileSync('client/src/index.css', css);

console.log("Refactoring 14 done - clean and precise!");
