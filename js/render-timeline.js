// Builds the era navigation chips and the timeline spine itself, wires
// up card flip/upload interactions, and applies the GM lock state
// (which section stays visible while locked, which are hidden).

function buildNav(){
  const nav = document.getElementById('nav');
  const all = document.createElement('div');
  all.className = 'chip active';
  all.textContent = 'All Eras';
  all.dataset.era = 'all';
  nav.appendChild(all);
  ERAS.forEach(era=>{
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.textContent = era.name;
    chip.dataset.era = era.id;
    chip.style.setProperty('--chip-color', era.color);
    nav.appendChild(chip);
  });
  nav.addEventListener('click', e=>{
    const chip = e.target.closest('.chip');
    if(!chip) return;
    [...nav.children].forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
    const era = chip.dataset.era;
    document.querySelectorAll('.era').forEach(el=>{
      const isCampaign = el.dataset.era === 'e6';
      const matches = (era==='all' || el.dataset.era===era);
      const allowedByLock = unlocked || isCampaign;
      el.style.display = (matches && allowedByLock) ? '' : 'none';
    });
    if(era!=='all'){
      document.querySelector(`.era[data-era="${era}"]`)?.scrollIntoView({behavior:'smooth', block:'start'});
    }
  });
}

function buildSpine(){
  const wrap = document.getElementById('spine');
  ERAS.forEach(era=>{
    const eraEvents = EVENTS.map((e,i)=>({...e, idx:i})).filter(e=>e.era===era.id);
    const section = document.createElement('div');
    section.className = 'era';
    section.dataset.era = era.id;

    section.innerHTML = `
      <div class="era-tab">
        <div class="era-label" style="--era-color:${era.color}">${era.name}</div>
        <div class="era-years">${era.years}</div>
      </div>
    `;

    eraEvents.forEach((ev, i)=>{
      const row = document.createElement('div');
      row.className = 'event-row ' + (i % 2 === 0 ? 'left' : 'right');
      row.innerHTML = `
        <div class="year-pin"><div class="dot"></div><div class="yr">${ev.label}</div></div>
        ${cardHTML(ev, ev.idx)}
      `;
      section.appendChild(row);
    });

    wrap.appendChild(section);
  });
}

function wireCards(){
  document.querySelectorAll('.card').forEach(card=>{
    card.addEventListener('click', e=>{
      if(e.target.closest('.upload-btn')) return;
      card.classList.toggle('flipped');
    });
  });

  document.querySelectorAll('[data-upload]').forEach(input=>{
    input.addEventListener('click', e=>e.stopPropagation());
    input.addEventListener('change', async e=>{
      e.stopPropagation();
      const file = e.target.files[0];
      if(!file) return;
      const idx = input.dataset.upload;
      const dataUrl = await resizeImage(file);
      await saveImage(idx, dataUrl);
      renderImage(idx, dataUrl);
    });
  });
}

function applyLockState(){
  document.querySelectorAll('.era').forEach(el=>{
    if(el.dataset.era === 'e6') return; // campaign era always visible
    el.style.display = unlocked ? '' : 'none';
  });
  document.querySelectorAll('#nav .chip').forEach(chip=>{
    if(chip.dataset.era === 'all' || chip.dataset.era === 'e6') return;
    chip.style.display = unlocked ? '' : 'none';
  });
}
