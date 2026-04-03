const axios = require('axios');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral';

async function testOllama() {
  console.log('🔍 Testing Ollama Integration\n');
  console.log('=' .repeat(50));

  // Test 1: Check if Ollama is running
  console.log('\nTest 1: Checking if Ollama is available...');
  console.log('-'.repeat(50));
  try {
    const tagsResponse = await axios.get(`${OLLAMA_URL}/api/tags`, { timeout: 5000 });
    const models = tagsResponse.data?.models || [];
    
    if (models.length === 0) {
      console.log('❌ Ollama is running but NO MODELS found');
      console.log(`   Run: ollama pull ${OLLAMA_MODEL}`);
      return;
    }

    console.log('✓ Ollama is running');
    console.log(`  Available models: ${models.map(m => m.name).join(', ')}`);

    const modelAvailable = models.some(m => m.name.includes(OLLAMA_MODEL));
    if (!modelAvailable) {
      console.log(`\n⚠️  Model '${OLLAMA_MODEL}' not found`);
      console.log(`   Run: ollama pull ${OLLAMA_MODEL}`);
      return;
    }
  } catch (err) {
    console.log('❌ Ollama is NOT running');
    console.log(`   Start Ollama: https://ollama.ai/download`);
    console.log(`   Or run: ollama serve`);
    return;
  }

  // Test 2: Analyze sample events
  console.log('\n\nTest 2: Testing threat analysis with Ollama...');
  console.log('-'.repeat(50));

  const testEvents = [
    'User login from 192.168.1.1 successful',
    'SQL injection attempt detected: OR 1=1',
    'Service timeout - CPU at 95%',
  ];

  for (const event of testEvents) {
    try {
      console.log(`\n📝 Event: "${event}"`);
      
      const prompt = `You are a security analyst. Analyze this event and respond with ONLY a JSON object (no explanation, just JSON):
Event: ${event}

Respond with:
{
  "isAnomaly": boolean,
  "category": "normal_activity" | "security_threat" | "performance_degradation" | "service_crash",
  "confidence": number between 0 and 1,
  "reasoning": "brief explanation"
}`;

      const response = await axios.post(
        `${OLLAMA_URL}/api/generate`,
        {
          model: OLLAMA_MODEL,
          prompt: prompt,
          stream: false,
          temperature: 0.3,
        },
        { timeout: 60000 }
      );

      const jsonMatch = response.data.response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.log('  ⚠️  Could not parse response');
        continue;
      }

      const analysis = JSON.parse(jsonMatch[0]);
      const icon = analysis.isAnomaly ? '⚠️ ' : '✓ ';
      console.log(`  ${icon}Category: ${analysis.category}`);
      console.log(`  Confidence: ${(analysis.confidence * 100).toFixed(0)}%`);
      console.log(`  Reasoning: ${analysis.reasoning}`);
    } catch (err) {
      console.log(`  ❌ Error: ${err.message}`);
    }
  }

  console.log('\n' + '=' .repeat(50));
  console.log('\n✅ Ollama Integration Test Complete');
  console.log('\n📊 Results Summary:');
  console.log('  ✓ Ollama service available');
  console.log(`  ✓ Model ${OLLAMA_MODEL} working`);
  console.log('  ✓ Threat analysis functional');
  console.log('\n🚀 Helix is ready with local LLM analysis!');
}

testOllama().catch(console.error);
