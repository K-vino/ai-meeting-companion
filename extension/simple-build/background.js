// Simple background service worker
console.log('VMD-AI Meeting Companion background script loaded');

let isRecording = false;
let currentSession = null;

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details.reason);

  if (details.reason === 'install') {
    console.log('🎉 VMD-AI Meeting Companion installed successfully!');
    console.log('💡 Click the extension icon to get started.');
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  switch (message.type) {
    case 'GET_STATE':
      sendResponse({
        success: true,
        data: {
          isRecording: isRecording,
          currentSession: currentSession,
          serverUrl: activeServerUrl || 'No server available'
        }
      });
      break;
      
    case 'START_RECORDING':
      handleStartRecording(message.tabId)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep message channel open for async response
      
    case 'STOP_RECORDING':
      handleStopRecording()
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    case 'TOGGLE_SIDEBAR':
      const targetTabId = message.tabId || (sender && sender.tab && sender.tab.id);
      if (targetTabId) {
        handleToggleSidebar(targetTabId)
          .then(() => sendResponse({ success: true }))
          .catch(error => sendResponse({ success: false, error: error.message }));
      } else {
        sendResponse({ success: false, error: 'No active tab found' });
      }
      return true;
      
    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

// Handle tab updates to detect meeting pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    checkMeetingTab(tab);
  }
});

async function checkMeetingTab(tab) {
  const isMeetingUrl = tab.url && (
    tab.url.includes('zoom.us') ||
    tab.url.includes('meet.google.com') ||
    tab.url.includes('teams.microsoft.com') ||
    tab.url.includes('teams.live.com')
  );
  
  if (isMeetingUrl) {
    // Update badge to indicate meeting detected
    chrome.action.setBadgeText({
      text: '●',
      tabId: tab.id
    });
    
    chrome.action.setBadgeBackgroundColor({
      color: '#4CAF50',
      tabId: tab.id
    });
    
    console.log('Meeting detected on tab:', tab.id);
  } else {
    // Clear badge for non-meeting tabs
    chrome.action.setBadgeText({
      text: '',
      tabId: tab.id
    });
  }
}

async function handleStartRecording(tabId) {
  if (isRecording) {
    throw new Error('Recording already in progress');
  }
  
  const tab = await chrome.tabs.get(tabId);
  const isMeetingUrl = tab.url && (
    tab.url.includes('zoom.us') ||
    tab.url.includes('meet.google.com') ||
    tab.url.includes('teams.microsoft.com') ||
    tab.url.includes('teams.live.com')
  );
  
  if (!isMeetingUrl) {
    throw new Error('Not a meeting tab');
  }
  
  // Create session
  currentSession = {
    id: `session_${Date.now()}`,
    startTime: new Date().toISOString(),
    platform: detectPlatform(tab.url),
    tabId: tabId
  };
  
  isRecording = true;
  
  // Update badge
  chrome.action.setBadgeText({
    text: 'REC',
    tabId: tabId
  });
  
  chrome.action.setBadgeBackgroundColor({
    color: '#F44336',
    tabId: tabId
  });
  
  // Notify content script
  try {
    await chrome.tabs.sendMessage(tabId, {
      type: 'RECORDING_STARTED',
      session: currentSession
    });
  } catch (error) {
    console.log('Could not notify content script:', error);
  }
  
  console.log('Recording started for session:', currentSession.id);
}

async function handleStopRecording() {
  if (!isRecording || !currentSession) {
    return;
  }
  
  isRecording = false;
  
  // Update session
  currentSession.endTime = new Date().toISOString();
  
  // Update badge
  if (currentSession.tabId) {
    chrome.action.setBadgeText({
      text: '●',
      tabId: currentSession.tabId
    });
    
    chrome.action.setBadgeBackgroundColor({
      color: '#4CAF50',
      tabId: currentSession.tabId
    });
    
    // Notify content script
    try {
      await chrome.tabs.sendMessage(currentSession.tabId, {
        type: 'RECORDING_STOPPED',
        session: currentSession
      });
    } catch (error) {
      console.log('Could not notify content script:', error);
    }
  }
  
  console.log('Recording stopped for session:', currentSession.id);
  currentSession = null;
}

async function handleToggleSidebar(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, {
      type: 'TOGGLE_SIDEBAR'
    });
  } catch (error) {
    console.log('Could not toggle sidebar:', error);
  }
}

function detectPlatform(url) {
  if (url.includes('zoom.us')) return 'zoom';
  if (url.includes('meet.google.com')) return 'google_meet';
  if (url.includes('teams.microsoft.com') || url.includes('teams.live.com')) return 'microsoft_teams';
  return 'unknown';
}

// Server configuration
const SERVER_URLS = [
  'http://localhost:3000' // Local development server
  // Add your deployed server URLs here when ready:
  // 'https://your-app.herokuapp.com',
  // 'https://your-app.railway.app',
  // 'https://your-app.onrender.com'
];

let activeServerUrl = null;

// Test server connection on startup
async function testServerConnection() {
  console.log('🔍 Testing server connections...');

  for (const url of SERVER_URLS) {
    try {
      console.log(`Testing: ${url}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch(`${url}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        activeServerUrl = url;
        console.log(`✅ Server connection successful: ${url}`);
        console.log(`📊 Server info:`, data);
        return;
      } else {
        console.log(`❌ Server responded with error: ${response.status} for ${url}`);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`⏱️ Timeout connecting to ${url}`);
      } else if (error.message.includes('CORS')) {
        console.log(`🚫 CORS error for ${url} - server not configured for extensions`);
      } else {
        console.log(`❌ Server connection failed for ${url}:`, error.message);
      }
    }
  }

  console.log('⚠️ No servers available. Extension will use demo mode.');
  activeServerUrl = null;
}

// Test connection when extension starts
testServerConnection();
