#!/usr/bin/env node

// Test script for the dynamic questions API endpoint
const fetch = require('node-fetch');

async function testDynamicQuestionsAPI() {
  console.log('🚀 Testing Dynamic Questions API Endpoint...\n');

  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  const endpoint = `${baseUrl}/api/generate-dynamic-questions`;

  const requestBody = {
    blueprintId: 'test-blueprint-id',
    role: 'Learning Designer',
    organization: 'Tech Corp',
    learningGap: 'Lack of practical coding skills in junior developers',
    resources: 'Budget: $50k, Team: 3 developers, 1 designer',
    constraints: 'Must be completed in 3 months, remote delivery only',
    numSections: 5,
    questionsPerSection: 7,
  };

  console.log('📝 Request:', JSON.stringify(requestBody, null, 2));
  console.log(`\n🌐 Calling: ${endpoint}`);
  console.log('⏳ Generating dynamic questions... (this may take 1-2 minutes)\n');

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

    console.log('🎉 Generated Dynamic Questions:\n');
    console.log(JSON.stringify(result, null, 2));

    console.log('\n📊 Summary:');
    if (result.sections) {
      console.log(`- Sections: ${result.sections.length}`);
      result.sections.forEach((section, i) => {
        console.log(
          `  Section ${i + 1}: "${section.title}" (${section.questions?.length || 0} questions)`
        );
        if (section.questions) {
          section.questions.forEach((q, j) => {
            console.log(
              `    ${j + 1}. ${q.question_text || q.question} [${q.input_type || q.type}]`
            );
            if (q.options) {
              console.log(`       Options: ${q.options.join(', ')}`);
            }
          });
        }
      });
    } else {
      console.log('No sections found in response');
    }
  } catch (error) {
    console.error('❌ Error calling API:', error.message);
  }
}

testDynamicQuestionsAPI().catch(console.error);
