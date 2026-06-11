import fs from 'fs';

let content = fs.readFileSync('client/src/components/Reader.jsx', 'utf8');

// 1. Add Zoom buttons to the TOP RIGHT ACTION BUTTONS
const originalButtons = `              {/* TOP RIGHT ACTION BUTTONS */}
              <div className="absolute top-4 right-4 z-[60] flex flex-col sm:flex-row items-center gap-3 pointer-events-auto">
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

content = content.replace(originalButtons, newButtons);

// 2. Fix the width/height to actually scale with zoom
content = content.replace(
  /style=\{\{ width: '100%', height: '100%' \}\}/g,
  "style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}"
);

fs.writeFileSync('client/src/components/Reader.jsx', content);
console.log("Refactoring 12 done - added zoom tools");
