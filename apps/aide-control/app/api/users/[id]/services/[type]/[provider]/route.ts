/**
 * API route for managing specific user service configurations by type and provider
 */
// @ts-ignore - Next.js types
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../../../../../lib/server/auth-middleware';
import { getAdminApp } from '../../../../../../../lib/firebase';

/**
 * DELETE /api/users/[uid]/services/[type]/[provider] - Delete a service configuration
 */
export function DELETE(
  req: NextRequest,
  { params }: { params: { uid: string; type: string; provider: string } }
) {
  return withAuth(async (_, { uid }) => {
    try {
      const { uid: userUid, type: serviceType, provider: providerId } = params;      // Only allow users to delete their own data unless they're an admin
      const admin = getAdminApp();
      const firestore = (admin as any).firestore();

      if (uid !== userUid) {
        // Check if requesting user is an admin
        const adminUserData = await firestore.collection('users').doc(uid).get();
        if (!adminUserData.exists || adminUserData.data()?.role !== 'admin') {
          return NextResponse.json(
            { error: 'Not authorized to access this resource' },
            { status: 403 }
          );
        }
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

      // Check if this service type exists
      if (!serviceConfigs[serviceType] || !Array.isArray(serviceConfigs[serviceType])) {
        return NextResponse.json(
          { error: `Service type ${serviceType} not found for user` },
          { status: 404 }
        );
      }

      // Find and remove the service provider
      const existingProviderIndex = serviceConfigs[serviceType].findIndex(
        (config: any) => config.providerId === providerId
      );

      if (existingProviderIndex === -1) {
        return NextResponse.json(
          { error: `Provider ${providerId} not found for service type ${serviceType}` },
          { status: 404 }
        );
      }

      serviceConfigs[serviceType].splice(existingProviderIndex, 1);

      // Update the user's service configurations
      await userRef.update({
        serviceConfigs,
        updatedAt: new Date()
      });

      return NextResponse.json({
        message: 'Service configuration deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting service configuration:', error);
      return NextResponse.json(
        { error: 'Failed to delete service configuration' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * PUT /api/users/[uid]/services/[type]/[provider] - Update a service configuration
 */
export function PUT(
  req: NextRequest,
  { params }: { params: { uid: string; type: string; provider: string } }
) {
  return withAuth(async (req, { uid }) => {
    try {
      const { uid: userUid, type: serviceType, provider: providerId } = params;
      const updateData = await req.json();      // Only allow users to update their own data unless they're an admin
      const admin = getAdminApp();
      const firestore = (admin as any).firestore();

      if (uid !== userUid) {
        // Check if requesting user is an admin
        const adminUserData = await firestore.collection('users').doc(uid).get();
        if (!adminUserData.exists || adminUserData.data()?.role !== 'admin') {
          return NextResponse.json(
            { error: 'Not authorized to access this resource' },
            { status: 403 }
          );
        }
      }

      // Get user data
      const userRef = firestore.collection('users').doc(userUid);
      const userData = await userRef.get();

      if (!userData.exists) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const userDataObj = userData.data() || {};
      const serviceConfigs = userDataObj.serviceConfigs || {};

      // Check if this service type exists
      if (!serviceConfigs[serviceType] || !Array.isArray(serviceConfigs[serviceType])) {
        return NextResponse.json(
          { error: `Service type ${serviceType} not found for user` },
          { status: 404 }
        );
      }

      // Find the service provider
      const existingProviderIndex = serviceConfigs[serviceType].findIndex(
        (config: any) => config.providerId === providerId
      );

      if (existingProviderIndex === -1) {
        return NextResponse.json(
          { error: `Provider ${providerId} not found for service type ${serviceType}` },
          { status: 404 }
        );
      }

      // Don't allow changing providerId or serviceType
      delete updateData.providerId;
      delete updateData.serviceType;

      // Update the service configuration
      serviceConfigs[serviceType][existingProviderIndex] = {
        ...serviceConfigs[serviceType][existingProviderIndex],
        ...updateData
      };

      // Update the user's service configurations
      await userRef.update({
        serviceConfigs,
        updatedAt: new Date()
      });

      return NextResponse.json({
        message: 'Service configuration updated successfully',
        serviceConfig: serviceConfigs[serviceType][existingProviderIndex]
      });
    } catch (error) {
      console.error('Error updating service configuration:', error);
      return NextResponse.json(
        { error: 'Failed to update service configuration' },
        { status: 500 }
      );
    }
  })(req);
}
