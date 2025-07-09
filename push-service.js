import apn from 'node-apn';
import { pool } from './setup.js';

class PushNotificationService {
  constructor() {
    // Configure APNs provider
    // In production, you'll need to replace this with your actual APNs certificate/key
    const options = {
      token: process.env.APNS_TOKEN_KEY ? {
        key: process.env.APNS_TOKEN_KEY,
        keyId: process.env.APNS_TOKEN_KEY_ID,
        teamId: process.env.APNS_TEAM_ID,
      } : null,
      cert: process.env.APNS_CERT_PATH,
      key: process.env.APNS_KEY_PATH,
      passphrase: process.env.APNS_PASSPHRASE,
      production: process.env.NODE_ENV === 'production',
      rejectUnauthorized: false, // Set to true in production with proper certificates
    };

    // Only initialize if we have credentials
    if (options.token || (options.cert && options.key)) {
      this.apnProvider = new apn.Provider(options);
      console.log('📱 Push notification service initialized');
    } else {
      console.log('⚠️  Push notification service disabled (no APNs credentials)');
      this.apnProvider = null;
    }
  }

  /**
   * Send push notification to specific user
   */
  async sendNotificationToUser(userId, title, body, data = {}) {
    if (!this.apnProvider) {
      console.log('Push notifications disabled - skipping notification');
      return;
    }

    try {
      // Get all active device tokens for the user
      const result = await pool.query(
        'SELECT device_token FROM device_tokens WHERE user_id = $1 AND is_active = true',
        [userId]
      );

      const tokens = result.rows.map(row => row.device_token);
      
      if (tokens.length === 0) {
        console.log(`No active device tokens found for user ${userId}`);
        return;
      }

      // Create notification
      const notification = new apn.Notification({
        alert: {
          title: title,
          body: body
        },
        sound: 'default',
        badge: 1,
        payload: data,
        topic: process.env.APNS_BUNDLE_ID || 'com.yourcompany.starter' // Replace with your app's bundle ID
      });

      // Send notification to all user's devices
      const results = await this.apnProvider.send(notification, tokens);
      
      // Handle results and mark invalid tokens as inactive
      if (results.failed && results.failed.length > 0) {
        await this.handleFailedTokens(results.failed);
      }

      console.log(`📱 Sent push notification to ${tokens.length} device(s) for user ${userId}`);
      return results;

    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  /**
   * Send chat message notification
   */
  async sendChatNotification(senderId, recipientId, message, chatId) {
    try {
      // Get sender's username
      const senderResult = await pool.query(
        'SELECT username, first_name, last_name FROM users WHERE id = $1',
        [senderId]
      );

      if (senderResult.rows.length === 0) {
        console.log(`Sender ${senderId} not found`);
        return;
      }

      const sender = senderResult.rows[0];
      const senderName = sender.first_name && sender.last_name 
        ? `${sender.first_name} ${sender.last_name}`
        : sender.username;

      // Prepare notification data
      const title = 'New Message';
      const body = `${senderName}: ${message}`;
      const data = {
        type: 'chat_message',
        sender_id: senderId,
        recipient_id: recipientId,
        message: message,
        message_id: chatId,
        created_at: new Date().toISOString()
      };

      // Send notification to recipient
      await this.sendNotificationToUser(recipientId, title, body, data);

    } catch (error) {
      console.error('Error sending chat notification:', error);
      throw error;
    }
  }

  /**
   * Handle failed device tokens by marking them as inactive
   */
  async handleFailedTokens(failedTokens) {
    for (const failed of failedTokens) {
      try {
        if (failed.status === '410' || failed.status === '400') {
          // Token is invalid, mark as inactive
          await pool.query(
            'UPDATE device_tokens SET is_active = false WHERE device_token = $1',
            [failed.device]
          );
          console.log(`Marked device token as inactive: ${failed.device}`);
        }
      } catch (error) {
        console.error('Error handling failed token:', error);
      }
    }
  }

  /**
   * Register a device token for a user
   */
  async registerDeviceToken(userId, deviceToken, platform = 'ios') {
    try {
      // Insert or update device token
      await pool.query(`
        INSERT INTO device_tokens (user_id, device_token, platform, updated_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, device_token)
        DO UPDATE SET 
          is_active = true,
          updated_at = CURRENT_TIMESTAMP
      `, [userId, deviceToken, platform]);

      console.log(`📱 Registered device token for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error registering device token:', error);
      throw error;
    }
  }

  /**
   * Unregister a device token
   */
  async unregisterDeviceToken(userId, deviceToken) {
    try {
      await pool.query(
        'UPDATE device_tokens SET is_active = false WHERE user_id = $1 AND device_token = $2',
        [userId, deviceToken]
      );

      console.log(`📱 Unregistered device token for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error unregistering device token:', error);
      throw error;
    }
  }

  /**
   * Clean up old inactive tokens
   */
  async cleanupOldTokens(daysOld = 30) {
    try {
      const result = await pool.query(`
        DELETE FROM device_tokens 
        WHERE is_active = false 
        AND updated_at < CURRENT_TIMESTAMP - INTERVAL '${daysOld} days'
      `);

      console.log(`🧹 Cleaned up ${result.rowCount} old device tokens`);
      return result.rowCount;
    } catch (error) {
      console.error('Error cleaning up old tokens:', error);
      throw error;
    }
  }
}

// Create singleton instance
const pushService = new PushNotificationService();

export default pushService;
