// Quick test of AI endpoints
// Using built-in fetch (Node 18+)

async function testSummary() {
  try {
    console.log('Testing AI Summary endpoint...');
    const response = await fetch('http://localhost:3000/api/analysis/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: 'Good morning everyone, thank you for joining today meeting. Let start by reviewing our quarterly performance metrics. The API integration project is progressing well. We need to schedule a follow-up meeting to discuss the MVP features.'
      })
    });
    
    const data = await response.json();
    console.log('Summary Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Summary Error:', error.message);
  }
}

async function testTips() {
  try {
    console.log('\nTesting AI Tips endpoint...');
    const response = await fetch('http://localhost:3000/api/analysis/tips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: 'Good morning everyone, thank you for joining today meeting. Let start by reviewing our quarterly performance metrics.'
      })
    });
    
    const data = await response.json();
    console.log('Tips Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Tips Error:', error.message);
  }
}

async function testInsights() {
  try {
    console.log('\nTesting Live Insights endpoint...');
    const response = await fetch('http://localhost:3000/api/analysis/live-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: 'Good morning everyone, thank you for joining today meeting. Let start by reviewing our quarterly performance metrics.'
      })
    });

    const data = await response.json();
    console.log('Insights Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Insights Error:', error.message);
  }
}

async function testActionItems() {
  try {
    console.log('\nTesting Action Items endpoint...');
    const response = await fetch('http://localhost:3000/api/analysis/action-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: 'We need to review quarterly metrics by next week. John should schedule a follow-up meeting. The dev team must update API documentation by month end.'
      })
    });

    const data = await response.json();
    console.log('Action Items Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Action Items Error:', error.message);
  }
}

async function testCleanup() {
  try {
    console.log('\nTesting Cleanup endpoint...');
    const response = await fetch('http://localhost:3000/api/analysis/cleanup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: 'Um, so like, we need to, uh, review the quarterly, you know, performance metrics and stuff.'
      })
    });

    const data = await response.json();
    console.log('Cleanup Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Cleanup Error:', error.message);
  }
}

async function main() {
  console.log('🧪 TESTING ALL AI ENDPOINTS...\n');
  await testSummary();
  await testTips();
  await testInsights();
  await testActionItems();
  await testCleanup();
  console.log('\n✅ ALL TESTS COMPLETED!');
}

main();
