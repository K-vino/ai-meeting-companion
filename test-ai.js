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

async function main() {
  await testSummary();
  await testTips();
}

main();
