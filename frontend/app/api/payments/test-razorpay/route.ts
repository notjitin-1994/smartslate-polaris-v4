import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing Razorpay credentials',
          details: {
            hasKeyId: !!keyId,
            hasKeySecret: !!keySecret,
            keyIdPrefix: keyId ? keyId.substring(0, 10) : 'not set',
          },
        },
        { status: 500 }
      );
    }

    // Try to initialize Razorpay
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // Try to create a test order
    const testOrder = await razorpay.orders.create({
      amount: 100, // 1 INR in paise
      currency: 'INR',
      receipt: `test_${Date.now()}`,
      notes: {
        test: true,
        purpose: 'Configuration test',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Razorpay configuration is working!',
      testOrder: {
        id: testOrder.id,
        amount: testOrder.amount,
        currency: testOrder.currency,
        status: testOrder.status,
      },
      config: {
        mode: keyId.startsWith('rzp_live') ? 'LIVE' : 'TEST',
        keyPrefix: keyId.substring(0, 10),
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: 'Razorpay test failed',
        message: errorMessage,
        details: {
          // Check if it's an authentication error
          isAuthError: errorMessage.includes('auth') || errorMessage.includes('401'),
          // Check if it's a network error
          isNetworkError: errorMessage.includes('ENOTFOUND') || errorMessage.includes('ETIMEDOUT'),
        },
      },
      { status: 500 }
    );
  }
}
