import fs from 'fs';

let content = fs.readFileSync('client/src/components/Reader.jsx', 'utf8');

// 1. Remove the TOP RIGHT FLOATING TOOLBAR entirely
content = content.replace(
  /\s*\{\/\* TOP RIGHT FLOATING TOOLBAR \*\/\}[\s\S]*?<\/div>\s*<\/div>/,
  ""
);

// 2. Add 1.12 scale and overflow hidden to the canvases
content = content.replace(
  /<div className="w-full h-full flex items-center justify-center" style=\{\{ padding: isMobile \? '6px' : '8px' \}\}>\s*<canvas ref=\{leftCanvasRef\} className="pointer-events-none" style=\{\{ display: 'block', maxWidth: '100%', maxHeight: '100%' \}\}\s*\/>\s*<\/div>/,
  `<div className="w-full h-full flex items-center justify-center" style={{ overflow: 'hidden' }}>
    <canvas ref={leftCanvasRef} className="pointer-events-none" style={{ display: 'block', width: '100%', height: '100%', transform: 'scale(1.12)', transformOrigin: 'center center' }} />
  </div>`
);

content = content.replace(
  /<div className="w-full h-full flex items-center justify-center" style=\{\{ padding: '8px' \}\}>\s*<canvas ref=\{rightCanvasRef\} className="pointer-events-none" style=\{\{ display: 'block', maxWidth: '100%', maxHeight: '100%' \}\}\s*\/>\s*<\/div>/,
  `<div className="w-full h-full flex items-center justify-center" style={{ overflow: 'hidden' }}>
    <canvas ref={rightCanvasRef} className="pointer-events-none" style={{ display: 'block', width: '100%', height: '100%', transform: 'scale(1.12)', transformOrigin: 'center center' }} />
  </div>`
);

// 3. Stretch the book completely (remove borders, rounded corners, padding, shadow)
// In Reader.jsx:
content = content.replace(
  /className="book-wrapper shadow-2xl relative flex"/,
  `className="book-wrapper relative flex w-full h-full"`
);

// Remove the inline styling that restricts the book dimensions to exactly aspect ratio pixels,
// so that it can stretch completely into the flex container!
content = content.replace(
  /style=\{bookDimensions\.width > 0 \? \{ width: \`\$\{bookDimensions\.width\}px\`, height: \`\$\{bookDimensions\.height\}px\` \} : \{\}\}/,
  `style={{ width: '100%', height: '100%' }}`
);

// 4. In PdfPageRenderer, set bookH and bookW to use the exact container dimensions 
// (ignoring aspect ratio logic if we are stretching)
// Actually, it's better to just leave PdfPageRenderer alone and let CSS handle the width/height stretching via canvas
// Wait! If the canvas scale(1.12) is used, we need the canvas to draw at a high resolution.
// The `scale` variable inside drawPage calculates the PDF rendering scale.
// I'll make sure it's sufficiently high.

// 5. Hide the left/right chevrons, user can click or use keyboard
content = content.replace(
  /<button[^>]*onClick=\{handlePrevPage\}[^>]*>[\s\S]*?<ChevronLeft className="w-5 h-5" \/>\s*<\/button>/g,
  `<button onClick={handlePrevPage} disabled={pageNumber <= 1 || !!animationState} className="absolute left-0 top-0 w-1/4 h-full z-20 cursor-pointer opacity-0" />`
);

content = content.replace(
  /<button[^>]*onClick=\{handleNextPage\}[^>]*>[\s\S]*?<ChevronRight className="w-5 h-5" \/>\s*<\/button>/g,
  `<button onClick={handleNextPage} disabled={pageNumber + (isMobile ? 1 : 2) > numPages || !!animationState} className="absolute right-0 top-0 w-1/4 h-full z-20 cursor-pointer opacity-0" />`
);

fs.writeFileSync('client/src/components/Reader.jsx', content);

// Also remove CSS borders from book-page-half
let css = fs.readFileSync('client/src/index.css', 'utf8');
css = css.replace(/border: 1px solid #e2e8f0;/, 'border: none;');
css = css.replace(/border-radius: 12px;/g, 'border-radius: 0px;');
css = css.replace(/box-shadow:[^;]+;/g, 'box-shadow: none;');
fs.writeFileSync('client/src/index.css', css);

console.log('Refactor 8 applied');
