/**
 * Test script for authentication and billing functionality
 */

const API_BASE = 'https://aide-control-xh6fsul3qq-uc.a.run.app';

/**
 * Test authentication endpoints
 */
async function testAuthentication() {
	console.log('\n🔐 Testing Authentication Endpoints...\n');

	// 1. Test registration
	console.log('1. Testing user registration...');
	try {
		const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: 'test@example.com',
				password: 'TestPassword123!'
			})
		});

		if (registerResponse.ok) {
			const result = await registerResponse.json();
			console.log('✅ Registration successful:', result);
		} else {
			const error = await registerResponse.text();
			console.log('❌ Registration failed:', error);
		}
	} catch (error) {
		console.log('❌ Registration error:', error.message);
	}

	// 2. Test login
	console.log('\n2. Testing user login...');
	try {
		const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: 'test@example.com',
				password: 'TestPassword123!'
			})
		});

		if (loginResponse.ok) {
			const result = await loginResponse.json();
			console.log('✅ Login successful:', result);
			return result.token; // Return token for further tests
		} else {
			const error = await loginResponse.text();
			console.log('❌ Login failed:', error);
		}
	} catch (error) {
		console.log('❌ Login error:', error.message);
	}

	return null;
}

/**
 * Test billing endpoints
 */
async function testBilling(authToken) {
	console.log('\n💳 Testing Billing Endpoints...\n');

	const headers = {
		'Content-Type': 'application/json',
		...(authToken && { 'Authorization': `Bearer ${authToken}` })
	};

	// 1. Test getting billing info
	console.log('1. Testing get billing info...');
	try {
		const billingResponse = await fetch(`${API_BASE}/api/billing`, {
			headers
		});

		if (billingResponse.ok) {
			const result = await billingResponse.json();
			console.log('✅ Billing info retrieved:', result);
		} else {
			const error = await billingResponse.text();
			console.log('❌ Billing info failed:', error);
		}
	} catch (error) {
		console.log('❌ Billing error:', error.message);
	}

	// 2. Test creating checkout session
	console.log('\n2. Testing checkout session creation...');
	try {
		const checkoutResponse = await fetch(`${API_BASE}/api/billing/checkout`, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				priceId: 'price_test_123', // Test price ID
				successUrl: `${API_BASE}/success`,
				cancelUrl: `${API_BASE}/cancel`
			})
		});

		if (checkoutResponse.ok) {
			const result = await checkoutResponse.json();
			console.log('✅ Checkout session created:', result);
		} else {
			const error = await checkoutResponse.text();
			console.log('❌ Checkout session failed:', error);
		}
	} catch (error) {
		console.log('❌ Checkout error:', error.message);
	}

	// 3. Test webhook endpoint (simulate)
	console.log('\n3. Testing webhook endpoint...');
	try {
		const webhookResponse = await fetch(`${API_BASE}/api/billing/webhook`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'stripe-signature': 'test-signature'
			},
			body: JSON.stringify({
				type: 'checkout.session.completed',
				data: {
					object: {
						id: 'cs_test_123',
						customer: 'cus_test_123',
						subscription: 'sub_test_123',
						metadata: {
							userId: 'test-user-id'
						}
					}
				}
			})
		});

		if (webhookResponse.ok) {
			const result = await webhookResponse.text();
			console.log('✅ Webhook processed:', result);
		} else {
			const error = await webhookResponse.text();
			console.log('❌ Webhook failed:', error);
		}
	} catch (error) {
		console.log('❌ Webhook error:', error.message);
	}
}

/**
 * Test health endpoint
 */
async function testHealth() {
	console.log('\n🏥 Testing Health Endpoint...\n');

	try {
		const healthResponse = await fetch(`${API_BASE}/api/health`);

		if (healthResponse.ok) {
			const result = await healthResponse.json();
			console.log('✅ Health check passed:', result);
		} else {
			console.log('❌ Health check failed');
		}
	} catch (error) {
		console.log('❌ Health check error:', error.message);
	}
}

/**
 * Main test function
 */
async function runAllTests() {
	console.log('🚀 Starting AIDE Control Panel API Tests');
	console.log('=====================================');

	await testHealth();
	const authToken = await testAuthentication();
	await testBilling(authToken);

	console.log('\n📊 Test Summary');
	console.log('================');
	console.log('All tests completed. Check the results above.');
	console.log('\nNext steps:');
	console.log('1. Check Firebase Authentication console for the test user');
	console.log('2. Configure Stripe webhooks to use the webhook endpoint');
	console.log('3. Test OAuth providers (Google, GitHub) integration');
	console.log('4. Set up proper environment variables for production');
}

// Run the tests
runAllTests().catch(console.error);
