// Test Google Gemini AI API
const GEMINI_API_KEY = 'AIzaSyBt73Cajvnr5dRZSWrvYNX5JAfzymBEe_g';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

console.log('🧪 Testing Google Gemini AI API...');

async function testGeminiAPI() {
  try {
    console.log('🤖 Calling Gemini API...');
    
    const prompt = `Analyze this meeting transcript and provide a summary:

"Good morning everyone, thank you for joining today's meeting. Let's start by reviewing our quarterly performance metrics. The API integration project is progressing well."

Respond in JSON format:
{
  "summary": "Brief summary",
  "bullets": ["Point 1", "Point 2", "Point 3"]
}`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API error:', response.status, errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Gemini API response received');
    console.log('📊 Raw response:', JSON.stringify(data, null, 2));
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const text = data.candidates[0].content.parts[0].text;
      console.log('📝 Generated text:', text);
      
      // Try to parse JSON
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log('✅ Parsed JSON:', JSON.stringify(parsed, null, 2));
        }
      } catch (parseError) {
        console.log('⚠️ Could not parse as JSON, but text received');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test multiple endpoints
async function testAllFeatures() {
  console.log('\n🧪 TESTING ALL GEMINI AI FEATURES\n');
  
  const testTranscript = "Good morning everyone, thank you for joining today's meeting. Let's start by reviewing our quarterly performance metrics. The API integration project is progressing well. We need to schedule a follow-up meeting to discuss the MVP features.";
  
  // Test 1: Summary
  console.log('1️⃣ Testing Summary Generation...');
  await testFeature('summary', `Analyze this meeting transcript and provide a summary with bullet points:

"${testTranscript}"

Respond in JSON format:
{
  "summary": "Brief summary",
  "bullets": ["Point 1", "Point 2", "Point 3"]
}`);

  // Test 2: Tips
  console.log('\n2️⃣ Testing Meeting Tips...');
  await testFeature('tips', `Based on this meeting transcript, provide 5 actionable tips to improve meeting effectiveness:

"${testTranscript}"

Respond with 5 numbered tips.`);

  // Test 3: Insights
  console.log('\n3️⃣ Testing Live Insights...');
  await testFeature('insights', `Analyze this meeting for effectiveness insights:

"${testTranscript}"

Respond in JSON format:
{
  "insights": ["Insight 1", "Insight 2"],
  "engagement": 85,
  "clarity": 78,
  "mood": "positive"
}`);

  // Test 4: Action Items
  console.log('\n4️⃣ Testing Action Items...');
  await testFeature('actions', `Extract action items from this meeting transcript:

"${testTranscript}"

Respond in JSON format:
{
  "actionItems": [
    {
      "task": "Task description",
      "assignee": "Person responsible",
      "priority": "high/medium/low",
      "deadline": "When due"
    }
  ]
}`);

  // Test 5: Cleanup
  console.log('\n5️⃣ Testing Transcript Cleanup...');
  await testFeature('cleanup', `Clean up this meeting transcript by removing filler words and improving grammar:

"Um, so like, we need to, uh, review the quarterly, you know, performance metrics and stuff."

Respond with just the cleaned text.`);

  console.log('\n🎉 All Gemini AI tests completed!');
}

async function testFeature(name, prompt) {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      console.log(`❌ ${name} failed: HTTP ${response.status}`);
      return;
    }

    const data = await response.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const text = data.candidates[0].content.parts[0].text;
      console.log(`✅ ${name} success:`);
      console.log(`   ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
    } else {
      console.log(`❌ ${name} failed: Invalid response format`);
    }

  } catch (error) {
    console.log(`❌ ${name} failed: ${error.message}`);
  }
}

// Run tests
testAllFeatures().catch(console.error);
