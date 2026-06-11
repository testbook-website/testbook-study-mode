import fs from 'fs';

let content = fs.readFileSync('client/src/components/Reader.jsx', 'utf8');

// 1. Remove the prepended toolbar that was injected by my previous script
const toolbarRegex = /\s*\{\/\* TOP RIGHT FLOATING TOOLBAR \*\/\}[\s\S]*?<\/div>\s*<\/div>\n/;
content = content.replace(toolbarRegex, '');

// 2. Hide Top Header
content = content.replace(
  /<header className="border-b border-orange-100 bg-white\/90 backdrop-blur-md py-3 px-6 flex items-center justify-between shrink-0 shadow-sm">/,
  `<header className="hidden">`
);

// 3. The bottom pagination bar. Let's find it. It probably looks like a container with "Page" and progress bar.
// I can just hide the whole bottom area if it exists, or look for the exact JSX.
// Wait, the progress bar might be part of Timer, or it might be a floating div.
// Let's search for "of" or "progress" in the source code using regex.
const paginationRegex = /<div className="absolute bottom-4 left-1\/2 -translate-x-1\/2 bg-white\/90 backdrop-blur-md border border-gray-200 shadow-xl rounded-2xl p-2 flex flex-col gap-2 w-\[90%\] max-w-sm z-30">/g;
content = content.replace(paginationRegex, `<div className="hidden">`);

// Or maybe it's this class:
content = content.replace(
  /<div className="w-full max-w-md flex flex-col items-center gap-2 py-3 px-4 shrink-0 select-none border-t border-slate-200 bg-slate-100">/,
  `<div className="hidden">`
);

// 4. In case the floating toolbar is still there, let's remove ANY instance of it:
content = content.replace(/\{\/\* TOP RIGHT FLOATING TOOLBAR \*\/\}[\s\S]*?<\/div>\s*<\/div>/g, '');

// 5. Re-add the Floating toolbar correctly inside the book viewport!
// It goes inside `<div className="flex-1 flex flex-col overflow-hidden relative">`
const viewportRegex = /(<div className="flex-1 flex overflow-hidden relative">)/;

const newToolbar = `
        {/* NEW FLOATING TOOLBARS */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
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
        </div>
`;
content = content.replace(viewportRegex, `$1\n${newToolbar}`);

fs.writeFileSync('client/src/components/Reader.jsx', content);
console.log('Fixed Header and Toolbar');
