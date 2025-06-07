/**
 * API route for managing user service configurations
 */
// @ts-ignore - Next.js types
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../../../lib/server/auth-middleware';
import { getAdminApp } from '../../../../../lib/firebase-admin';
import { ServiceConfig } from '../../../../../lib/types';

/**
 * GET /api/users/[id]/services - Get service configurations for a specific user
 */
export function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (_, { uid }) => {
    try {
      const { id: userUid } = await params;

      // Only allow users to access their own data unless they're an admin
      const admin = getAdminApp();

      if (uid !== userUid) {
        // Check if requesting user is an admin
        const adminUserData = await admin.firestore().collection('users').doc(uid).get();
        if (!adminUserData.exists || adminUserData.data()?.role !== 'admin') {
          return NextResponse.json(
            { error: 'Not authorized to access this resource' },
            { status: 403 }
          );
        }
      }

      // Get user data
      const userData = await admin.firestore().collection('users').doc(userUid).get();

      if (!userData.exists) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const { serviceConfigs = {} } = userData.data() || {};

      return NextResponse.json({
        services: serviceConfigs
      });
    } catch (error) {
      console.error('Error getting user service configurations:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve service configurations' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/users/[id]/services - Add a service configuration for a user
 */
export function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, { uid }) => {
    try {
      const { id: userUid } = await params;
      const { serviceType, providerId, mode, apiKey = null, baseUrl = null, additionalConfig = {} } = await req.json() as ServiceConfig;

      // Only allow users to access their own data unless they're an admin
      const admin = getAdminApp();

      if (uid !== userUid) {
        // Check if requesting user is an admin
        const adminUserData = await admin.firestore().collection('users').doc(uid).get();
        if (!adminUserData.exists || adminUserData.data()?.role !== 'admin') {
          return NextResponse.json(
            { error: 'Not authorized to access this resource' },
            { status: 403 }
          );
        }
      }

      // Verify that the service provider exists
      const serviceRef = admin.firestore().collection('services').where('providerId', '==', providerId).where('serviceType', '==', serviceType);
      const serviceSnapshot = await serviceRef.get();

      if (serviceSnapshot.empty) {
        return NextResponse.json(
          { error: `Service provider ${providerId} for type ${serviceType} not found` },
          { status: 400 }
        );
      }

      // Get user data
      const userRef = admin.firestore().collection('users').doc(userUid);
      const userData = await userRef.get();

      if (!userData.exists) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const userDataObj = userData.data() || {};
      const serviceConfigs = userDataObj.serviceConfigs || {};

      // Add new service config
      const newServiceConfig = {
        serviceType,
        providerId,
        mode,
        apiKey,
        baseUrl,
        additionalConfig
      };

      if (!serviceConfigs[serviceType]) {
        serviceConfigs[serviceType] = [];
      }

      // Check if this provider already exists for this service type
      const existingProviderIndex = serviceConfigs[serviceType].findIndex(
        (config: ServiceConfig) => config.providerId === providerId
      );

      if (existingProviderIndex >= 0) {
        serviceConfigs[serviceType][existingProviderIndex] = newServiceConfig;
      } else {
        serviceConfigs[serviceType].push(newServiceConfig);
      }

      // Update the user's service configurations
      await userRef.update({
        serviceConfigs,
        updatedAt: new Date()
      });

      return NextResponse.json({
        message: 'Service configuration added successfully',
        serviceConfig: newServiceConfig
      }, { status: 201 });
    } catch (error) {
      console.error('Error adding service configuration:', error);
      return NextResponse.json(
        { error: 'Failed to add service configuration' },
        { status: 500 }
      );
    }
  })(req);
}
