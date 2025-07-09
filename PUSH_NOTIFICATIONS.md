# Push Notifications Setup Guide

This guide explains how to set up push notifications for the starter app backend.

## Overview

The backend now includes push notification support for iOS devices using Apple Push Notification service (APNs). When a user sends a chat message, the recipient will receive a push notification on their device.

## Features

- ✅ Device token registration/unregistration
- ✅ Automatic push notifications for chat messages
- ✅ Failed token cleanup (invalid tokens are marked inactive)
- ✅ Test notification endpoint for development
- ✅ Support for multiple devices per user

## Setup Instructions

### 1. Apple Developer Account Setup

1. **Create an App ID** in the Apple Developer Console
2. **Enable Push Notifications** capability for your App ID
3. **Create an APNs Authentication Key** (recommended) or **APNs Certificate**

### 2. Environment Variables

Add these environment variables to your deployment:

#### Using APNs Authentication Key (Recommended)
```bash
APNS_TOKEN_KEY=-----BEGIN PRIVATE KEY-----...-----END PRIVATE KEY-----
APNS_TOKEN_KEY_ID=your_key_id
APNS_TEAM_ID=your_team_id
APNS_BUNDLE_ID=com.yourcompany.starter
NODE_ENV=production
```

#### Using APNs Certificate (Legacy)
```bash
APNS_CERT_PATH=/path/to/cert.pem
APNS_KEY_PATH=/path/to/key.pem
APNS_PASSPHRASE=your_passphrase
APNS_BUNDLE_ID=com.yourcompany.starter
NODE_ENV=production
```

### 3. Database Migration

The backend automatically creates the `device_tokens` table when you run the server. If you need to manually create it:

```sql
CREATE TABLE device_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  device_token TEXT NOT NULL,
  platform TEXT DEFAULT 'ios',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, device_token)
);

CREATE INDEX idx_device_tokens_user ON device_tokens(user_id, is_active);
```

## API Usage

### Register Device Token

```bash
curl -X POST https://your-api.com/device-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_token": "abc123...",
    "platform": "ios"
  }'
```

### Send Test Notification

```bash
curl -X POST https://your-api.com/test-notification \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "body": "This is a test notification"
  }'
```

## How It Works

1. **Device Registration**: iOS app registers device token with backend
2. **Message Sending**: When a chat message is sent, the backend:
   - Saves the message to the database
   - Looks up the recipient's device tokens
   - Sends push notification via APNs
   - Returns the saved message to the sender
3. **Real-time Updates**: The iOS app handles the notification and updates the UI accordingly

## iOS App Integration

The iOS app needs to:

1. **Request notification permissions** on startup
2. **Register device token** with the backend after login
3. **Handle incoming notifications** when app is in foreground/background
4. **Update UI** when receiving chat notifications

## Development vs Production

- **Development**: Uses APNs sandbox environment
- **Production**: Uses APNs production environment (controlled by `NODE_ENV`)

## Troubleshooting

### Push Notifications Not Working

1. **Check APNs credentials** - Verify environment variables are set correctly
2. **Verify device token registration** - Check database for active tokens
3. **Check APNs environment** - Ensure using correct sandbox/production settings
4. **Review logs** - Look for APNs errors in server logs

### Invalid Device Tokens

The system automatically marks invalid tokens as inactive. Check the logs for:
- `410` status: Token is no longer valid
- `400` status: Bad device token format

### Database Issues

If you see database errors:
1. Ensure the `device_tokens` table exists
2. Check that the user_id foreign key constraint is satisfied
3. Verify unique constraint on (user_id, device_token)

## Security Notes

- Device tokens are stored securely in the database
- APNs credentials should be kept secret (use environment variables)
- Invalid tokens are automatically cleaned up
- The system supports token rotation (same user can have multiple tokens)

## Monitoring

The backend logs important events:
- Device token registration/unregistration
- Push notification sending
- Failed token cleanup
- APNs errors

Monitor these logs in your production environment to ensure push notifications are working correctly.
