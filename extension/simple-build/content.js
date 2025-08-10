// Simple content script
console.log('VMD-AI Meeting Companion content script loaded');

let sidebarIframe = null;
let isRecording = false;

// Check if this is a meeting page
const isMeetingPage = window.location.href.includes('zoom.us') ||
                     window.location.href.includes('meet.google.com') ||
                     window.location.href.includes('teams.microsoft.com') ||
                     window.location.href.includes('teams.live.com');

console.log('Current URL:', window.location.href);
console.log('Is meeting page:', isMeetingPage);

// Always initialize content script (not just on meeting pages)
initializeContentScript();

function initializeContentScript() {
  console.log('Initializing content script...');

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Content script received message:', message);

    switch (message.type) {
      case 'RECORDING_STARTED':
        console.log('Handling RECORDING_STARTED');
        handleRecordingStarted(message.session);
        break;

      case 'RECORDING_STOPPED':
        console.log('Handling RECORDING_STOPPED');
        handleRecordingStopped(message.session);
        break;

      case 'TOGGLE_SIDEBAR':
        console.log('Handling TOGGLE_SIDEBAR');
        toggleSidebar();
        break;

      case 'PING':
        console.log('Responding to PING');
        break;
    }

    sendResponse({ success: true });
    return true; // Keep the message channel open for async responses
  });

  // Inject styles
  injectStyles();
  console.log('Content script initialized successfully');
}

function handleRecordingStarted(session) {
  isRecording = true;
  showSidebar();
  showNotification('Recording Started', 'VMD-AI Meeting Companion is now active', 'success');
}

function handleRecordingStopped(session) {
  isRecording = false;
  showNotification('Recording Stopped', 'Meeting session has ended', 'info');
}

function showSidebar() {
  if (sidebarIframe) {
    sidebarIframe.style.display = 'block';
    return;
  }

  // Create sidebar iframe
  sidebarIframe = document.createElement('iframe');
  sidebarIframe.id = 'vmd-ai-meeting-companion-sidebar';
  sidebarIframe.src = chrome.runtime.getURL('sidebar.html');
  sidebarIframe.style.cssText = `
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    width: 380px !important;
    height: 600px !important;
    border: none !important;
    border-radius: 12px !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
    z-index: 2147483647 !important;
    background: white !important;
    resize: both !important;
    overflow: hidden !important;
    transition: all 0.3s ease !important;
  `;

  document.body.appendChild(sidebarIframe);

  // Setup iframe communication
  window.addEventListener('message', (event) => {
    if (event.source !== sidebarIframe.contentWindow) return;

    const message = event.data;
    if (message.type === 'CLOSE_SIDEBAR') {
      hideSidebar();
    } else if (message.type === 'MINIMIZE_SIDEBAR') {
      minimizeSidebar();
    }
  });
  // Bridge requests from sidebar (iframe) to background via content script
  window.addEventListener('message', async (event) => {
    const msg = event && event.data;
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'GET_SERVER_URL') {
      try {
        const state = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
        const url = state && state.success && state.data && state.data.serverUrl ? state.data.serverUrl : null;
        window.postMessage({ type: 'SERVER_URL_RESPONSE', serverUrl: url }, '*');
      } catch (e) {
        window.postMessage({ type: 'SERVER_URL_RESPONSE', serverUrl: null }, '*');
      }
    }
  });


  console.log('Sidebar created and displayed');
}

function hideSidebar() {
  if (sidebarIframe) {
    sidebarIframe.style.display = 'none';
  }
}

function toggleSidebar() {
  console.log('toggleSidebar called, current iframe:', !!sidebarIframe);
  if (!sidebarIframe) {
    console.log('Creating new sidebar');
    showSidebar();
  } else {
    const isVisible = sidebarIframe.style.display !== 'none';
    console.log('Toggling sidebar visibility, currently visible:', isVisible);
    sidebarIframe.style.display = isVisible ? 'none' : 'block';
  }
}

function minimizeSidebar() {
  if (sidebarIframe) {
    const isMinimized = sidebarIframe.style.height === '40px';
    sidebarIframe.style.height = isMinimized ? '600px' : '40px';
  }
}

function showNotification(title, message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `amc-notification amc-${type}`;
  notification.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
    <div style="font-size: 12px; opacity: 0.9;">${message}</div>
  `;

  document.body.appendChild(notification);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 5000);
}

function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* AI Meeting Companion Styles */
    .amc-notification {
      position: fixed !important;
      top: 20px !important;
      right: 420px !important;
      background: #4CAF50 !important;
      color: white !important;
      padding: 12px 16px !important;
      border-radius: 8px !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
      z-index: 2147483646 !important;
      font-size: 14px !important;
      max-width: 300px !important;
      animation: amcSlideIn 0.3s ease !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    }

    @keyframes amcSlideIn {
      from {
        transform: translateX(100%) !important;
        opacity: 0 !important;
      }
      to {
        transform: translateX(0) !important;
        opacity: 1 !important;
      }
    }

    .amc-notification.amc-error {
      background: #F44336 !important;
    }

    .amc-notification.amc-warning {
      background: #FF9800 !important;
    }

    .amc-notification.amc-info {
      background: #2196F3 !important;
    }

    .amc-notification.amc-success {
      background: #4CAF50 !important;
    }
  `;

  document.head.appendChild(style);
}
