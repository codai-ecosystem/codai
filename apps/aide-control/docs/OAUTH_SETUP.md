# OAuth Configuration Guide for AIDE Control Panel

This guide walks you through setting up Google and GitHub OAuth authentication for the AIDE Control Panel.

## Prerequisites

1. Firebase project with Authentication enabled
2. Domain access to configure OAuth redirect URIs
3. Admin access to Google Cloud Console and GitHub

## Google OAuth Setup

### Step 1: Create Google OAuth Client

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client IDs"
5. Choose "Web application" as the application type
6. Configure the OAuth client:
   - **Name**: AIDE Control Panel
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for development)
     - `https://your-domain.com` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/auth/callback` (for development)
     - `https://your-domain.com/auth/callback` (for production)

### Step 2: Configure Environment Variables

Add the following to your `.env.production` file:

```bash
# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## GitHub OAuth Setup

### Step 1: Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: AIDE Control Panel
   - **Homepage URL**:
     - `http://localhost:3000` (for development)
     - `https://your-domain.com` (for production)
   - **Authorization callback URL**:
     - `http://localhost:3000/auth/callback` (for development)
     - `https://your-domain.com/auth/callback` (for production)

### Step 2: Configure Environment Variables

Add the following to your `.env.production` file:

```bash
# GitHub OAuth Configuration
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
```

## Firebase Configuration

### Step 1: Enable OAuth Providers in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to "Authentication" > "Sign-in method"
4. Enable the following providers:
   - **Google**: Use the same Google OAuth client credentials
   - **GitHub**: Use the GitHub OAuth app credentials

### Step 2: Configure Authorized Domains

In Firebase Authentication settings, add your domains to the authorized domains list:

- `localhost` (for development)
- `your-domain.com` (for production)

## Testing OAuth Integration

### Development Testing

1. Start your development server:

   ```bash
   cd apps/aide-control
   npm run dev
   ```

2. Navigate to `http://localhost:3000/login`
3. Test Google OAuth by clicking "Sign in with Google"
4. Test GitHub OAuth by clicking "Sign in with GitHub"

### Production Testing

1. Deploy your application to your production environment
2. Update OAuth configurations with production URLs
3. Test both Google and GitHub authentication

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**

   - Ensure the redirect URI in your OAuth configuration matches exactly
   - Check for trailing slashes and HTTP vs HTTPS

2. **"OAuth client not found"**

   - Verify your client IDs are correct in environment variables
   - Ensure the OAuth app is enabled in the respective platform

3. **"Unauthorized domain"**
   - Add your domain to Firebase authorized domains
   - Check Google Cloud Console authorized origins

### Debug Steps

1. Check browser developer console for errors
2. Verify environment variables are loaded correctly
3. Test OAuth URLs manually in a new browser tab
4. Check Firebase Authentication logs

## Security Best Practices

1. **Environment Variables**: Never commit OAuth secrets to version control
2. **HTTPS**: Always use HTTPS in production for OAuth callbacks
3. **Domain Validation**: Only add necessary domains to authorized lists
4. **Scope Limitation**: Request only necessary OAuth scopes
5. **Token Management**: Implement proper token expiration and refresh

## Integration with Existing Authentication

The OAuth implementation works alongside the existing email/password authentication:

- Users can sign up/in with email/password OR OAuth
- OAuth users are automatically created in Firebase
- All users share the same billing and subscription system
- User profiles are unified regardless of authentication method

## Next Steps

After configuring OAuth:

1. Update your login UI to include OAuth buttons
2. Test the complete authentication flow
3. Configure user role management for OAuth users
4. Set up proper error handling for OAuth failures
5. Implement user profile merging if needed

## Support

For issues with OAuth configuration:

1. Check Firebase Authentication documentation
2. Review Google OAuth 2.0 documentation
3. Check GitHub OAuth documentation
4. Contact support with specific error messages and steps to reproduce
