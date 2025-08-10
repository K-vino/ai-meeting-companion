// VMD-AI Live Dashboard
console.log('🚀 VMD-AI Live Dashboard loaded');

let serverUrl = 'http://localhost:9000';
let autoTestInterval = null;
let testsPassed = 0;
let testsFailed = 0;
let responseTimes = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
});

async function initializeDashboard() {
    logOutput('🔧 Initializing dashboard...', 'info');
    
    // Get server URL from extension
    await getServerUrl();
    
    // Check initial status
    await checkExtensionStatus();
    await checkServerStatus();
    
    logOutput('✅ Dashboard ready for testing!', 'success');
}

async function getServerUrl() {
    try {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            const response = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
            if (response && response.success && response.data && response.data.serverUrl) {
                serverUrl = response.data.serverUrl;
                logOutput(`🔗 Server URL: ${serverUrl}`, 'info');
                return;
            }
        }
    } catch (e) {
        logOutput(`⚠️ Using default server URL: ${serverUrl}`, 'warning');
    }
}

async function checkExtensionStatus() {
    const statusElement = document.getElementById('extension-status');
    
    try {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            statusElement.textContent = '✅ Active';
            statusElement.style.color = '#4CAF50';
            logOutput('✅ Extension API available', 'success');
            
            // Test background communication
            const response = await chrome.runtime.sendMessage({ type: 'PING' });
            if (response) {
                logOutput('✅ Background script responding', 'success');
            }
        } else {
            statusElement.textContent = '❌ Not Available';
            statusElement.style.color = '#F44336';
            logOutput('❌ Extension API not available', 'error');
        }
    } catch (e) {
        statusElement.textContent = '❌ Error';
        statusElement.style.color = '#F44336';
        logOutput(`❌ Extension error: ${e.message}`, 'error');
    }
}

async function checkServerStatus() {
    const statusElement = document.getElementById('server-status');
    
    try {
        const startTime = Date.now();
        const response = await fetch(`${serverUrl}/health`);
        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
            const data = await response.json();
            statusElement.textContent = '✅ Online';
            statusElement.style.color = '#4CAF50';
            logOutput(`✅ Server healthy: ${data.status} (${responseTime}ms)`, 'success');
            updateResponseTime(responseTime);
        } else {
            statusElement.textContent = '❌ Error';
            statusElement.style.color = '#F44336';
            logOutput(`❌ Server error: HTTP ${response.status}`, 'error');
        }
    } catch (e) {
        statusElement.textContent = '❌ Offline';
        statusElement.style.color = '#F44336';
        logOutput(`❌ Server offline: ${e.message}`, 'error');
    }
}

function logOutput(message, type = 'info') {
    const outputElement = document.getElementById('live-output');
    const timestamp = new Date().toLocaleTimeString();
    
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    logEntry.innerHTML = `
        <div class="timestamp">[${timestamp}]</div>
        ${message}
    `;
    
    outputElement.appendChild(logEntry);
    outputElement.scrollTop = outputElement.scrollHeight;
}

function clearOutput() {
    const outputElement = document.getElementById('live-output');
    outputElement.innerHTML = `
        <div class="log-entry log-info">
            <div class="timestamp">[CLEARED]</div>
            🧹 Output cleared - Ready for new tests
        </div>
    `;
}

async function testFeature(featureType) {
    const featureCard = event.target.closest('.feature-card');
    const statusBadge = featureCard.querySelector('.status-badge');
    const button = event.target;
    
    // Update UI to show testing
    statusBadge.textContent = 'TESTING';
    statusBadge.className = 'status-badge status-testing testing';
    button.disabled = true;
    button.textContent = 'Testing...';
    
    logOutput(`🧪 Testing ${featureType}...`, 'info');
    
    try {
        const testData = getTestData(featureType);
        const endpoint = getEndpoint(featureType);
        
        const startTime = Date.now();
        const response = await fetch(`${serverUrl}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });
        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.success) {
                // Success
                statusBadge.textContent = 'WORKING';
                statusBadge.className = 'status-badge status-working';
                logOutput(`✅ ${featureType} test passed (${responseTime}ms)`, 'success');
                logOutput(`📊 Response preview: ${getResponsePreview(data, featureType)}`, 'info');
                
                testsPassed++;
                updateResponseTime(responseTime);
            } else {
                // API error
                statusBadge.textContent = 'ERROR';
                statusBadge.className = 'status-badge status-error';
                logOutput(`❌ ${featureType} API error: ${data.error}`, 'error');
                testsFailed++;
            }
        } else {
            // HTTP error
            statusBadge.textContent = 'ERROR';
            statusBadge.className = 'status-badge status-error';
            logOutput(`❌ ${featureType} HTTP error: ${response.status}`, 'error');
            testsFailed++;
        }
    } catch (e) {
        // Network error
        statusBadge.textContent = 'ERROR';
        statusBadge.className = 'status-badge status-error';
        logOutput(`❌ ${featureType} network error: ${e.message}`, 'error');
        testsFailed++;
    }
    
    // Reset UI
    button.disabled = false;
    button.textContent = 'Test Now';
    updateMetrics();
}

function getTestData(featureType) {
    const testTranscripts = {
        summary: 'Good morning everyone, thank you for joining today\'s meeting. Let\'s start by reviewing our quarterly performance metrics. The API integration project is progressing well.',
        tips: 'Team meeting about project collaboration and communication improvements.',
        insights: 'Team meeting with good engagement and clear action items being discussed.',
        actions: 'John needs to review quarterly metrics by Friday. Sarah should update the API documentation. We need to schedule a follow-up meeting for next week.',
        cleanup: 'Um, so like, we need to, uh, review the quarterly, you know, performance metrics and stuff.'
    };
    
    return { transcript: testTranscripts[featureType] || 'Test transcript' };
}

function getEndpoint(featureType) {
    const endpoints = {
        summary: '/api/analysis/summary',
        tips: '/api/analysis/tips',
        insights: '/api/analysis/live-insights',
        actions: '/api/analysis/action-items',
        cleanup: '/api/analysis/cleanup'
    };
    
    return endpoints[featureType] || '/api/test';
}

function getResponsePreview(data, featureType) {
    switch (featureType) {
        case 'summary':
            return data.data.summary?.substring(0, 100) + '...';
        case 'tips':
            return `${data.data.tips?.length || 0} tips generated`;
        case 'insights':
            return `${data.data.insights?.length || 0} insights, engagement: ${data.data.engagement || 'N/A'}%`;
        case 'actions':
            return `${data.data.actionItems?.length || 0} action items extracted`;
        case 'cleanup':
            return `Cleaned ${data.data.wordCount || 0} words`;
        default:
            return 'Response received';
    }
}

async function testTTS() {
    logOutput('🔊 Testing Text-to-Speech...', 'info');
    
    try {
        const text = 'VMD-AI Meeting Companion text-to-speech test successful!';
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        
        utterance.onstart = () => {
            logOutput('✅ TTS started successfully', 'success');
        };
        
        utterance.onend = () => {
            logOutput('✅ TTS completed successfully', 'success');
        };
        
        utterance.onerror = (e) => {
            logOutput(`❌ TTS error: ${e.error}`, 'error');
        };
        
        speechSynthesis.speak(utterance);
        logOutput('🔊 TTS test initiated - you should hear the message', 'info');
    } catch (e) {
        logOutput(`❌ TTS error: ${e.message}`, 'error');
    }
}

function testExport() {
    logOutput('📁 Testing Export functionality...', 'info');
    
    try {
        const testData = `VMD-AI Test Export
Generated: ${new Date().toLocaleString()}

This is a test export file to verify download functionality.
All export features are working correctly.
`;
        
        const blob = new Blob([testData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vmd-ai-test-export-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        logOutput('✅ Export test successful - file downloaded', 'success');
    } catch (e) {
        logOutput(`❌ Export error: ${e.message}`, 'error');
    }
}

async function runAllTests() {
    logOutput('🧪 Starting comprehensive test suite...', 'info');
    
    const features = ['summary', 'tips', 'insights', 'actions', 'cleanup'];
    const totalTests = features.length;
    let currentTest = 0;
    
    for (const feature of features) {
        currentTest++;
        updateProgress((currentTest / totalTests) * 100);
        
        logOutput(`🔄 Testing ${feature} (${currentTest}/${totalTests})...`, 'info');
        
        try {
            const testData = getTestData(feature);
            const endpoint = getEndpoint(feature);
            
            const startTime = Date.now();
            const response = await fetch(`${serverUrl}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testData)
            });
            const responseTime = Date.now() - startTime;
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    logOutput(`✅ ${feature}: PASSED (${responseTime}ms)`, 'success');
                    testsPassed++;
                    updateResponseTime(responseTime);
                } else {
                    logOutput(`❌ ${feature}: FAILED - ${data.error}`, 'error');
                    testsFailed++;
                }
            } else {
                logOutput(`❌ ${feature}: FAILED - HTTP ${response.status}`, 'error');
                testsFailed++;
            }
        } catch (e) {
            logOutput(`❌ ${feature}: FAILED - ${e.message}`, 'error');
            testsFailed++;
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    updateProgress(100);
    updateMetrics();
    
    const passRate = Math.round((testsPassed / (testsPassed + testsFailed)) * 100);
    logOutput(`🎉 Test suite completed! Pass rate: ${passRate}%`, passRate > 80 ? 'success' : 'warning');
    
    // Test additional features
    await testTTS();
    testExport();
    
    setTimeout(() => updateProgress(0), 2000);
}

function startAutoTesting() {
    if (autoTestInterval) return;
    
    logOutput('🔄 Starting auto-testing mode...', 'info');
    
    autoTestInterval = setInterval(async () => {
        await checkServerStatus();
        
        // Random feature test
        const features = ['summary', 'tips', 'insights', 'actions', 'cleanup'];
        const randomFeature = features[Math.floor(Math.random() * features.length)];
        
        logOutput(`🎲 Auto-testing ${randomFeature}...`, 'info');
        
        try {
            const testData = getTestData(randomFeature);
            const endpoint = getEndpoint(randomFeature);
            
            const response = await fetch(`${serverUrl}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testData)
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    logOutput(`✅ Auto-test ${randomFeature}: PASSED`, 'success');
                    testsPassed++;
                } else {
                    logOutput(`❌ Auto-test ${randomFeature}: FAILED`, 'error');
                    testsFailed++;
                }
            }
        } catch (e) {
            logOutput(`❌ Auto-test ${randomFeature}: ERROR`, 'error');
            testsFailed++;
        }
        
        updateMetrics();
    }, 5000); // Test every 5 seconds
}

function stopAutoTesting() {
    if (autoTestInterval) {
        clearInterval(autoTestInterval);
        autoTestInterval = null;
        logOutput('⏹ Auto-testing stopped', 'warning');
    }
}

function updateProgress(percentage) {
    const progressFill = document.getElementById('progress-fill');
    progressFill.style.width = `${percentage}%`;
}

function updateMetrics() {
    document.getElementById('tests-passed').textContent = testsPassed;
    document.getElementById('tests-failed').textContent = testsFailed;
}

function updateResponseTime(time) {
    responseTimes.push(time);
    if (responseTimes.length > 10) {
        responseTimes.shift(); // Keep only last 10 measurements
    }
    
    const avgTime = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
    document.getElementById('response-time').textContent = `${avgTime}ms`;
}

// Auto-refresh status every 30 seconds
setInterval(async () => {
    await checkExtensionStatus();
    await checkServerStatus();
}, 30000);
