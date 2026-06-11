import fs from 'fs';

let content = fs.readFileSync('client/src/components/Reader.jsx', 'utf8');

// 1. Remove the 1.12 crop scale and fix rendering scale
content = content.replace(
  /const scale = \(displayW \/ unscaledViewport\.width\) \* dpr;/g,
  `const scale = (displayW / unscaledViewport.width) * dpr * zoom;` // Multiply by zoom
);

// 2. Hide headers and footers to maximize space.
// Make header absolute and transparent
content = content.replace(
  /<header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-8 shrink-0 z-10 shadow-sm relative">/,
  `<header className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-4 lg:px-8 z-50 pointer-events-none">`
);

// Update buttons in header to have pointer-events-auto and backdrop blur
content = content.replace(
  /className="p-2 border rounded-xl flex items-center gap-1\.5/g,
  `className="p-2 border rounded-xl flex items-center gap-1.5 pointer-events-auto shadow-md"`
);

// Remove the left logo from header so it's clean, or just make it pointer-events-auto
content = content.replace(
  /<div className="flex items-center gap-3">/,
  `<div className="flex items-center gap-3 pointer-events-auto">`
);

content = content.replace(
  /<div className="flex items-center gap-2">/,
  `<div className="flex items-center gap-2 pointer-events-auto">`
);

// 3. Move the 3 view buttons (ZoomIn, ZoomOut, BookOpen) to the top right.
// They are currently in the center of the header: `<div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 p-1 rounded-xl">`
// We will move them to the right group.
const centerGroupRegex = /<div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 p-1 rounded-xl">[\s\S]*?<\/div>/;
const centerGroupMatch = content.match(centerGroupRegex);
if (centerGroupMatch) {
  content = content.replace(centerGroupRegex, ''); // Remove from center
  // Insert into the right group before "Summarise"
  content = content.replace(
    /\{book && \(\s*<button\s*onClick=\{\(\) => \{\s*setSummaryRange/,
    `${centerGroupMatch[0]}\n          {book && (\n            <button\n              onClick={() => {\n                setSummaryRange`
  );
}

// 4. Remove the bottom navigation entirely, or make it absolutely positioned
content = content.replace(
  /\{book && \(\s*<div className="w-full max-w-md flex flex-col items-center gap-2 py-3 px-4 shrink-0 select-none border-t border-slate-200 bg-slate-100">/,
  `{book && (\n            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md flex flex-col items-center gap-2 py-3 px-4 shrink-0 select-none bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl shadow-xl z-50 pointer-events-auto">`
);

// 5. Add Sound and Play it on Flip
content = content.replace(
  /const handleNextPage = async \(\) => \{/g,
  `const playPageTurnSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const bufferSize = audioCtx.sampleRate * 0.12;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.03));
      }
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass'; filter.frequency.value = 600; filter.Q.value = 1.0;
      const source = audioCtx.createBufferSource(); source.buffer = buffer;
      const gainNode = audioCtx.createGain(); gainNode.gain.value = 0.5;
      source.connect(filter); filter.connect(gainNode); gainNode.connect(audioCtx.destination);
      source.start();
    } catch (err) {}
  };

  const handleNextPage = async () => {
    playPageTurnSound();`
);

content = content.replace(
  /const handlePrevPage = async \(\) => \{/g,
  `const handlePrevPage = async () => {
    playPageTurnSound();`
);

// 6. Fix Bookmark overlapping and styling
// Previously: <div className="absolute top-0 right-3 z-20 text-orange-500">
// Change to float on the top-right corner of the actual page edge nicely
content = content.replace(
  /<div className="absolute top-0 right-3 z-20 text-orange-500">/g,
  `<div className="absolute -top-1 -right-2 z-20 text-orange-500 drop-shadow-md">`
);

// Toggle bookmark button -> Move to middle outer edge
content = content.replace(
  /<button onClick=\{\(\) => toggleBookmark\(pageNumber\)\} className="absolute top-2 left-3 text-gray-300 hover:text-orange-500 cursor-pointer transition-colors">/g,
  `<button onClick={() => toggleBookmark(pageNumber)} className="absolute top-1/2 left-2 -translate-y-1/2 p-2 bg-white/50 backdrop-blur-sm rounded-full text-gray-400 hover:text-orange-500 cursor-pointer transition-colors z-20 shadow-sm border border-white/40 opacity-0 group-hover:opacity-100">`
);
content = content.replace(
  /<button onClick=\{\(\) => toggleBookmark\(pageNumber \+ 1\)\} className="absolute top-2 right-3 text-gray-300 hover:text-orange-500 cursor-pointer transition-colors">/g,
  `<button onClick={() => toggleBookmark(pageNumber + 1)} className="absolute top-1/2 right-2 -translate-y-1/2 p-2 bg-white/50 backdrop-blur-sm rounded-full text-gray-400 hover:text-orange-500 cursor-pointer transition-colors z-20 shadow-sm border border-white/40 opacity-0 group-hover:opacity-100">`
);

// 7. Make book take up full height by removing background and padding
content = content.replace(
  /<div className="flex-1 flex flex-col items-center overflow-hidden bg-slate-100" onMouseUp=\{handleMouseUpTextSelection\}\n\s*style=\{\{ gap: 0 \}\}>/,
  `<div className="flex-1 flex flex-col items-center overflow-hidden bg-slate-200" onMouseUp={handleMouseUpTextSelection} style={{ gap: 0 }}>`
);

// Remove the inline padding: '12px 48px' for desktop
content = content.replace(
  /style=\{\{ padding: isMobile \? '8px' : '12px 48px' \}\}/,
  `style={{ padding: 0 }}`
);

// Make the book wrapper and pages fill 100% properly
// Replace book-wrapper width/height setup
content = content.replace(
  /style=\{bookDimensions\.width \? \{ width: \`\$\{bookDimensions\.width\}px\`, height: \`\$\{bookDimensions\.height\}px\` \} : \{\}\}/,
  `style={bookDimensions.width ? { width: \`\${bookDimensions.width}px\`, height: \`\${bookDimensions.height}px\`, maxHeight: '100vh' } : {}}`
);

// 8. Make the left-page / right-page group-hover enabled for the bookmark buttons
content = content.replace(
  /className="book-page-half left-page relative select-text"/,
  `className="book-page-half left-page relative select-text group"`
);
content = content.replace(
  /className="book-page-half right-page relative select-text"/,
  `className="book-page-half right-page relative select-text group"`
);

// 9. Fix canvas styles. Remove transform scale
content = content.replace(
  /style=\{\{ display: 'block', maxWidth: '100%', maxHeight: '100%', transform: 'scale\(1\.12\)', transformOrigin: 'center center' \}\}/g,
  `style={{ display: 'block', width: '100%', height: '100%' }}`
);

fs.writeFileSync('client/src/components/Reader.jsx', content);
console.log('Refactoring 3 complete');
