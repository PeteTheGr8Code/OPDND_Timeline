
// Cue card markup, image pinning, and image persistence.
//
// Image priority for each card, highest first:
//   1. An image someone pinned at runtime via the camera icon (stored
//      through Claude's window.storage when available, or in-memory
//      for the current page load when hosted elsewhere).
//   2. A static file baked into the images/ folder, named by the
//      event's index: images/0.jpg, images/1.png, images/2.webp, etc.
//      (see images/README.md for the full index -> event mapping).
//   3. The "no image pinned" placeholder.
 
const CAMERA_SVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f2e9d3" stroke-width="1.6"><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.4"/></svg>`;
const IMG_PLACEHOLDER_SVG = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6b5a3d" stroke-width="1.4"><rect x="3" y="5" width="18" height="14" rx="1.5"/><circle cx="8.5" cy="10" r="1.5"/><path d="M21 16l-5.5-5.5L9 17"/></svg>`;
 
const hasStorage = typeof window.storage !== 'undefined' && window.storage;
const memoryImages = {}; // fallback when window.storage isn't available (e.g. plain GitHub Pages hosting)
 
const IMAGE_DIR = 'images/';
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
 
function keyFor(idx){ return 'opdnd-card-img:' + idx; }
 
async function loadImage(idx){
  if(hasStorage){
    try{
      const res = await window.storage.get(keyFor(idx), false);
      return res ? res.value : null;
    }catch(e){ return null; }
  }
  return memoryImages[idx] || null;
}
 
async function saveImage(idx, dataUrl){
  if(hasStorage){
    try{ await window.storage.set(keyFor(idx), dataUrl, false); }catch(e){ console.error('storage save failed', e); }
  }else{
    memoryImages[idx] = dataUrl;
  }
}
 
// Tries images/{idx}.jpg, images/{idx}.jpeg, images/{idx}.png, images/{idx}.webp
// in order and resolves with the first one that actually loads, or null
// if none of them exist.
function resolveStaticImage(idx){
  return new Promise(resolve=>{
    let i = 0;
    const tryNext = ()=>{
      if(i >= IMAGE_EXTENSIONS.length){ resolve(null); return; }
      const url = `${IMAGE_DIR}${idx}.${IMAGE_EXTENSIONS[i]}`;
      const probe = new Image();
      probe.onload = () => resolve(url);
      probe.onerror = () => { i++; tryNext(); };
      probe.src = url;
    };
    tryNext();
  });
}
 
function resizeImage(file, maxDim=640){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let {width,height} = img;
        if(width > height && width > maxDim){ height = height*(maxDim/width); width = maxDim; }
        else if(height > maxDim){ width = width*(maxDim/height); height = maxDim; }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img,0,0,width,height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
 
function eraColor(id){ return ERAS.find(e=>e.id===id).color; }
 
function cardHTML(ev, idx){
  return `
  <div class="card-scene">
    <div class="card" data-idx="${idx}" style="--era-color:${eraColor(ev.era)}">
      <div class="face front">
        <div class="tape"></div>
        <div class="img-slot" data-slot="${idx}">
          <div class="img-placeholder" data-ph="${idx}">${IMG_PLACEHOLDER_SVG}<div>no image pinned</div></div>
          <label class="upload-btn" title="Pin an image">
            ${CAMERA_SVG}
            <input type="file" accept="image/*" data-upload="${idx}">
          </label>
        </div>
        <div class="card-body">
          <span class="stamp">Year ${ev.label}</span>
          <h3 class="card-title">${ev.title}</h3>
          <span class="flip-hint">tap to read report →</span>
        </div>
      </div>
      <div class="face back">
        <span class="stamp">Year ${ev.label}</span>
        <h3 class="card-title">${ev.title}</h3>
        <p>${ev.text}</p>
        <span class="flip-hint">← tap to flip back</span>
      </div>
    </div>
  </div>`;
}
 
function renderImage(idx, dataUrl){
  const slot = document.querySelector(`.img-slot[data-slot="${idx}"]`);
  if(!slot) return;
  let img = slot.querySelector('img');
  if(!img){
    img = document.createElement('img');
    slot.prepend(img);
  }
  img.src = dataUrl;
  const ph = slot.querySelector(`[data-ph="${idx}"]`);
  if(ph) ph.style.display = 'none';
}
 
async function loadAllImages(){
  await Promise.all(EVENTS.map(async (ev, idx)=>{
    const pinned = await loadImage(idx);
    if(pinned){ renderImage(idx, pinned); return; }
    const staticUrl = await resolveStaticImage(idx);
    if(staticUrl) renderImage(idx, staticUrl);
  }));
}
 
