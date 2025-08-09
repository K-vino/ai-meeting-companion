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
  document.getElementById('summary-generate').addEventListener('click', generateSummary);
  document.getElementById('summary-speak').addEventListener('click', speakSummary);
  document.getElementById('tips-generate').addEventListener('click', generateTips);
  document.getElementById('tips-speak').addEventListener('click', speakTips);


  // Listen for messages from content script
  window.addEventListener('message', (event) => {
    const message = event.data;

    switch (message.type) {
      case 'RECORDING_STARTED':
        handleRecordingStarted(message.session);
        break;

      case 'RECORDING_STOPPED':
        handleRecordingStopped();
        break;

      case 'TRANSCRIPT_UPDATE':
        handleTranscriptUpdate(message.data);
        break;

      case 'ANALYSIS_UPDATE':
        handleAnalysisUpdate(message.data);
        break;
    }
  });
}

function handleRecordingStarted(session) {
  isRecording = true;
  updateTranscript('Recording started... Listening for audio...');

  // Start demo updates
  setTimeout(() => {
    if (isRecording) {
      simulateTranscriptUpdates();
    }
  }, 2000);
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
  if (analysis.actionItems) {
    updateActionItems(analysis.actionItems);
  }

  if (analysis.sentiment) {
    updateSentiment(analysis.sentiment);
  }

  if (analysis.jargonTerms) {
    updateJargon(analysis.jargonTerms);
  }
}

function updateTranscript(text) {
  const content = document.getElementById('transcript-content');

  if (text && text.trim()) {
    content.innerHTML = `<div class="transcript-text">${text}</div>`;
  } else {
    content.innerHTML = '<div class="empty-state">Start recording to see live transcription</div>';
  }
}

function updateActionItems(actionItems) {
  const content = document.getElementById('action-items-content');

  if (actionItems && actionItems.length > 0) {
    content.innerHTML = actionItems.map(item => `
      <div class="action-item">
        <span>✅</span>
        <div class="action-text">${item.text}</div>
      </div>
    `).join('');
  } else {
    content.innerHTML = '<div class="empty-state">No action items detected yet</div>';
  }
}

function updateSentiment(sentiment) {
  const content = document.getElementById('sentiment-content');

  if (sentiment && sentiment.overall) {
    const { positive, negative, neutral } = sentiment.overall;
    const max = Math.max(positive, negative, neutral);

    let sentimentLabel = 'Neutral';
    let sentimentClass = 'sentiment-neutral';

    if (max === positive) {
      sentimentLabel = 'Positive';
      sentimentClass = 'sentiment-positive';
    } else if (max === negative) {
      sentimentLabel = 'Negative';
      sentimentClass = 'sentiment-negative';
    }

    content.innerHTML = `
      <div class="sentiment-indicator ${sentimentClass}">
        💭 ${sentimentLabel}
      </div>
    `;
  } else {
    content.innerHTML = '<div class="empty-state">Analyzing sentiment...</div>';
  }
}

function updateJargon(jargonTerms) {
  const content = document.getElementById('jargon-content');

  if (jargonTerms && jargonTerms.length > 0) {
    content.innerHTML = jargonTerms.map(term => `
      <div class="jargon-term">
        <div class="jargon-word">${term.term}</div>
        <div class="jargon-definition">${term.definition}</div>
      </div>
    `).join('');
  } else {
    content.innerHTML = '<div class="empty-state">No jargon detected yet</div>';
  }
}

// Demo functionality
function startDemo() {
  // Show demo content after a delay
  setTimeout(() => {
    if (!isRecording) {
      showDemoContent();
    }
  }, 3000);
}

function showDemoContent() {
  updateTranscript('Welcome to AI Meeting Companion! This is a demo of the live transcription feature.');

  updateActionItems([
    {
      text: 'Review quarterly performance metrics',
      assignee: 'Team Lead'
    },
    {
      text: 'Schedule follow-up meeting for next week',
      assignee: 'Project Manager'
    }
  ]);

  updateSentiment({
    overall: {
      positive: 0.7,
      neutral: 0.25,
      negative: 0.05
    }
  });

  updateJargon([
    {
      term: 'API',
      definition: 'Application Programming Interface - a set of protocols for building software applications'
    },
    {
      term: 'MVP',
      definition: 'Minimum Viable Product - a product with just enough features to satisfy early customers'
    }
  ]);
}

function simulateTranscriptUpdates() {
  const demoTexts = [
    'Good morning everyone, thank you for joining today\'s meeting.',
    'Let\'s start by reviewing our quarterly performance metrics.',
    'The API integration project is progressing well.',
    'We need to schedule a follow-up meeting to discuss the MVP features.',
    'Are there any questions or concerns about the timeline?'
  ];

  let index = 0;
  const interval = setInterval(() => {
    if (!isRecording || index >= demoTexts.length) {
      clearInterval(interval);
      return;
    }

    transcriptSegments.push({
      id: `demo_${Date.now()}_${index}`,
      text: demoTexts[index],
      timestamp: new Date().toISOString()
    });

    updateTranscript(transcriptSegments.map(s => s.text).join(' '));

    // Simulate analysis updates
    if (index === 2) {
      updateJargon([
        {
          term: 'API',
          definition: 'Application Programming Interface - a set of protocols for building software applications'
        }
      ]);
    }

    if (index === 3) {
      updateActionItems([
        {
          text: 'Schedule follow-up meeting to discuss MVP features',
          assignee: 'Project Manager'
        }
      ]);

      updateJargon([
        {
          term: 'API',
          definition: 'Application Programming Interface - a set of protocols for building software applications'
        },
        {
// AI Features: Summary and Tips with TTS
async function getActiveServerUrl() {
  try {
    const state = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
    if (state && state.success && state.data && state.data.serverUrl && state.data.serverUrl.startsWith('http')) {
      return state.data.serverUrl;
    }
  } catch (e) {
    console.log('Failed to get server URL', e);
  }
  return null;
}

async function generateSummary() {
  const container = document.getElementById('summary-content');
  container.textContent = 'Generating summary...';
  const serverUrl = await getActiveServerUrl();
  const transcript = transcriptSegments.map(s => s.text).join(' ').slice(0, 8000);
  try {
    const res = await fetch(`${serverUrl || 'http://localhost:3000'}/api/analysis/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript })
    });
    const data = await res.json();
    if (data && data.success) {
      container.innerHTML = `<div class="transcript-text">${(data.data.summary || '').replace(/\n/g, '<br/>')}</div>`;
    } else {
      container.textContent = data.error || 'Failed to generate summary';
    }
  } catch (e) {
    container.textContent = 'Error generating summary';
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
      container.textContent = data.error || 'Failed to generate tips';
    }
  } catch (e) {
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

          term: 'MVP',
          definition: 'Minimum Viable Product - a product with just enough features to satisfy early customers'
        }
      ]);
    }

    index++;
  }, 3000);
}
