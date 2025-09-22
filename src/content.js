// Minimal content script for Posture Guardian
// - Listens for messages {action: 'start-monitoring'|'stop-monitoring'}
// - Requests webcam permission, attaches a hidden video, and runs a lightweight loop
// - Shows simple overlays for posture and 20-20-20 eye breaks

let stream = null;
let videoEl = null;
let rafId = null;
let monitoring = false;
let lastEyeBreak = Date.now();

const EYE_BREAK_INTERVAL = 12 * 60 * 1000; // 12 minutes
const POSTURE_CHECK_INTERVAL = 1000; // 1s
let slouchStart = null;

function createControl() {
  if (document.getElementById('posture-guardian-control')) return;
  const el = document.createElement('div');
  el.id = 'posture-guardian-control';
  el.style.position = 'fixed';
  el.style.right = '12px';
  el.style.bottom = '12px';
  el.style.background = 'rgba(0,0,0,0.55)';
  el.style.color = 'white';
  el.style.padding = '8px 10px';
  el.style.borderRadius = '8px';
  el.style.zIndex = 2147483646;
  el.style.fontFamily = 'sans-serif';
  el.style.fontSize = '13px';
  el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.4)';
  el.innerHTML = `<div style="display:flex;flex-direction:column;gap:6px;">Posture Guardian</div>`;
  document.documentElement.appendChild(el);
}

function removeControl() {
  const el = document.getElementById('posture-guardian-control');
  if (el) el.remove();
}

function makeOverlay(id, html) {
  if (document.getElementById(id)) return null;
  const wrapper = document.createElement('div');
  wrapper.id = id;
  wrapper.style.position = 'fixed';
  wrapper.style.left = '50%';
  wrapper.style.top = '20%';
  wrapper.style.transform = 'translateX(-50%)';
  wrapper.style.background = 'white';
  wrapper.style.color = '#111';
  wrapper.style.padding = '18px';
  wrapper.style.borderRadius = '10px';
  wrapper.style.boxShadow = '0 10px 40px rgba(0,0,0,0.4)';
  wrapper.style.zIndex = 2147483647;
  wrapper.innerHTML = html;
  return wrapper;
}

function showPostureAlert(text = 'Please sit upright') {
  if (document.getElementById('posture-blur-overlay')) return;
  const html = `
    <h2 style="margin:0 0 8px 0;">Posture Alert</h2>
    <div style="margin-bottom:12px;">${text}</div>
    <div style="display:flex; gap:8px; justify-content:center;">\n      <button id="pg-fix-btn" style="padding:8px 12px;">I fixed it</button>\n      <button id="pg-snooze-btn" style="padding:8px 12px;">Snooze 5 min</button>\n    </div>`;
  const node = makeOverlay('posture-blur-overlay', html);
  document.documentElement.appendChild(node);
  document.getElementById('pg-fix-btn').addEventListener('click', () => {
    hidePostureAlert();
    slouchStart = null;
  });
  document.getElementById('pg-snooze-btn').addEventListener('click', () => {
    hidePostureAlert();
    slouchStart = Date.now() + 5 * 60 * 1000; // snooze 5 min
  });
}

function hidePostureAlert() {
  const el = document.getElementById('posture-blur-overlay');
  if (el) el.remove();
}

function showEyeBreak() {
  if (document.getElementById('posture-eye-overlay')) return;
  let t = 20;
  const html = `
    <h2 style="margin:0 0 8px 0;">Eye Break — 20-20-20</h2>
    <div id="pg-eye-text" style="font-size:18px; margin-bottom:12px;">Look at something far away for ${t} s</div>
    <div style="display:flex; gap:8px; justify-content:center;">\n      <button id="pg-eye-done" style="padding:8px 12px;">Done</button>\n    </div>`;
  const node = makeOverlay('posture-eye-overlay', html);
  document.documentElement.appendChild(node);
  const txt = document.getElementById('pg-eye-text');
  const interval = setInterval(() => {
    t -= 1;
    if (txt) txt.textContent = `Look at something far away for ${t} s`;
    if (t <= 0) {
      clearInterval(interval);
      hideEyeBreak();
      lastEyeBreak = Date.now();
    }
  }, 1000);
  document.getElementById('pg-eye-done').addEventListener('click', () => {
    clearInterval(interval);
    hideEyeBreak();
    lastEyeBreak = Date.now();
  });
}

function hideEyeBreak() {
  const el = document.getElementById('posture-eye-overlay');
  if (el) el.remove();
}

async function startMonitoring() {
  if (monitoring) return;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  } catch (e) {
    console.warn('Webcam access required', e);
    alert('Webcam access is required for posture detection. Please allow camera access.');
    return;
  }
  videoEl = document.createElement('video');
  videoEl.style.display = 'none';
  videoEl.autoplay = true;
  videoEl.playsInline = true;
  videoEl.muted = true;
  videoEl.srcObject = stream;
  document.body.appendChild(videoEl);

  createControl();
  monitoring = true;
  slouchStart = null;
  lastEyeBreak = Date.now();
  loop();
}

function stopMonitoring() {
  monitoring = false;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  if (videoEl) videoEl.remove();
  videoEl = null;
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  hidePostureAlert();
  hideEyeBreak();
  removeControl();
}

function loop() {
  if (!monitoring) return;
  // This is a light-weight placeholder for posture detection.
  // For now, we'll simulate slouching if the user keeps the head low for >3s
  // A proper implementation would use @tensorflow-models/pose-detection on the video frame.

  try {
    // Simulation: randomly mark slouching occasionally to demonstrate alerts
    const simulateSlouch = Math.random() < 0.02; // ~2% chance per frame
    if (simulateSlouch) {
      if (!slouchStart) slouchStart = Date.now();
      const elapsed = (Date.now() - slouchStart) / 1000;
      if (elapsed >= 3) {
        showPostureAlert(`You've been slouching for ${Math.round(elapsed)}s. Sit upright.`);
      }
    } else {
      slouchStart = null;
      hidePostureAlert();
    }

    // Eye break: every EYE_BREAK_INTERVAL show reminder
    if (Date.now() - lastEyeBreak >= EYE_BREAK_INTERVAL) {
      stopMonitoring(); // pause monitoring while showing break
      showEyeBreak();
      // After eye break completes, user can press Done which will reset lastEyeBreak.
      // We'll resume monitoring automatically after a short delay to allow the break overlay to be shown.
      setTimeout(() => {
        if (!monitoring) startMonitoring();
      }, 1000);
      return;
    }
  } catch (e) {
    console.error('Monitoring loop error', e);
  }

  rafId = requestAnimationFrame(loop);
}

// Listen for messages
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.action) return;
  if (msg.action === 'start-monitoring') startMonitoring();
  if (msg.action === 'stop-monitoring') stopMonitoring();
});

// Auto-initialize a lightweight control so user can see extension is present
createControl();

// Clean up on unload
window.addEventListener('beforeunload', () => {
  stopMonitoring();
});
