// Simple popup script
console.log('AI Meeting Companion popup loaded');

let currentTab = null;
let extensionState = null;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadCurrentTab();
    await loadExtensionState();
    await checkServerStatus();
    updateUI();
    setupEventListeners();
  } catch (error) {
    console.error('Popup initialization error:', error);
    showError('Failed to initialize popup: ' + error.message);
  } finally {
    hideLoading();
  }
});

async function loadCurrentTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tabs[0];
}

async function loadExtensionState() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
    if (response && response.success) {
      extensionState = response.data;
    } else {
      // Set default state if no response
      extensionState = {
        isRecording: false,
        currentSession: null,
        serverUrl: 'http://localhost:3000'
      };
    }
  } catch (error) {
    console.error('Error loading extension state:', error);
    // Set default state on error
    extensionState = {
      isRecording: false,
      currentSession: null,
      serverUrl: 'http://localhost:3000'
    };
  }
}

async function checkServerStatus() {
  try {
    // Get server URL from extension state
    const serverUrl = extensionState?.serverUrl;

    if (!serverUrl || serverUrl === 'No server available') {
      updateServerStatus('No Server', 'error');
      return;
    }

    const response = await fetch(`${serverUrl}/health`);
    if (response.ok) {
      const data = await response.json();
      updateServerStatus('Connected', 'success');
      console.log('Server status:', data);
    } else {
      updateServerStatus('Error', 'error');
    }
  } catch (error) {
    updateServerStatus('Disconnected', 'error');
    console.error('Server check failed:', error);
  }
}

function updateUI() {
  updatePlatformStatus();
  updateMainAction();
  updateActionButtons();
  
  const isMeetingPage = currentTab && (
    currentTab.url.includes('zoom.us') ||
    currentTab.url.includes('meet.google.com') ||
    currentTab.url.includes('teams.microsoft.com') ||
    currentTab.url.includes('teams.live.com')
  );
  
  if (isMeetingPage) {
    document.getElementById('meeting-actions').style.display = 'block';
    document.getElementById('not-meeting').style.display = 'none';
  } else {
    document.getElementById('meeting-actions').style.display = 'none';
    document.getElementById('not-meeting').style.display = 'block';
  }
}

function updateServerStatus(status, type) {
  const statusCard = document.getElementById('server-status');
  const statusValue = statusCard.querySelector('.status-value');
  statusValue.textContent = status;
  statusCard.className = `status-card ${type}`;
}

function updatePlatformStatus() {
  const statusCard = document.getElementById('platform-status');
  const statusValue = statusCard.querySelector('.status-value');
  
  if (!currentTab || !currentTab.url) {
    statusValue.textContent = 'Unknown';
    statusCard.className = 'status-card';
    return;
  }
  
  let platform = 'Not in meeting';
  let type = 'warning';
  
  if (currentTab.url.includes('zoom.us')) {
    platform = 'Zoom';
    type = 'success';
  } else if (currentTab.url.includes('meet.google.com')) {
    platform = 'Google Meet';
    type = 'success';
  } else if (currentTab.url.includes('teams.microsoft.com') || currentTab.url.includes('teams.live.com')) {
    platform = 'Microsoft Teams';
    type = 'success';
  }
  
  statusValue.textContent = platform;
  statusCard.className = `status-card ${type}`;
}

function updateMainAction() {
  const mainAction = document.getElementById('main-action');
  
  if (extensionState && extensionState.isRecording) {
    mainAction.textContent = 'Stop Recording';
    mainAction.className = 'action-button error';
  } else {
    mainAction.textContent = 'Start Recording';
    mainAction.className = 'action-button primary';
  }
  
  const isMeetingPage = currentTab && (
    currentTab.url.includes('zoom.us') ||
    currentTab.url.includes('meet.google.com') ||
    currentTab.url.includes('teams.microsoft.com') ||
    currentTab.url.includes('teams.live.com')
  );
  
  mainAction.disabled = !isMeetingPage;
}

function updateActionButtons() {
  const analysisAction = document.getElementById('analysis-action');
  analysisAction.disabled = !extensionState || !extensionState.isRecording;
}

function setupEventListeners() {
  document.getElementById('main-action').addEventListener('click', handleMainAction);
  document.getElementById('sidebar-action').addEventListener('click', handleSidebarAction);
  document.getElementById('analysis-action').addEventListener('click', handleAnalysisAction);
}

async function handleMainAction() {
  try {
    if (extensionState && extensionState.isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  } catch (error) {
    console.error('Main action error:', error);
    showError(error.message);
  }
}

async function startRecording() {
  if (!currentTab || !currentTab.id) {
    throw new Error('No active tab found');
  }
  
  const response = await chrome.runtime.sendMessage({
    type: 'START_RECORDING',
    tabId: currentTab.id
  });
  
  if (response.success) {
    extensionState.isRecording = true;
    updateUI();
    showSuccess('Recording started successfully!');
  } else {
    throw new Error(response.error || 'Failed to start recording');
  }
}

async function stopRecording() {
  const response = await chrome.runtime.sendMessage({
    type: 'STOP_RECORDING'
  });
  
  if (response.success) {
    extensionState.isRecording = false;
    updateUI();
    showSuccess('Recording stopped successfully!');
  } else {
    throw new Error(response.error || 'Failed to stop recording');
  }
}

async function handleSidebarAction() {
  try {
    if (!currentTab || !currentTab.id) {
      throw new Error('No active tab found');
    }
    
    const response = await chrome.runtime.sendMessage({
      type: 'TOGGLE_SIDEBAR',
      tabId: currentTab.id
    });
    
    if (response.success) {
      showSuccess('Sidebar toggled!');
    } else {
      throw new Error(response.error || 'Failed to toggle sidebar');
    }
  } catch (error) {
    console.error('Sidebar action error:', error);
    showError(error.message);
  }
}

async function handleAnalysisAction() {
  try {
    // This would trigger real-time analysis
    showSuccess('Live analysis feature coming soon!');
  } catch (error) {
    console.error('Analysis action error:', error);
    showError(error.message);
  }
}

function showError(message) {
  const errorDiv = document.getElementById('error-message');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  
  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 5000);
}

function showSuccess(message) {
  // Create temporary success message
  const successDiv = document.createElement('div');
  successDiv.className = 'info-message';
  successDiv.textContent = message;
  successDiv.style.background = '#d4edda';
  successDiv.style.borderColor = '#c3e6cb';
  successDiv.style.color = '#155724';
  
  const content = document.querySelector('.content');
  content.insertBefore(successDiv, content.firstChild);
  
  setTimeout(() => {
    if (successDiv.parentNode) {
      successDiv.parentNode.removeChild(successDiv);
    }
  }, 3000);
}

function hideLoading() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('main-content').style.display = 'block';
}
