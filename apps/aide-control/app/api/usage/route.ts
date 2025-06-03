/**
 * API route for tracking service usage
 */
// @ts-ignore - Next.js types
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../lib/server/auth-middleware';
import { withQuotaCheck, updateUsage } from '../../../lib/server/quota-middleware';
import { getAdminApp } from '../../../lib/firebase';
import { UsageRecord } from '../../../lib/types';

/**
 * POST /api/usage - Log usage of a service (with quota checking)
 */
export function POST(req: NextRequest) {
  return withAuth(async (req, { uid }) => {
    try {
      const usageData = await req.json();
      const { serviceType, providerId, requestDetails, amount = 1 } = usageData;

      if (!serviceType || !requestDetails) {
        return NextResponse.json(
          { error: 'Missing required fields: serviceType, requestDetails' },
          { status: 400 }
        );
      }

      // Map service types to quota types
      let quotaType: 'api' | 'compute' | 'storage' | 'deployment' = 'api';
      switch (serviceType) {
        case 'openai':
        case 'azure_openai':
        case 'anthropic':
          quotaType = 'api';
          break;
        case 'compute':
        case 'execution':
          quotaType = 'compute';
          break;
        case 'storage':
          quotaType = 'storage';
          break;
        case 'deployment':
          quotaType = 'deployment';
          break;
        default:
          quotaType = 'api';
      }

      // Update usage (this will check quota first)
      await updateUsage(uid, quotaType, amount);      // Create the usage record for detailed tracking
      const usageRecord: UsageRecord = {
        userId: uid,
        serviceType,
        providerId: providerId || 'internal',
        timestamp: new Date(),
        requestDetails,
      };

      // Calculate cost if we have token counts
      if (requestDetails.inputTokens || requestDetails.outputTokens) {
        // Get pricing information from service config
        const admin = getAdminApp();
        const serviceDoc = await admin.firestore()
          .collection('services')
          .where('providerId', '==', providerId)
          .where('serviceType', '==', serviceType)
          .limit(1)
          .get();

        if (!serviceDoc.empty) {
          const serviceData = serviceDoc.docs[0].data();
          const pricing = serviceData.pricing || {};

          // Calculate cost based on tokens
          const inputCost = (requestDetails.inputTokens || 0) * (pricing.inputTokenPrice || 0);
          const outputCost = (requestDetails.outputTokens || 0) * (pricing.outputTokenPrice || 0);

          usageRecord.cost = inputCost + outputCost;
        }
      }

      // Store detailed usage record
      const admin = getAdminApp();
      await admin.firestore()
        .collection('users')
        .doc(uid)
        .collection('usage_log')
        .add(usageRecord);

      return NextResponse.json({
        success: true,
        message: 'Usage logged successfully',
        usageId: usageRecord.timestamp.getTime().toString()
      });

    } catch (error: any) {
      console.error('Error logging usage:', error);

      // Check if it's a quota error
      if (error.message?.includes('Quota exceeded')) {
        return NextResponse.json(
          {
            error: 'Quota exceeded',
            details: error.message
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to log usage' },
        { status: 500 }
      );
    }
  })(req);
}
