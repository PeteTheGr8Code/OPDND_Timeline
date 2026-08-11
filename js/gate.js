// ============================================================
// GM PASSWORD GATE
// ------------------------------------------------------------
// IMPORTANT: this is a *casual-glance* deterrent, not real security.
// This page has no server — anyone who opens "view source" or dev
// tools can still read every event's text in the era data files under
// js/data/, password or not. It just stops someone from scrolling and
// spoiling themselves at the table.
//
// The password is hardcoded below as a SHA-256 hash, not plain text,
// so a casual look at the source won't reveal it directly. To change
// it later, run this in any browser console and paste the result in:
//   await crypto.subtle.digest('SHA-256', new TextEncoder().encode('yourNewPassword'))
//     .then(b => [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join(''))
// ============================================================
const DEFAULT_PW_HASH = "7d07258cec2508305a8b896a6531dedd35e26ddd28dc2f8e038885675c62e7cb"; // OPDNDPeteTheGr8$$

let unlocked = false;

async function sha256(str){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
}

function getStoredHash(){
  return DEFAULT_PW_HASH;
}

function renderGateLocked(){
  const slot = document.getElementById('gate-slot');
  slot.innerHTML = `
    <div class="gate" id="gate">
      <div class="lock-icon">&#128274;</div>
      <h2>Pre-Campaign Archive — Locked</h2>
      <p>Everything before Year 470 is sealed. Enter the password to reveal the full history.</p>
      <div class="gate-form">
        <input type="password" id="gate-input" placeholder="password" autocomplete="off">
        <button id="gate-submit">Unlock</button>
      </div>
      <div class="gate-error" id="gate-error"></div>
    </div>
  `;
  const submit = async ()=>{
    const val = document.getElementById('gate-input').value;
    const hash = await sha256(val);
    if(hash === getStoredHash()){
      unlocked = true;
      applyLockState();
      renderGateUnlocked();
    }else{
      document.getElementById('gate-error').textContent = 'Wrong password.';
      const g = document.getElementById('gate');
      g.classList.remove('shake'); void g.offsetWidth; g.classList.add('shake');
    }
  };
  document.getElementById('gate-submit').addEventListener('click', submit);
  document.getElementById('gate-input').addEventListener('keydown', e=>{ if(e.key==='Enter') submit(); });
}

function renderGateUnlocked(){
  const slot = document.getElementById('gate-slot');
  slot.innerHTML = `
    <div class="unlocked-bar">
      &#128275; Archive unlocked — full timeline visible.
      <button id="relock">Re-lock</button>
    </div>
  `;
  document.getElementById('relock').addEventListener('click', ()=>{
    unlocked = false;
    applyLockState();
    renderGateLocked();
  });
}

function initGate(){
  unlocked = false;
  applyLockState();
  renderGateLocked();
}
