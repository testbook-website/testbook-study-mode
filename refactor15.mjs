import fs from 'fs';

let content = fs.readFileSync('client/src/components/Reader.jsx', 'utf8');

// 1. Add Maximize, Minimize to imports
content = content.replace(
  /ZoomIn, ZoomOut, BookOpen/,
  'ZoomIn, ZoomOut, BookOpen, Maximize, Minimize'
);

// 2. Add isFullscreen state
content = content.replace(
  /const \[zoom, setZoom\] = useState\(1\.0\); \/\/ 1\.0, 1\.25, 1\.5, 1\.75, 2\.0, 2\.25, 2\.5/,
  "const [zoom, setZoom] = useState(1.0); // 1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5\n  const [isFullscreen, setIsFullscreen] = useState(false);"
);

// 3. Add fullscreen event listener to existing window resize effect
const oldEffect = `  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);`;

const newEffect = `  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    
    window.addEventListener('resize', handleResize);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);`;

content = content.replace(oldEffect, newEffect);

// 4. Add Fullscreen toggle button to the layout UI
const oldButton = `<BookOpen className="w-4 h-4" />
                    {viewMode === 'double' ? '2-Page' : '1-Page'}
                  </button>
                </div>
              </div>`;

const newButton = `<BookOpen className="w-4 h-4" />
                    {viewMode === 'double' ? '2-Page' : '1-Page'}
                  </button>
                  <div className="w-px bg-gray-200 my-1"></div>
                  <button onClick={() => {
                    if (!document.fullscreenElement) {
                      document.documentElement.requestFullscreen().catch(err => console.log(err));
                    } else {
                      if (document.exitFullscreen) {
                        document.exitFullscreen();
                      }
                    }
                  }} className="px-3 py-2 text-gray-600 hover:bg-gray-50 hover:text-orange-500 transition-colors font-bold text-xs flex items-center gap-1.5 cursor-pointer" title="Toggle Fullscreen">
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    {isFullscreen ? 'Exit' : 'Full-View'}
                  </button>
                </div>
              </div>`;

content = content.replace(oldButton, newButton);

fs.writeFileSync('client/src/components/Reader.jsx', content);
console.log("Refactoring 15 done - Added Fullscreen support");
