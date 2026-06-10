const fs = require('fs');
const file = 'src/components/Reader.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Imports
code = code.replace(
  'ZoomIn, ZoomOut, BookOpen',
  'ZoomIn, ZoomOut, BookOpen, PenTool, Eraser, Trash2, MousePointer2'
);

// 2. State
code = code.replace(
  '// 3D Flip animation state',
  `// Drawing Tools State
  const [activeTool, setActiveTool] = useState('none');
  const [drawingColor, setDrawingColor] = useState('#ef4444');
  const [drawings, setDrawings] = useState({});
  const leftDrawingCanvasRef = useRef(null);
  const rightDrawingCanvasRef = useRef(null);
  const currentStrokeRef = useRef(null);
  const isDrawingRef = useRef(false);

  // 3D Flip animation state`
);

// 3. drawPage
code = code.replace(
  `canvas.style.width = \`\${displayW}px\`;
      canvas.style.height = \`\${displayH}px\`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);`,
  `canvas.style.width = \`\${displayW}px\`;
      canvas.style.height = \`\${displayH}px\`;
      canvas.classList.add('pdf-render');

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);`
);

// 4. Drawing logic
const drawingLogic = `
  const redrawDrawings = useCallback((pageNum, canvas) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const pageDrawings = drawings[pageNum] || [];
    
    const displayW = canvas.width;
    const displayH = canvas.height;

    pageDrawings.forEach(stroke => {
      if (stroke.points.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x * displayW, stroke.points[0].y * displayH);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x * displayW, stroke.points[i].y * displayH);
      }
      if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 30;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = 3;
      }
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    });
    ctx.globalCompositeOperation = 'source-over';
  }, [drawings]);

  useEffect(() => {
    if (leftDrawingCanvasRef.current) {
      leftDrawingCanvasRef.current.width = leftCanvasRef.current?.clientWidth || 0;
      leftDrawingCanvasRef.current.height = leftCanvasRef.current?.clientHeight || 0;
      redrawDrawings(pageNumber, leftDrawingCanvasRef.current);
    }
    if (!isMobile && viewMode === 'double' && rightDrawingCanvasRef.current) {
      rightDrawingCanvasRef.current.width = rightCanvasRef.current?.clientWidth || 0;
      rightDrawingCanvasRef.current.height = rightCanvasRef.current?.clientHeight || 0;
      redrawDrawings(pageNumber + 1, rightDrawingCanvasRef.current);
    }
  }, [drawings, pageNumber, isMobile, viewMode, bookDimensions.width, redrawDrawings]);

  const handlePointerDown = (e, pageNum, canvasRef) => {
    if (activeTool === 'none') return;
    isDrawingRef.current = true;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    currentStrokeRef.current = {
      tool: activeTool,
      color: drawingColor,
      points: [{x, y}]
    };
  };

  const handlePointerMove = (e, pageNum, canvasRef) => {
    if (!isDrawingRef.current || activeTool === 'none' || !currentStrokeRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    currentStrokeRef.current.points.push({x, y});
    
    const ctx = canvas.getContext('2d');
    const points = currentStrokeRef.current.points;
    const last = points[points.length - 2];
    const curr = points[points.length - 1];
    
    ctx.beginPath();
    ctx.moveTo(last.x * canvas.width, last.y * canvas.height);
    ctx.lineTo(curr.x * canvas.width, curr.y * canvas.height);
    
    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 30;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = drawingColor;
      ctx.lineWidth = 3;
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  };

  const handlePointerUp = (e, pageNum) => {
    if (!isDrawingRef.current || activeTool === 'none') return;
    isDrawingRef.current = false;
    
    if (currentStrokeRef.current && currentStrokeRef.current.points.length > 0) {
      setDrawings(prev => {
        const pageDrawings = prev[pageNum] || [];
        return {
          ...prev,
          [pageNum]: [...pageDrawings, currentStrokeRef.current]
        };
      });
    }
    currentStrokeRef.current = null;
  };

  // Next page — with 3D flip`;

code = code.replace('  // Next page — with 3D flip', drawingLogic);

// 5. Swipe handling
code = code.replace(
  '  const handleTouchStart = (e) => {\n    touchStartX',
  `  const handleTouchStart = (e) => {
    if (activeTool !== 'none') return;
    touchStartX`
);

// 6. Toolbar
const toolbarStr = `
          {/* Floating Drawing Toolbar */}
          <div className="absolute left-4 top-4 z-40 flex flex-col items-center gap-2 bg-white/90 backdrop-blur-md border border-gray-200 shadow-lg rounded-2xl p-2 animate-in fade-in slide-in-from-left-4"
               onPointerDown={e => e.stopPropagation()}>
            <button onClick={() => setActiveTool('none')} className={\`p-2 rounded-xl transition-all \${activeTool === 'none' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:bg-orange-50 hover:text-orange-600'}\`} title="Cursor / Swipe">
              <MousePointer2 className="w-5 h-5" />
            </button>
            <button onClick={() => setActiveTool('pen')} className={\`p-2 rounded-xl transition-all \${activeTool === 'pen' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:bg-orange-50 hover:text-orange-600'}\`} title="Pen Tool">
              <PenTool className="w-5 h-5" />
            </button>
            <button onClick={() => setActiveTool('eraser')} className={\`p-2 rounded-xl transition-all \${activeTool === 'eraser' ? 'bg-pink-500 text-white shadow-md' : 'text-gray-500 hover:bg-pink-50 hover:text-pink-600'}\`} title="Eraser Tool">
              <Eraser className="w-5 h-5" />
            </button>
            
            <div className="w-full h-px bg-gray-200 my-1" />
            
            {['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#000000'].map(color => (
              <button key={color} onClick={() => setDrawingColor(color)} className={\`w-5 h-5 rounded-full transition-all border-2 \${drawingColor === color ? 'scale-110 border-gray-400 shadow-sm' : 'border-transparent hover:scale-110'}\`} style={{ backgroundColor: color }} />
            ))}

            <div className="w-full h-px bg-gray-200 my-1" />
            
            <button onClick={() => setDrawings(prev => ({ ...prev, [pageNumber]: [], [pageNumber + 1]: [] }))} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Clear Page">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
`;
code = code.replace(
  '<div className="flex-1 flex flex-col items-center overflow-hidden bg-slate-100" onMouseUp={handleMouseUpTextSelection}\n          style={{ gap: 0 }}>',
  '<div className="flex-1 flex flex-col items-center overflow-hidden bg-slate-100 relative" onMouseUp={handleMouseUpTextSelection}\n          style={{ gap: 0 }}>' + toolbarStr
);

// 7. Left Canvas
const leftCanvasOld = `<div className="w-full h-full flex items-center justify-center" style={{ padding: isMobile ? '6px' : '8px' }}>
                        <canvas ref={leftCanvasRef} className="pointer-events-none" style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }} />
                      </div>`;
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
code = code.replace(leftCanvasOld, leftCanvasNew);

// 8. Right Canvas
const rightCanvasOld = `<div className="w-full h-full flex items-center justify-center" style={{ padding: '8px' }}>
                              <canvas ref={rightCanvasRef} className="pointer-events-none" style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }} />
                            </div>`;
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
code = code.replace(rightCanvasOld, rightCanvasNew);

fs.writeFileSync(file, code);
console.log('Patched Reader.jsx');
