/**
 * Quick test to verify FeatureRequestNotification renders without errors
 */

const React = require('react');
const { render } = require('@react-email/render');

// Test if we can import and render the component
async function testFeatureEmail() {
  try {
    // Import the component
    const {
      default: FeatureRequestNotification,
    } = require('./emails/FeatureRequestNotification.tsx');

    // Test data
    const testData = {
      requestId: 'fr-test-123',
      userId: 'user-456',
      userEmail: 'test@example.com',
      title: 'Test Feature Request',
      description: 'This is a test description',
      category: 'Testing',
      priority: 'high',
      useCase: 'Testing the email template',
      contactEmail: 'contact@example.com',
      timestamp: new Date().toISOString(),
    };

    // Try to render
    const html = await render(FeatureRequestNotification(testData));

    console.log('✅ FeatureRequestNotification renders successfully!');
    console.log('Preview text includes:', html.includes('priority feature request'));

    return true;
  } catch (error) {
    console.error('❌ Error rendering FeatureRequestNotification:', error.message);
    return false;
  }
}

// Run test
testFeatureEmail();
