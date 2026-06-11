import fs from 'fs';

let content = fs.readFileSync('client/src/components/Reader.jsx', 'utf8');

// 1. Restore the aspect ratio constraint on book-wrapper so it doesn't warp!
content = content.replace(
  /style=\{\{ width: \`\$\{zoom \* 100\}%\`, height: \`\$\{zoom \* 100\}%\` \}\}/g,
  "style={bookDimensions.width > 0 ? { width: `${bookDimensions.width}px`, height: `${bookDimensions.height}px` } : {}}"
);

// 2. Update the buttons to include the 1-Page / 2-Page toggle!
const oldButtons = /(?:\{\/\* TOP RIGHT ACTION BUTTONS \*\/\}[\s\S]*?<\/div>\s*<\/div>)/;

const newButtons = `              {/* TOP RIGHT ACTION BUTTONS */}
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

content = content.replace(oldButtons, newButtons);

// 3. Make the background explicitly grey to match FlipbookPDF
content = content.replace(
  /bg-\[#e9e9e9\]/g,
  "bg-[#e0e0e0]"
);

fs.writeFileSync('client/src/components/Reader.jsx', content);
console.log("Refactoring 13 complete");
