const DEFAULTS = { forwardHead: 0.3, shoulderTilt: 0.2, eyeReminder: 20 };

// Load saved settings
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(DEFAULTS, (items) => {
    document.getElementById('forwardHead').value = items.forwardHead;
    document.getElementById('shoulderTilt').value = items.shoulderTilt;
    document.getElementById('eyeReminder').value = items.eyeReminder;
  });
});

// Save settings
document.getElementById('saveBtn').addEventListener('click', () => {
  const forwardHead = parseFloat(document.getElementById('forwardHead').value) || DEFAULTS.forwardHead;
  const shoulderTilt = parseFloat(document.getElementById('shoulderTilt').value) || DEFAULTS.shoulderTilt;
  const eyeReminder = parseInt(document.getElementById('eyeReminder').value) || DEFAULTS.eyeReminder;

  chrome.storage.sync.set({ forwardHead, shoulderTilt, eyeReminder }, () => {
    const status = document.getElementById('status');
    status.textContent = '✅ Settings saved!';
    setTimeout(() => status.textContent = '', 2000);
  });
});
