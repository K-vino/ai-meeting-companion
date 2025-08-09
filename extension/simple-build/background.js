// Simple background service worker
console.log('VMD-AI Meeting Companion background script loaded');

let isRecording = false;
let currentSession = null;

// Simple icon data URL for notifications
const ICON_DATA_URL = 'data:image/svg+xml;base64,' + btoa(`
<svg width="48" height="48" xmlns="http://www.w3.org/2000/svg">
  <rect width="48" height="48" fill="#4CAF50" rx="6"/>
  <text x="24" y="32" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">AI</text>
</svg>
`);

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details.reason);
  
  if (details.reason === 'install') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png',
      title: 'VMD-AI Meeting Companion',
      message: 'Welcome! Click the extension icon to get started.'
    });
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
      handleToggleSidebar(sender.tab.id)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
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
  'https://vmd-ai-meeting-companion.herokuapp.com',
  'https://vmd-ai-meeting-companion.railway.app',
  'https://vmd-ai-meeting-companion.onrender.com',
  'http://localhost:3000' // Fallback for local development
];

let activeServerUrl = null;

// Test server connection on startup
async function testServerConnection() {
  console.log('Testing server connections...');

  for (const url of SERVER_URLS) {
    try {
      console.log(`Testing: ${url}`);
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        activeServerUrl = url;
        console.log(`✅ Server connection successful: ${url}`);
        return;
      } else {
        console.log(`❌ Server responded with error: ${response.status} for ${url}`);
      }
    } catch (error) {
      console.log(`❌ Server connection failed for ${url}:`, error.message);
    }
  }

  console.log('⚠️ No servers available. Extension will use demo mode.');
  activeServerUrl = null;
}

// Test connection when extension starts
testServerConnection();
