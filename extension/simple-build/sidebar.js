// Simple sidebar script
console.log('AI Meeting Companion sidebar loaded');

let isRecording = false;
let transcriptSegments = [];

// Initialize sidebar
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  startDemo();
});

function setupEventListeners() {
  document.getElementById('close-btn').addEventListener('click', () => {
    window.parent.postMessage({ type: 'CLOSE_SIDEBAR' }, '*');
  });

  document.getElementById('minimize-btn').addEventListener('click', () => {
    window.parent.postMessage({ type: 'MINIMIZE_SIDEBAR' }, '*');
  });

  // Basic AI features
  document.getElementById('summary-generate').addEventListener('click', generateSummary);
  document.getElementById('summary-speak').addEventListener('click', speakSummary);
  document.getElementById('tips-generate').addEventListener('click', generateTips);
  document.getElementById('tips-speak').addEventListener('click', speakTips);

  // Advanced features
  document.getElementById('insights-generate').addEventListener('click', generateInsights);
  document.getElementById('insights-speak').addEventListener('click', speakInsights);
  document.getElementById('actions-extract').addEventListener('click', extractActions);
  document.getElementById('actions-export').addEventListener('click', exportActions);
  document.getElementById('cleanup-generate').addEventListener('click', cleanupTranscript);
  document.getElementById('cleanup-copy').addEventListener('click', copyCleanText);

  // Quick actions
  document.getElementById('auto-summary').addEventListener('click', autoSummary);
  document.getElementById('save-notes').addEventListener('click', saveNotes);
  document.getElementById('share-link').addEventListener('click', shareLink);
  document.getElementById('download-all').addEventListener('click', downloadAll);

  // Listen for messages from content script
  window.addEventListener('message', (event) => {
    const message = event.data;
    switch (message?.type) {
      case 'RECORDING_STARTED': return handleRecordingStarted(message.session);
      case 'RECORDING_STOPPED': return handleRecordingStopped();
      case 'TRANSCRIPT_UPDATE': return handleTranscriptUpdate(message.data);
      case 'ANALYSIS_UPDATE': return handleAnalysisUpdate(message.data);
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
}

function handleRecordingStarted(session) {
  isRecording = true;
  updateTranscript('Recording started... Listening for audio...');
  setTimeout(() => { if (isRecording) simulateTranscriptUpdates(); }, 2000);
}

function handleRecordingStopped() {
  isRecording = false;
  updateTranscript('Recording stopped. Session ended.');
}

function handleTranscriptUpdate(segment) {
  transcriptSegments.push(segment);
  updateTranscript(transcriptSegments.map(s => s.text).join(' '));
}

function handleAnalysisUpdate(analysis) {
  if (analysis.actionItems) updateActionItems(analysis.actionItems);
  if (analysis.sentiment) updateSentiment(analysis.sentiment);
  if (analysis.jargonTerms) updateJargon(analysis.jargonTerms);
}

function updateTranscript(text) {
  const content = document.getElementById('transcript-content');
  content.innerHTML = text && text.trim()
    ? `<div class="transcript-text">${text}</div>`
    : '<div class="empty-state">Start recording to see live transcription</div>';
}

function updateActionItems(actionItems) {
  const content = document.getElementById('action-items-content');
  content.innerHTML = (actionItems && actionItems.length)
    ? actionItems.map(item => `
      <div class="action-item">
        <span>✅</span>
        <div class="action-text">${item.text}</div>
      </div>`).join('')
    : '<div class="empty-state">No action items detected yet</div>';
}

function updateSentiment(sentiment) {
  const content = document.getElementById('sentiment-content');
  if (sentiment?.overall) {
    const { positive, negative, neutral } = sentiment.overall;
    const max = Math.max(positive, negative, neutral);
    let label = 'Neutral', cls = 'sentiment-neutral';
    if (max === positive) { label = 'Positive'; cls = 'sentiment-positive'; }
    else if (max === negative) { label = 'Negative'; cls = 'sentiment-negative'; }
    content.innerHTML = `<div class="sentiment-indicator ${cls}">💭 ${label}</div>`;
  } else {
    content.innerHTML = '<div class="empty-state">Analyzing sentiment...</div>';
  }
}

function updateJargon(jargonTerms) {
  const content = document.getElementById('jargon-content');
  content.innerHTML = (jargonTerms && jargonTerms.length)
    ? jargonTerms.map(term => `
      <div class="jargon-term">
        <div class="jargon-word">${term.term}</div>
        <div class="jargon-definition">${term.definition}</div>
      </div>`).join('')
    : '<div class="empty-state">No jargon detected yet</div>';
}

// Demo functionality
function startDemo() {
  setTimeout(() => { if (!isRecording) showDemoContent(); }, 3000);
}

function showDemoContent() {
  updateTranscript('Welcome to AI Meeting Companion! This is a demo of the live transcription feature.');
  updateActionItems([
    { text: 'Review quarterly performance metrics', assignee: 'Team Lead' },
    { text: 'Schedule follow-up meeting for next week', assignee: 'Project Manager' }
  ]);
  updateSentiment({ overall: { positive: 0.7, neutral: 0.25, negative: 0.05 } });
  updateJargon([
    { term: 'API', definition: 'Application Programming Interface - a set of protocols for building software applications' },
    { term: 'MVP', definition: 'Minimum Viable Product - a product with just enough features to satisfy early customers' }
  ]);
}

function simulateTranscriptUpdates() {
  const demoTexts = [
    "Good morning everyone, thank you for joining today's meeting.",
    "Let's start by reviewing our quarterly performance metrics.",
    "The API integration project is progressing well.",
    "We need to schedule a follow-up meeting to discuss the MVP features.",
    "Are there any questions or concerns about the timeline?"
  ];
  let index = 0;
  const interval = setInterval(() => {
    if (!isRecording || index >= demoTexts.length) { clearInterval(interval); return; }
    transcriptSegments.push({
      id: `demo_${Date.now()}_${index}`,
      text: demoTexts[index],
      timestamp: new Date().toISOString()
    });
    updateTranscript(transcriptSegments.map(s => s.text).join(' '));
    if (index === 2) {
      updateJargon([{
        term: 'API',
        definition: 'Application Programming Interface - a set of protocols for building software applications'
      }]);
    }
    if (index === 3) {
      updateActionItems([{
        text: 'Schedule follow-up meeting to discuss MVP features',
        assignee: 'Project Manager'
      }]);
      updateJargon([
        { term: 'API', definition: 'Application Programming Interface - a set of protocols for building software applications' },
        { term: 'MVP', definition: 'Minimum Viable Product - a product with just enough features to satisfy early customers' }
      ]);
    }
    index++;
  }, 3000);
}

// AI Features: Summary and Tips with TTS
async function getActiveServerUrl() {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      window.removeEventListener('message', onMsg);
      console.log('Server URL request timed out');
      resolve(null);
    }, 3000);

    function onMsg(event) {
      const msg = event && event.data;
      if (msg && msg.type === 'SERVER_URL_RESPONSE') {
        clearTimeout(timeoutId);
        window.removeEventListener('message', onMsg);
        console.log('Received server URL:', msg.serverUrl);
        resolve(msg.serverUrl || null);
      }
    }

    window.addEventListener('message', onMsg);
    console.log('Requesting server URL from content script');
    window.parent.postMessage({ type: 'GET_SERVER_URL' }, '*');
  });
}

async function generateSummary() {
  console.log('generateSummary called');
  const container = document.getElementById('summary-content');
  container.textContent = 'Generating summary...';

  const serverUrl = await getActiveServerUrl();
  console.log('Using server URL:', serverUrl);

  const transcript = transcriptSegments.map(s => s.text).join(' ').slice(0, 8000);
  console.log('Transcript length:', transcript.length);

  const url = `${serverUrl || 'http://localhost:3000'}/api/analysis/summary`;
  console.log('Fetching from:', url);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript })
    });
    console.log('Response status:', res.status);

    const data = await res.json();
    console.log('Response data:', data);

    if (data && data.success) {
      container.innerHTML = `<div class="transcript-text">${(data.data.summary || '').replace(/\n/g, '<br/>')}</div>`;
    } else {
      container.textContent = data.error || 'Failed to generate summary';
    }
  } catch (e) {
    console.error('Error generating summary:', e);
    container.textContent = 'Error generating summary: ' + e.message;
  }
}

function speakSummary() {
  const text = document.getElementById('summary-content').innerText || '';
  if (!text) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-US';
  utter.rate = 1.0;
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

async function generateTips() {
  const container = document.getElementById('tips-content');
  container.textContent = 'Generating tips...';
  const serverUrl = await getActiveServerUrl();
  const transcript = transcriptSegments.map(s => s.text).join(' ').slice(0, 8000);

  try {
    const res = await fetch(`${serverUrl || 'http://localhost:3000'}/api/analysis/tips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript })
    });
    const data = await res.json();

    if (data && data.success) {
      const tips = Array.isArray(data.data.tips) ? data.data.tips : String(data.data.tips || '').split('\n');
      const html = tips.filter(Boolean).map(t => `<div>• ${t.replace(/^[-•\d\.\)\s]+/, '')}</div>`).join('');
      container.innerHTML = html || '<div class="empty-state">No tips generated</div>';
    } else {
      container.textContent = data?.error || 'Failed to generate tips';
    }
  } catch {
    container.textContent = 'Error generating tips';
  }
}

function speakTips() {
  const text = document.getElementById('tips-content').innerText || '';
  if (!text) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-US';
  utter.rate = 1.0;
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

// Advanced AI Features
async function generateInsights() {
  console.log('generateInsights called');
  const container = document.getElementById('insights-content');
  container.textContent = 'Analyzing meeting effectiveness...';

  const serverUrl = await getActiveServerUrl();
  const transcript = transcriptSegments.map(s => s.text).join(' ').slice(0, 8000);

  try {
    const res = await fetch(`${serverUrl || 'http://localhost:3000'}/api/analysis/live-insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript })
    });
    const data = await res.json();

    if (data && data.success) {
      const insights = Array.isArray(data.data.insights) ? data.data.insights : [data.data.insights];
      const html = insights.filter(Boolean).map(insight => `<div>💡 ${insight}</div>`).join('');
      container.innerHTML = html || '<div class="empty-state">No insights generated</div>';
    } else {
      container.textContent = data?.error || 'Failed to generate insights';
    }
  } catch (e) {
    console.error('Error generating insights:', e);
    container.textContent = 'Error generating insights: ' + e.message;
  }
}

function speakInsights() {
  const text = document.getElementById('insights-content').innerText || '';
  if (!text) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-US';
  utter.rate = 1.0;
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

async function extractActions() {
  console.log('extractActions called');
  const container = document.getElementById('smart-actions-content');
  container.textContent = 'Extracting action items...';

  const serverUrl = await getActiveServerUrl();
  const transcript = transcriptSegments.map(s => s.text).join(' ').slice(0, 8000);

  try {
    const res = await fetch(`${serverUrl || 'http://localhost:3000'}/api/analysis/action-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript })
    });
    const data = await res.json();

    if (data && data.success) {
      const actions = data.data.actionItems;
      if (Array.isArray(actions)) {
        const html = actions.map(action => `
          <div style="background:white; padding:8px; margin:4px 0; border-radius:4px; border-left:3px solid #4CAF50;">
            <strong>${action.task}</strong><br>
            <small>👤 ${action.assignee} | 🎯 ${action.priority} | 📅 ${action.deadline}</small>
          </div>
        `).join('');
        container.innerHTML = html;
      } else {
        container.innerHTML = `<div class="transcript-text">${actions}</div>`;
      }
    } else {
      container.textContent = data?.error || 'Failed to extract actions';
    }
  } catch (e) {
    console.error('Error extracting actions:', e);
    container.textContent = 'Error extracting actions: ' + e.message;
  }
}

function exportActions() {
  const content = document.getElementById('smart-actions-content').innerText || '';
  if (!content) return;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `meeting-actions-${new Date().toISOString().split('T')[0]}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

async function cleanupTranscript() {
  console.log('cleanupTranscript called');
  const container = document.getElementById('cleanup-content');
  container.textContent = 'Cleaning transcript...';

  const serverUrl = await getActiveServerUrl();
  const transcript = transcriptSegments.map(s => s.text).join(' ').slice(0, 8000);

  try {
    const res = await fetch(`${serverUrl || 'http://localhost:3000'}/api/analysis/cleanup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript })
    });
    const data = await res.json();

    if (data && data.success) {
      container.innerHTML = `<div class="transcript-text">${data.data.cleanedTranscript}</div>`;
    } else {
      container.textContent = data?.error || 'Failed to cleanup transcript';
    }
  } catch (e) {
    console.error('Error cleaning transcript:', e);
    container.textContent = 'Error cleaning transcript: ' + e.message;
  }
}

function copyCleanText() {
  const text = document.getElementById('cleanup-content').innerText || '';
  if (!text) return;

  // Use fallback method that works in restricted environments
  copyToClipboardFallback(text);

  const btn = document.getElementById('cleanup-copy');
  const originalText = btn.textContent;
  btn.textContent = 'Copied!';
  setTimeout(() => btn.textContent = originalText, 2000);
  showNotification('Clean text copied to clipboard!', 'success');
}

// Quick Actions
async function autoSummary() {
  console.log('Auto summary triggered');
  await generateSummary();
  await generateTips();
  await generateInsights();
}

function saveNotes() {
  const summary = document.getElementById('summary-content').innerText || '';
  const tips = document.getElementById('tips-content').innerText || '';
  const actions = document.getElementById('smart-actions-content').innerText || '';
  const transcript = document.getElementById('transcript-content').innerText || '';

  const notes = `VMD-AI Meeting Notes - ${new Date().toLocaleString()}

SUMMARY:
${summary}

TIPS:
${tips}

ACTION ITEMS:
${actions}

TRANSCRIPT:
${transcript}
`;

  const blob = new Blob([notes], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `meeting-notes-${new Date().toISOString().split('T')[0]}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function shareLink() {
  const summary = document.getElementById('summary-content').innerText || '';
  const shareText = `Meeting Summary: ${summary.substring(0, 200)}...`;

  // Use fallback method that works in restricted environments
  copyToClipboardFallback(shareText);

  const btn = document.getElementById('share-link');
  const originalText = btn.textContent;
  btn.textContent = 'Copied!';
  setTimeout(() => btn.textContent = originalText, 2000);
  showNotification('Summary copied to clipboard!', 'success');
}

async function copyToClipboardFallback(text) {
  // Try modern Clipboard API first (if available and permitted)
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      console.log('Text copied using Clipboard API');
      return;
    } catch (err) {
      console.log('Clipboard API failed, using fallback:', err.message);
    }
  }

  // Fallback to execCommand for restricted environments
  const textArea = document.createElement('textarea');
  textArea.value = text;

  // Make it invisible but accessible
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  textArea.style.opacity = '0';
  textArea.style.pointerEvents = 'none';
  textArea.setAttribute('readonly', '');
  textArea.setAttribute('tabindex', '-1');

  // Add to DOM, select, copy, remove
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  textArea.setSelectionRange(0, text.length);

  try {
    // Use the legacy method for compatibility
    document.execCommand('copy');
    console.log('Text copied using execCommand fallback');
  } catch (err) {
    console.error('All copy methods failed:', err);
    // Show user a manual copy option
    showManualCopyDialog(text);
  }

  document.body.removeChild(textArea);
}

function showManualCopyDialog(text) {
  // Create a modal dialog for manual copying
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const dialog = document.createElement('div');
  dialog.style.cssText = `
    background: white;
    padding: 20px;
    border-radius: 8px;
    max-width: 500px;
    max-height: 400px;
    overflow: auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  `;

  dialog.innerHTML = `
    <h3 style="margin: 0 0 10px 0;">Copy Text Manually</h3>
    <p style="margin: 0 0 10px 0; color: #666;">Please select and copy the text below:</p>
    <textarea readonly style="width: 100%; height: 200px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; font-size: 12px;">${text}</textarea>
    <div style="margin-top: 10px; text-align: right;">
      <button id="close-manual-copy" style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
    </div>
  `;

  // Add event listener for close button
  const closeBtn = dialog.querySelector('#close-manual-copy');
  closeBtn.addEventListener('click', () => {
    modal.remove();
  });

  modal.appendChild(dialog);
  document.body.appendChild(modal);

  // Auto-select the text
  const textarea = dialog.querySelector('textarea');
  textarea.focus();
  textarea.select();
}

function downloadAll() {
  const summary = document.getElementById('summary-content').innerText || '';
  const tips = document.getElementById('tips-content').innerText || '';
  const actions = document.getElementById('smart-actions-content').innerText || '';
  const insights = document.getElementById('insights-content').innerText || '';
  const transcript = document.getElementById('transcript-content').innerText || '';
  const cleanup = document.getElementById('cleanup-content').innerText || '';

  const fullReport = `VMD-AI Meeting Companion - Complete Report
Generated: ${new Date().toLocaleString()}

=== MEETING SUMMARY ===
${summary}

=== MEETING TIPS ===
${tips}

=== LIVE INSIGHTS ===
${insights}

=== ACTION ITEMS ===
${actions}

=== CLEAN TRANSCRIPT ===
${cleanup}

=== RAW TRANSCRIPT ===
${transcript}
`;

  const blob = new Blob([fullReport], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vmd-ai-meeting-report-${new Date().toISOString().split('T')[0]}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showNotification('Complete report downloaded!', 'success');
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    font-size: 14px;
    max-width: 300px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}