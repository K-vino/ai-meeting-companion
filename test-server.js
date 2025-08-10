// Test VMD-AI Gemini Server
console.log('🧪 Testing VMD-AI Gemini Server...');

const serverUrl = 'http://localhost:9000';

async function testServer() {
  console.log('🔧 Testing server health...');
  
  try {
    const response = await fetch(`${serverUrl}/health`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Server health:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Server health check failed:', response.status);
      return;
    }
  } catch (error) {
    console.log('❌ Server not responding:', error.message);
    return;
  }

  // Test all endpoints
  const testTranscript = "Good morning everyone, thank you for joining today's meeting. Let's start by reviewing our quarterly performance metrics. The API integration project is progressing well.";

  console.log('\n📝 Testing Summary endpoint...');
  await testEndpoint('/api/analysis/summary', { transcript: testTranscript });

  console.log('\n💡 Testing Tips endpoint...');
  await testEndpoint('/api/analysis/tips', { transcript: testTranscript });

  console.log('\n🎯 Testing Insights endpoint...');
  await testEndpoint('/api/analysis/live-insights', { transcript: testTranscript });

  console.log('\n📋 Testing Action Items endpoint...');
  await testEndpoint('/api/analysis/action-items', { transcript: testTranscript });

  console.log('\n🧹 Testing Cleanup endpoint...');
  await testEndpoint('/api/analysis/cleanup', { transcript: "Um, so like, we need to, uh, review the quarterly, you know, performance metrics." });

  console.log('\n🎉 All server tests completed!');
}

async function testEndpoint(endpoint, data) {
  try {
    const response = await fetch(`${serverUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ ${endpoint} success:`, result.success ? 'OK' : 'FAILED');
      if (result.data) {
        console.log(`   Data preview: ${JSON.stringify(result.data).substring(0, 100)}...`);
      }
    } else {
      console.log(`❌ ${endpoint} failed: HTTP ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ ${endpoint} error: ${error.message}`);
  }
}

testServer().catch(console.error);
