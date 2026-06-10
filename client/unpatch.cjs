const fs = require('fs');
const file = 'src/components/Reader.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Imports
code = code.replace(
  'ZoomIn, ZoomOut, BookOpen, PenTool, Eraser, Trash2, MousePointer2',
  'ZoomIn, ZoomOut, BookOpen'
);

// 2. State
code = code.replace(
  `// Drawing Tools State
  const [activeTool, setActiveTool] = useState('none');
  const [drawingColor, setDrawingColor] = useState('#ef4444');
  const [drawings, setDrawings] = useState({});
  const leftDrawingCanvasRef = useRef(null);
  const rightDrawingCanvasRef = useRef(null);
  const currentStrokeRef = useRef(null);
  const isDrawingRef = useRef(false);

  // 3D Flip animation state`,
  `// 3D Flip animation state`
);

// 3. drawPage
code = code.replace(
  `canvas.style.width = \`\${displayW}px\`;
      canvas.style.height = \`\${displayH}px\`;
      canvas.classList.add('pdf-render');

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);`,
  `canvas.style.width = \`\${displayW}px\`;
      canvas.style.height = \`\${displayH}px\`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);`
);

// 4. Drawing logic
const drawingLogicStart = code.indexOf('const redrawDrawings = useCallback');
const drawingLogicEnd = code.indexOf('// Next page — with 3D flip');
if (drawingLogicStart !== -1 && drawingLogicEnd !== -1) {
  code = code.substring(0, drawingLogicStart) + code.substring(drawingLogicEnd);
}

// 5. Swipe handling
code = code.replace(
  `const handleTouchStart = (e) => {
    if (activeTool !== 'none') return;
    touchStartX`,
  `const handleTouchStart = (e) => {\n    touchStartX`
);

// 6. Toolbar
const toolbarStrStart = code.indexOf('{/* Floating Drawing Toolbar */}');
if (toolbarStrStart !== -1) {
  const toolbarStrEnd = code.indexOf('</div>', code.indexOf('Trash2 className="w-5 h-5" />')) + 6;
  const paddingEnd = code.indexOf('</div>', toolbarStrEnd) + 6; // To find where to cut, but actually it's easier to use a regex or string replace.
  
  // Actually, I can just replace the whole `<div className="flex-1 flex flex-col items-center overflow-hidden bg-slate-100 relative" onMouseUp={handleMouseUpTextSelection}\n          style={{ gap: 0 }}>` block.
  
  // Let's replace the toolbar directly
  const toolbarFull = code.substring(toolbarStrStart, code.indexOf('</div>', code.indexOf('title="Clear Page"')) + 16);
  code = code.replace(toolbarFull, '');
  code = code.replace(
    '<div className="flex-1 flex flex-col items-center overflow-hidden bg-slate-100 relative" onMouseUp={handleMouseUpTextSelection}\n          style={{ gap: 0 }}>',
    '<div className="flex-1 flex flex-col items-center overflow-hidden bg-slate-100" onMouseUp={handleMouseUpTextSelection}\n          style={{ gap: 0 }}>'
  );
}

// 7. Left Canvas
const leftCanvasNew = `<div className="w-full h-full flex items-center justify-center" style={{ padding: isMobile ? '6px' : '8px' }}>
                        <div className="relative inline-flex" style={{ maxWidth: '100%', maxHeight: '100%' }}>
                          <canvas ref={leftCanvasRef} className="pointer-events-none" style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }} />
                          <canvas 
                            ref={leftDrawingCanvasRef} 
                            className="absolute inset-0 w-full h-full"
                            style={{ 
                              pointerEvents: activeTool !== 'none' ? 'auto' : 'none',
                              touchAction: activeTool !== 'none' ? 'none' : 'auto'
                            }}
                            onPointerDown={(e) => handlePointerDown(e, pageNumber, leftDrawingCanvasRef)}
                            onPointerMove={(e) => handlePointerMove(e, pageNumber, leftDrawingCanvasRef)}
                            onPointerUp={(e) => handlePointerUp(e, pageNumber)}
                            onPointerCancel={(e) => handlePointerUp(e, pageNumber)}
                            onPointerLeave={(e) => handlePointerUp(e, pageNumber)}
                          />
                        </div>
                      </div>`;
const leftCanvasOld = `<div className="w-full h-full flex items-center justify-center" style={{ padding: isMobile ? '6px' : '8px' }}>
                        <canvas ref={leftCanvasRef} className="pointer-events-none" style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }} />
                      </div>`;
code = code.replace(leftCanvasNew, leftCanvasOld);

// 8. Right Canvas
const rightCanvasNew = `<div className="w-full h-full flex items-center justify-center" style={{ padding: '8px' }}>
                              <div className="relative inline-flex" style={{ maxWidth: '100%', maxHeight: '100%' }}>
                                <canvas ref={rightCanvasRef} className="pointer-events-none" style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }} />
                                <canvas 
                                  ref={rightDrawingCanvasRef} 
                                  className="absolute inset-0 w-full h-full"
                                  style={{ 
                                    pointerEvents: activeTool !== 'none' ? 'auto' : 'none',
                                    touchAction: activeTool !== 'none' ? 'none' : 'auto'
                                  }}
                                  onPointerDown={(e) => handlePointerDown(e, pageNumber + 1, rightDrawingCanvasRef)}
                                  onPointerMove={(e) => handlePointerMove(e, pageNumber + 1, rightDrawingCanvasRef)}
                                  onPointerUp={(e) => handlePointerUp(e, pageNumber + 1)}
                                  onPointerCancel={(e) => handlePointerUp(e, pageNumber + 1)}
                                  onPointerLeave={(e) => handlePointerUp(e, pageNumber + 1)}
                                />
                              </div>
                            </div>`;
const rightCanvasOld = `<div className="w-full h-full flex items-center justify-center" style={{ padding: '8px' }}>
                              <canvas ref={rightCanvasRef} className="pointer-events-none" style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }} />
                            </div>`;
code = code.replace(rightCanvasNew, rightCanvasOld);

fs.writeFileSync(file, code);
console.log('Unpatched Reader.jsx');
