import fs from 'fs';

let content = fs.readFileSync('client/src/components/Reader.jsx', 'utf8');

// 1. Hide Top Header completely
content = content.replace(
  /<header className="border-b border-orange-100 bg-white\/90 backdrop-blur-md py-3 px-6 flex items-center justify-between shrink-0 shadow-sm">/,
  '<header className="hidden">'
);

// 2. Hide Bottom Footer completely
content = content.replace(
  /<div className="w-full max-w-md flex flex-col items-center gap-2 py-3 px-4 shrink-0 select-none border-t border-slate-200 bg-slate-100">/,
  '<div className="hidden">'
);

// 3. Remove Container padding to allow stretching
content = content.replace(
  /style=\{\{ padding: isMobile \? '8px' : '12px 48px' \}\}/g,
  "style={{ padding: 0 }}"
);

// 4. Change background color to match typical flipbook style (light grey)
content = content.replace(
  /className="flex-1 flex flex-col items-center overflow-hidden bg-slate-100"/,
  'className="flex-1 flex flex-col items-center overflow-hidden bg-[#e9e9e9]"'
);

// 5. Remove 'gap' between components (makes it flush)
content = content.replace(
  /style=\{\{ gap: isMobile \? 12 : 24 \}\}/,
  "style={{ gap: 0 }}"
);

// 6. Scale canvases by 1.12 to crop PDF margins
content = content.replace(
  /<canvas ref=\{([^}]+)\} className="pointer-events-none" style=\{\{ display: 'block', maxWidth: '100%', maxHeight: '100%' \}\}\s*\/>/g,
  '<canvas ref={$1} className="pointer-events-none" style={{ display: \'block\', width: \'100%\', height: \'100%\', transform: \'scale(1.12)\', transformOrigin: \'center center\' }} />'
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

// 8. Inject the 3 specific buttons on the top right
const buttonsUI = `
              {/* TOP RIGHT ACTION BUTTONS */}
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

content = content.replace(
  /(<div\s+className=\{\`flex-1 w-full relative \$\{zoom === 1\.0 \? 'overflow-hidden flex items-center justify-center' : 'overflow-auto'\}\`\}\s+style=\{\{ padding: 0 \}\}\s+onTouchStart=\{handleTouchStart\}\s+onTouchMove=\{handleTouchMove\}\s+onTouchEnd=\{handleTouchEnd\}\s+>)/,
  `$1\n${buttonsUI}`
);

// 9. Hide the visual Chevrons and make them invisible click regions
content = content.replace(
  /<button\s+onClick=\{handlePrevPage\}\s+disabled=\{pageNumber <= 1 \|\| !!animationState\}\s+className="absolute left-\[-24px\] lg:left-\[-48px\] top-1\/2 -translate-y-1\/2 z-20 w-9 h-9 bg-white border border-gray-200 hover:border-orange-400 hover:text-orange-500 rounded-full flex items-center justify-center text-gray-400 shadow-md disabled:opacity-20 transition-all cursor-pointer"\s+>\s+<ChevronLeft className="w-5 h-5" \/>\s+<\/button>/,
  '<button onClick={handlePrevPage} disabled={pageNumber <= 1 || !!animationState} className="absolute left-0 top-0 w-[15%] h-full z-20 cursor-pointer opacity-0" />'
);

content = content.replace(
  /<button\s+onClick=\{handleNextPage\}\s+disabled=\{pageNumber \+ \(isMobile \? 1 : 2\) > numPages \|\| !!animationState\}\s+className="absolute right-\[-24px\] lg:right-\[-48px\] top-1\/2 -translate-y-1\/2 z-20 w-9 h-9 bg-white border border-gray-200 hover:border-orange-400 hover:text-orange-500 rounded-full flex items-center justify-center text-gray-400 shadow-md disabled:opacity-20 transition-all cursor-pointer"\s+>\s+<ChevronRight className="w-5 h-5" \/>\s+<\/button>/,
  '<button onClick={handleNextPage} disabled={pageNumber + (isMobile ? 1 : 2) > numPages || !!animationState} className="absolute right-0 top-0 w-[15%] h-full z-20 cursor-pointer opacity-0" />'
);

fs.writeFileSync('client/src/components/Reader.jsx', content);

// CSS Changes
let css = fs.readFileSync('client/src/index.css', 'utf8');
// Remove borders and shadows to make it "flat" and stretched
css = css.replace(/border-radius: 12px;/g, 'border-radius: 0px;');
css = css.replace(/box-shadow: 0 25px 50px -12px rgba\(0,0,0,0\.25\);/g, 'box-shadow: none;');
css = css.replace(/border: 1px solid #e2e8f0;/g, 'border: none;');

fs.writeFileSync('client/src/index.css', css);

console.log("Refactoring 10 done");
