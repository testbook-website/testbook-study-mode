import fs from 'fs';

let content = fs.readFileSync('client/src/index.css', 'utf8');

const newCSS = `

/* Page Curl Hover Effect */
.book-page-half::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  background: linear-gradient(225deg, #ffffff 45%, #d1d5db 50%, #9ca3af 55%, transparent 60%);
  box-shadow: -2px 2px 5px rgba(0,0,0,0.1);
  border-bottom-left-radius: 4px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  pointer-events: none;
  z-index: 30;
}

.book-page-half.right-page::after {
  right: 0;
  left: auto;
  background: linear-gradient(225deg, #ffffff 45%, #d1d5db 50%, #9ca3af 55%, transparent 60%);
  box-shadow: -2px 2px 5px rgba(0,0,0,0.1);
}

.book-page-half.left-page::after {
  left: 0;
  right: auto;
  background: linear-gradient(135deg, #ffffff 45%, #d1d5db 50%, #9ca3af 55%, transparent 60%);
  box-shadow: 2px 2px 5px rgba(0,0,0,0.1);
  border-bottom-right-radius: 4px;
  border-bottom-left-radius: 0;
}

.book-page-half:hover::after {
  width: 40px;
  height: 40px;
}

.book-page-half:active::after {
  width: 80px;
  height: 80px;
  background: linear-gradient(225deg, #ffffff 30%, #d1d5db 45%, #9ca3af 50%, transparent 55%);
}

.book-page-half.left-page:active::after {
  background: linear-gradient(135deg, #ffffff 30%, #d1d5db 45%, #9ca3af 50%, transparent 55%);
}

/* Hide standard scrollbars for a clean look */
.overflow-auto::-webkit-scrollbar {
  display: none;
}
.overflow-auto {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
`;

fs.appendFileSync('client/src/index.css', newCSS);
console.log('CSS updated');
