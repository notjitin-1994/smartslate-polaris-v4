#!/usr/bin/env node

// Simple script to test the API endpoint and show generated questions
const fetch = require('node-fetch');

async function testAPI() {
  console.log('🚀 Testing API Endpoint...\n');

  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  const endpoint = `${baseUrl}/api/generate-questions`;

  const requestBody = {
    assessmentType: 'Quiz',
    deliveryMethod: 'Online',
    duration: '30m',
    learningObjectives: ['Assess JavaScript fundamentals', 'Test problem-solving skills'],
    targetAudience: 'Junior Developers',
    numSections: 2,
    questionsPerSection: 3,
  };

  console.log('📝 Request:', JSON.stringify(requestBody, null, 2));
  console.log(`\n🌐 Calling: ${endpoint}`);
  console.log('⏳ Generating... (this may take 10-30 seconds)\n');

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error ${response.status}:`, errorText);
      return;
    }

    const result = await response.json();

    console.log('🎉 Generated Questions:\n');
    console.log(JSON.stringify(result, null, 2));

    console.log('\n📊 Summary:');
    console.log(`- Sections: ${result.sections.length}`);
    result.sections.forEach((section, i) => {
      console.log(`  Section ${i + 1}: "${section.title}" (${section.questions.length} questions)`);
      section.questions.forEach((q, j) => {
        console.log(`    ${j + 1}. ${q.question} [${q.type}]`);
        if (q.options) {
          console.log(`       Options: ${q.options.join(', ')}`);
        }
      });
    });
  } catch (error) {
    console.error('❌ Error calling API:', error.message);
  }
}

testAPI().catch(console.error);
