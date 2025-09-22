let isMonitoring = false;
let model, videoElement, requestID;

const TFJS_URL = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js';
const MOVENET_URL = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/movenet@2.0.4/dist/movenet.min.js';

const loadScript = (url) => new Promise((resolve, reject) => {
  if (document.querySelector(`script[src="${url}"]`)) return resolve();
  const script = document.createElement('script');
  script.src = url;
  script.onload = resolve;
  script.onerror = reject;
  document.head.appendChild(script);
});

const loadLibraries = async () => {
  if (typeof tf === 'undefined') await loadScript(TFJS_URL);
  if (typeof movenet === 'undefined') await loadScript(MOVENET_URL);
};

const setupCamera = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
  videoElement = document.createElement('video');
  videoElement.srcObject = stream;
  videoElement.style.display = 'none';
  document.body.appendChild(videoElement);
  await videoElement.play();
};

const estimatePose = async () => {
  if (!isMonitoring) return;
  const poses = await model.estimatePoses(videoElement, { maxPoses: 1, flipHorizontal: true });
  if (poses && poses.length) checkPosture(poses[0].keypoints);
  requestID = requestAnimationFrame(estimatePose);
};

const checkPosture = (keypoints) => {
  const NOSE = keypoints.find(k => k.name === 'nose');
  const L_SHOULDER = keypoints.find(k => k.name === 'left_shoulder');
  const R_SHOULDER = keypoints.find(k => k.name === 'right_shoulder');

  if (NOSE && L_SHOULDER && R_SHOULDER) {
    const noseForward = NOSE.x - (L_SHOULDER.x + R_SHOULDER.x)/2 > 50;
    const shoulderTilt = Math.abs(L_SHOULDER.y - R_SHOULDER.y) > 20;
    if (noseForward || shoulderTilt) triggerBadPostureFeedback();
    else triggerGoodPostureFeedback();
  }
};

const triggerBadPostureFeedback = () => {
  if (!document.getElementById('badPostureStyle')) {
    const style = document.createElement('style');
    style.id = 'badPostureStyle';
    style.innerHTML = 'body, html { filter: blur(5px) grayscale(50%); transition: filter 0.5s ease-in-out; }';
    document.head.appendChild(style);
  }
};

const triggerGoodPostureFeedback = () => {
  const style = document.getElementById('badPostureStyle');
  if (style) style.remove();
};

let eyeTimer;
const start202020Rule = () => eyeTimer = setInterval(showEyeReminder, 20*60*1000);
const showEyeReminder = () => {
  if (document.getElementById('eyeReminderDiv')) return;
  const div = document.createElement('div');
  div.id = 'eyeReminderDiv';
  div.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:white;padding:20px;border-radius:10px;z-index:99999;text-align:center;';
  div.innerHTML = '<h3>20-20-20 Break</h3><p>Look 20 feet away for 20 seconds.</p><button id="closeBtn">Done</button>';
  document.body.appendChild(div);
  document.getElementById('closeBtn').addEventListener('click', () => div.remove());
};

const stopMonitoring = () => {
  isMonitoring = false;
  if (requestID) cancelAnimationFrame(requestID);
  if (videoElement) { videoElement.srcObject.getTracks().forEach(t=>t.stop()); videoElement.remove(); videoElement=null; }
  triggerGoodPostureFeedback();
  if (eyeTimer) clearInterval(eyeTimer);
  const reminder = document.getElementById('eyeReminderDiv'); if (reminder) reminder.remove();
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'start-monitoring' && !isMonitoring) {
    isMonitoring = true;
    loadLibraries()
      .then(() => movenet.load({ modelType: 2 }))
      .then(loadedModel => { model = loadedModel; return setupCamera(); })
      .then(() => { estimatePose(); start202020Rule(); sendResponse({status:'started'}); })
      .catch(e => { console.error(e); sendResponse({status:'error'}); });
    return true;
  } else if (request.action === 'stop-monitoring') {
    stopMonitoring();
    sendResponse({status:'stopped'});
  }
});
