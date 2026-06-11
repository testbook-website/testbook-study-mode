import fs from 'fs';

let content = fs.readFileSync('client/src/components/Reader.jsx', 'utf8');

// 1. Next/Prev page handlers
content = content.replace(
  /  \/\/ Next page — with 3D flip[\s\S]*?  \/\/ Prev page — with 3D flip/m,
  `  // Next page
  const handleNextPage = () => {
    if (flipBookRef.current) flipBookRef.current.pageFlip().flipNext();
  };

  // Prev page — with 3D flip`
);

content = content.replace(
  /  \/\/ Prev page — with 3D flip[\s\S]*?  \/\/ Jump to specific page/m,
  `  // Prev page
  const handlePrevPage = () => {
    if (flipBookRef.current) flipBookRef.current.pageFlip().flipPrev();
  };

  // Jump to specific page`
);

// 2. Remove drawPage
const cancelIndex = content.indexOf('  // Helper to cancel ongoing render tasks');
const extractIndex = content.indexOf('  // Helper to extract text from a page');
if (cancelIndex !== -1 && extractIndex !== -1) {
  content = content.substring(0, cancelIndex) + content.substring(extractIndex);
}

// 3. Replace size observer useEffect
content = content.replace(
  /  \/\/ Listen to window size changes[\s\S]*?  \}, \[\]\);/m,
  `  // Measure initial book dimensions
  useEffect(() => {
    if (!pdfDoc) return;
    pdfDoc.getPage(1).then(page => {
      const viewport = page.getViewport({ scale: 1.0 });
      setBookDimensions({ width: Math.floor(viewport.width), height: Math.floor(viewport.height) });
    });
  }, [pdfDoc]);`
);

// 4. Replace Book spread
const spreadStart = content.indexOf('              {/* Book spread */}');
const spreadEnd = content.indexOf('              {/* Next arrow */}');

if (spreadStart !== -1 && spreadEnd !== -1) {
  const newSpread = `              {/* Book spread */}
              <div 
                ref={containerRef} 
                className="w-full h-full flex items-center justify-center p-4 relative"
              >
                {bookDimensions.width > 0 && (
                  <HTMLFlipBook 
                    width={bookDimensions.width} 
                    height={bookDimensions.height} 
                    size="stretch"
                    minWidth={315}
                    maxWidth={1000}
                    minHeight={400}
                    maxHeight={1533}
                    maxShadowOpacity={0.5}
                    showCover={false}
                    mobileScrollSupport={true}
                    usePortrait={isMobile || viewMode === 'single'}
                    onFlip={(e) => {
                      setPageNumber(e.data + 1);
                      playPageTurnSound(isSoundMuted);
                      handleSaveProgress();
                    }}
                    ref={flipBookRef}
                    className="book-viewport drop-shadow-2xl"
                  >
                    {Array.from({ length: numPages }).map((_, i) => {
                      const pageIdx = i + 1;
                      const shouldRender = Math.abs(pageIdx - pageNumber) <= 4;
                      return (
                        <Page key={i}>
                          {shouldRender ? (
                            <PdfPageRenderer 
                              pdf={pdfDoc} 
                              pageNum={pageIdx} 
                              zoom={zoom} 
                              isBookmarked={isPageBookmarked(pageIdx)} 
                              toggleBookmark={() => toggleBookmark(pageIdx)} 
                            />
                          ) : (
                            <div className="w-full h-full bg-white flex items-center justify-center text-gray-300">...</div>
                          )}
                        </Page>
                      );
                    })}
                  </HTMLFlipBook>
                )}
              </div>\n\n`;
  content = content.substring(0, spreadStart) + newSpread + content.substring(spreadEnd);
}

// 5. Add sound toggle
content = content.replace(
  /<MessageSquare className="w-4 h-4" \/>\n            <span className="hidden sm:inline">Ask Doubt<\/span>\n          <\/button>\n        <\/div>\n      <\/header>/m,
  `<MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Ask Doubt</span>
          </button>
          
          <button
            onClick={() => setIsSoundMuted(!isSoundMuted)}
            className="p-2 border rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer bg-white border-gray-200 hover:border-orange-300 text-gray-600"
            title={isSoundMuted ? "Unmute Page Flip" : "Mute Page Flip"}
          >
            {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>`
);


fs.writeFileSync('client/src/components/Reader.jsx', content);
console.log('Refactoring step 2 applied.');
