import { Each, Message } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen';

export interface Body {
  type: 'new-message' | 'new-event' | 'password-reset' | 'item-status-change' | 'forum-mention';
  messageId?: number;
  eventId?: number;
  userId?: number;
  recipientId?: number;
  senderId?: number;
  email?: string;
  resetToken?: string;
  itemId?: number;
  forumPostId?: number;
  createdBy?: number;
  customData?: Record<string, any>;
}

interface NotificationTemplate {
  subject: string;
  htmlBody: string;
  textBody: string;
}

interface UserInfo {
  user_id: number;
  name: string;
  email: string;
  phone_number?: string;
}

export default class extends Each<Body, Env> {
  async process(message: Message<Body>): Promise<void> {
    try {
      const notification = message.body;
      this.env.logger.info('Processing notification:', { notificationType: notification.type, ...notification });

      switch (notification.type) {
        case 'new-message':
          await this.handleNewMessage(notification);
          break;
        case 'new-event':
          await this.handleNewEvent(notification);
          break;
        case 'password-reset':
          await this.handlePasswordReset(notification);
          break;
        case 'item-status-change':
          await this.handleItemStatusChange(notification);
          break;
        case 'forum-mention':
          await this.handleForumMention(notification);
          break;
        default:
          this.env.logger.warn('Unknown notification type', { type: notification.type });
      }
    } catch (error) {
      this.env.logger.error('Error processing notification', { error: error as Error });
      throw error; // Re-throw to trigger retry mechanism
    }
  }

  private async handleNewMessage(notification: Body): Promise<void> {
    try {
      if (!notification.messageId || !notification.recipientId) {
        this.env.logger.warn('Missing required fields for new message notification');
        return;
      }

      // Get message details
      const message = await this.env.MAIN_DB.prepare(`
        SELECT 
          m.message_id, m.subject, m.message_text, m.item_id,
          sender.name as sender_name, sender.email as sender_email,
          recipient.name as recipient_name, recipient.email as recipient_email,
          recipient.phone_number as recipient_phone,
          i.title as item_title, i.url_slug as item_slug
        FROM messages m
        JOIN users sender ON m.sender_id = sender.user_id
        JOIN users recipient ON m.recipient_id = recipient.user_id
        LEFT JOIN items i ON m.item_id = i.item_id
        WHERE m.message_id = ?
      `).bind(notification.messageId).first() as any;

      if (!message) {
        this.env.logger.warn('Message not found', { messageId: notification.messageId });
        return;
      }

      // Generate email notification
      const template = this.generateMessageTemplate(message);
      
      // Send email
      await this.sendEmail({
        to: message.recipient_email,
        subject: template.subject,
        html: template.htmlBody,
        text: template.textBody
      });

      // Send SMS if phone number is available and message is high priority
      if (message.recipient_phone && this.isHighPriorityMessage(message)) {
        await this.sendSMS({
          to: message.recipient_phone,
          message: `New message from ${message.sender_name}: ${message.subject || 'No subject'}`
        });
      }

      this.env.logger.info('New message notification sent', { email: message.recipient_email });
    } catch (error) {
      this.env.logger.error('Error handling new message notification', { error: error as Error });
      throw error;
    }
  }

  private async handleNewEvent(notification: Body): Promise<void> {
    try {
      if (!notification.eventId || !notification.createdBy) {
        this.env.logger.warn('Missing required fields for new event notification');
        return;
      }

      // Get event details
      const event = await this.env.MAIN_DB.prepare(`
        SELECT 
          e.event_id, e.title, e.description, e.event_date, e.start_time, e.location,
          creator.name as creator_name, creator.email as creator_email
        FROM events e
        JOIN users creator ON e.created_by_user_id = creator.user_id
        WHERE e.event_id = ?
      `).bind(notification.eventId).first() as any;

      if (!event) {
        this.env.logger.warn('Event not found', { eventId: notification.eventId });
        return;
      }

      // Get all active users for broadcast notification
      const users = await this.env.MAIN_DB.prepare(`
        SELECT user_id, name, email, phone_number
        FROM users 
        WHERE is_active = 1 AND user_id != ?
      `).bind(notification.createdBy).all();
      const usersResult = users.results as unknown as UserInfo[];

      if (!usersResult || usersResult.length === 0) {
        this.env.logger.info('No users to notify about new event');
        return;
      }

      // Generate email template
      const template = this.generateEventTemplate(event);

      // Send notifications to all users
      const emailPromises = usersResult.map(async (user) => {
        try {
          await this.sendEmail({
            to: user.email,
            subject: template.subject,
            html: template.htmlBody.replace('{{USER_NAME}}', user.name),
            text: template.textBody.replace('{{USER_NAME}}', user.name)
          });
        } catch (emailError) {
          this.env.logger.error('Failed to send event notification', { email: user.email, emailError: emailError as Error });
        }
      });

      await Promise.allSettled(emailPromises);

      this.env.logger.info('New event notification sent', { userCount: usersResult.length });
    } catch (error) {
      this.env.logger.error('Error handling new event notification', { error: error as Error });
      throw error;
    }
  }

  private async handlePasswordReset(notification: Body): Promise<void> {
    try {
      if (!notification.email || !notification.resetToken || !notification.userId) {
        this.env.logger.warn('Missing required fields for password reset notification');
        return;
      }

      // Get user details
      const user = await this.env.MAIN_DB.prepare(`
        SELECT user_id, name, email
        FROM users 
        WHERE user_id = ? AND email = ? AND is_active = 1
      `).bind(notification.userId, notification.email).first() as UserInfo | null;

      if (!user) {
        this.env.logger.warn('User not found for password reset', { email: notification.email });
        return;
      }

      // Generate reset link (you'd configure your frontend URL)
      const resetLink = `https://your-domain.com/reset-password?token=${notification.resetToken}`;

      // Generate email template
      const template = this.generatePasswordResetTemplate(user, resetLink);

      // Send email
      await this.sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.htmlBody,
        text: template.textBody
      });

      this.env.logger.info('Password reset notification sent', { email: user.email });
    } catch (error) {
      this.env.logger.error('Error handling password reset notification', { error: error as Error });
      throw error;
    }
  }

  private async handleItemStatusChange(notification: Body): Promise<void> {
    try {
      if (!notification.itemId) {
        this.env.logger.warn('Missing item ID for status change notification');
        return;
      }

      // Get item and interested users (those who messaged about the item)
      const itemData = await this.env.MAIN_DB.prepare(`
        SELECT 
          i.item_id, i.title, i.status, i.url_slug,
          vendor.name as vendor_name, vendor.email as vendor_email
        FROM items i
        JOIN users vendor ON i.vendor_id = vendor.user_id
        WHERE i.item_id = ?
      `).bind(notification.itemId).first() as any;

      if (!itemData) {
        this.env.logger.warn('Item not found', { itemId: notification.itemId });
        return;
      }

      // Get users who have messaged about this item
      const interestedUsers = await this.env.MAIN_DB.prepare(`
        SELECT DISTINCT 
          u.user_id, u.name, u.email
        FROM messages m
        JOIN users u ON (m.sender_id = u.user_id OR m.recipient_id = u.user_id)
        WHERE m.item_id = ? AND u.user_id != ? AND u.is_active = 1
      `).bind(notification.itemId, itemData.vendor_id || 0).all();
      const interestedUsersResult = interestedUsers.results as unknown as UserInfo[];

      if (!interestedUsersResult || interestedUsersResult.length === 0) {
        this.env.logger.info('No interested users to notify about item status change');
        return;
      }

      // Generate email template
      const template = this.generateItemStatusTemplate(itemData);

      // Send notifications
      const emailPromises = interestedUsersResult.map(async (user) => {
        try {
          await this.sendEmail({
            to: user.email,
            subject: template.subject,
            html: template.htmlBody.replace('{{USER_NAME}}', user.name),
            text: template.textBody.replace('{{USER_NAME}}', user.name)
          });
        } catch (emailError) {
          this.env.logger.error('Failed to send status change notification', { email: user.email, emailError: emailError as Error });
        }
      });

      await Promise.allSettled(emailPromises);

      this.env.logger.info('Item status change notification sent', { userCount: interestedUsersResult.length });
    } catch (error) {
      this.env.logger.error('Error handling item status change notification', { error: error as Error });
      throw error;
    }
  }

  private async handleForumMention(notification: Body): Promise<void> {
    try {
      if (!notification.forumPostId || !notification.userId) {
        this.env.logger.warn('Missing required fields for forum mention notification');
        return;
      }

      // Get forum post and mentioned user details
      const postData = await this.env.MAIN_DB.prepare(`
        SELECT 
          fp.post_id, fp.title, fp.content, fp.item_id,
          author.name as author_name, author.email as author_email,
          mentioned.name as mentioned_name, mentioned.email as mentioned_email,
          i.title as item_title, i.url_slug as item_slug
        FROM forum_posts fp
        JOIN users author ON fp.user_id = author.user_id
        JOIN users mentioned ON mentioned.user_id = ?
        LEFT JOIN items i ON fp.item_id = i.item_id
        WHERE fp.post_id = ?
      `).bind(notification.userId, notification.forumPostId).first() as any;

      if (!postData) {
        this.env.logger.warn('Forum post or mentioned user not found');
        return;
      }

      // Generate email template
      const template = this.generateForumMentionTemplate(postData);

      // Send email
      await this.sendEmail({
        to: postData.mentioned_email,
        subject: template.subject,
        html: template.htmlBody,
        text: template.textBody
      });

      this.env.logger.info('Forum mention notification sent', { email: postData.mentioned_email });
    } catch (error) {
      this.env.logger.error('Error handling forum mention notification', { error: error as Error });
      throw error;
    }
  }

  private async sendEmail(options: { to: string; subject: string; html: string; text: string }): Promise<void> {
    try {
      // This is a placeholder implementation
      // In a real application, you would use a service like:
      // - SendGrid
      // - AWS SES
      // - Mailgun
      // - SMTP directly
      
      this.env.logger.info('Sending email', { to: options.to, subject: options.subject });
      
      // Basic SMTP implementation using environment variables
      const smtpConfig = {
        host: this.env.SMTP_HOST,
        user: this.env.SMTP_USER,
        pass: this.env.SMTP_PASS
      };

      // For now, we'll just log the email content
      // In production, implement actual SMTP sending
      this.env.logger.debug('Email content:', {
        to: options.to,
        subject: options.subject,
        html: options.html.substring(0, 200) + '...',
        text: options.text.substring(0, 200) + '...'
      });

      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 100));

      this.env.logger.info('Email sent successfully', { to: options.to });
    } catch (error) {
      this.env.logger.error('Failed to send email', { to: options.to, error: error as Error });
      throw error;
    }
  }

  private async sendSMS(options: { to: string; message: string }): Promise<void> {
    try {
      // This is a placeholder implementation
      // In a real application, you would use a service like:
      // - Twilio
      // - AWS SNS
      // - Nexmo/Vonage
      
      this.env.logger.info('Sending SMS', { to: options.to, message: options.message });
      
      // For now, we'll just log the SMS
      // In production, implement actual SMS sending using SMS_API_KEY
      this.env.logger.debug('SMS content:', {
        to: options.to,
        message: options.message.substring(0, 100) + '...'
      });

      // Simulate SMS sending
      await new Promise(resolve => setTimeout(resolve, 50));

      this.env.logger.info('SMS sent successfully', { to: options.to });
    } catch (error) {
      this.env.logger.error('Failed to send SMS', { to: options.to, error: error as Error });
      // SMS failure is not critical, so we don't throw
    }
  }

  private generateMessageTemplate(message: any): NotificationTemplate {
    const itemInfo = message.item_title ? ` regarding "${message.item_title}"` : '';
    
    return {
      subject: `New message from ${message.sender_name}${message.subject ? `: ${message.subject}` : ''}`,
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You have a new message</h2>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>From:</strong> ${message.sender_name}</p>
            ${message.subject ? `<p><strong>Subject:</strong> ${message.subject}</p>` : ''}
            ${itemInfo ? `<p><strong>Item:</strong> ${message.item_title}</p>` : ''}
            <p><strong>Message:</strong></p>
            <p>${message.message_text}</p>
          </div>
          <p>
            <a href="https://your-domain.com/messages/${message.message_id}" 
               style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              View Message
            </a>
          </p>
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            This is an automated notification from WebCat. 
            To unsubscribe from these notifications, visit your account settings.
          </p>
        </div>
      `,
      textBody: `
You have a new message

From: ${message.sender_name}
${message.subject ? `Subject: ${message.subject}` : ''}
${itemInfo ? `Item: ${message.item_title}` : ''}

Message:
${message.message_text}

View the full message at: https://your-domain.com/messages/${message.message_id}

---
This is an automated notification from WebCat.
      `
    };
  }

  private generateEventTemplate(event: any): NotificationTemplate {
    const eventDate = new Date(event.event_date).toLocaleDateString();
    const eventTime = event.start_time ? ` at ${event.start_time}` : '';
    
    return {
      subject: `New Event: ${event.title}`,
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Event Announced</h2>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>${event.title}</h3>
            <p><strong>Date:</strong> ${eventDate}${eventTime}</p>
            ${event.location ? `<p><strong>Location:</strong> ${event.location}</p>` : ''}
            ${event.description ? `<p><strong>Description:</strong><br>${event.description}</p>` : ''}
            <p><strong>Organized by:</strong> ${event.creator_name}</p>
          </div>
          <p>Hello {{USER_NAME}},</p>
          <p>A new event has been scheduled that you might be interested in.</p>
          <p>
            <a href="https://your-domain.com/events/${event.event_id}" 
               style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              View Event Details
            </a>
          </p>
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            This is an automated notification from WebCat.
          </p>
        </div>
      `,
      textBody: `
New Event Announced

${event.title}

Date: ${eventDate}${eventTime}
${event.location ? `Location: ${event.location}` : ''}
${event.description ? `Description: ${event.description}` : ''}
Organized by: ${event.creator_name}

Hello {{USER_NAME}},

A new event has been scheduled that you might be interested in.

View event details at: https://your-domain.com/events/${event.event_id}

---
This is an automated notification from WebCat.
      `
    };
  }

  private generatePasswordResetTemplate(user: UserInfo, resetLink: string): NotificationTemplate {
    return {
      subject: 'WebCat Password Reset Request',
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hello ${user.name},</p>
          <p>We received a request to reset your password for your WebCat account.</p>
          <p>If you made this request, click the button below to reset your password:</p>
          <p>
            <a href="${resetLink}" 
               style="background-color: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            For security reasons, this link will only work once and expires in 1 hour.
            If you need help, contact support at support@webcat.com
          </p>
        </div>
      `,
      textBody: `
Password Reset Request

Hello ${user.name},

We received a request to reset your password for your WebCat account.

If you made this request, visit the following link to reset your password:
${resetLink}

This link will expire in 1 hour.

If you did not request a password reset, please ignore this email or contact support if you have concerns.

---
For security reasons, this link will only work once and expires in 1 hour.
      `
    };
  }

  private generateItemStatusTemplate(item: any): NotificationTemplate {
    const statusText = item.status === 'Sold' ? 'has been sold' : `status changed to ${item.status}`;
    
    return {
      subject: `Item Update: ${item.title}`,
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Item Status Update</h2>
          <p>Hello {{USER_NAME}},</p>
          <p>An item you showed interest in has been updated:</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>${item.title}</h3>
            <p><strong>Status:</strong> ${item.status}</p>
            <p>This item ${statusText}.</p>
          </div>
          <p>
            <a href="https://your-domain.com/items/${item.url_slug}" 
               style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              View Item
            </a>
          </p>
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            You're receiving this because you previously messaged about this item.
          </p>
        </div>
      `,
      textBody: `
Item Status Update

Hello {{USER_NAME}},

An item you showed interest in has been updated:

${item.title}
Status: ${item.status}

This item ${statusText}.

View item at: https://your-domain.com/items/${item.url_slug}

---
You're receiving this because you previously messaged about this item.
      `
    };
  }

  private generateForumMentionTemplate(post: any): NotificationTemplate {
    const itemInfo = post.item_title ? ` in the discussion about "${post.item_title}"` : '';
    
    return {
      subject: `${post.author_name} mentioned you in a forum post`,
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been mentioned</h2>
          <p>Hello ${post.mentioned_name},</p>
          <p>${post.author_name} mentioned you${itemInfo}:</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff;">
            ${post.title ? `<h4>${post.title}</h4>` : ''}
            <p>${post.content.substring(0, 200)}${post.content.length > 200 ? '...' : ''}</p>
          </div>
          <p>
            <a href="https://your-domain.com/forum/posts/${post.post_id}" 
               style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              View Discussion
            </a>
          </p>
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            This is an automated notification from WebCat.
          </p>
        </div>
      `,
      textBody: `
You've been mentioned

Hello ${post.mentioned_name},

${post.author_name} mentioned you${itemInfo}:

${post.title ? `${post.title}\n` : ''}
${post.content.substring(0, 300)}${post.content.length > 300 ? '...' : ''}

View the full discussion at: https://your-domain.com/forum/posts/${post.post_id}

---
This is an automated notification from WebCat.
      `
    };
  }

  private isHighPriorityMessage(message: any): boolean {
    // Define criteria for high-priority messages that warrant SMS
    const highPriorityKeywords = ['urgent', 'asap', 'immediately', 'emergency'];
    const messageText = (message.message_text || '').toLowerCase();
    const subject = (message.subject || '').toLowerCase();
    
    return highPriorityKeywords.some(keyword => 
      messageText.includes(keyword) || subject.includes(keyword)
    );
  }

  // Health check method
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      // Test database connectivity
      const dbTest = await this.env.MAIN_DB.prepare('SELECT 1 as test').first() as { test: number } | null;
      
      return {
        status: 'healthy',
        details: {
          database: dbTest ? 'ok' : 'error',
          smtpConfigured: this.env.SMTP_HOST && this.env.SMTP_USER ? 'ok' : 'error',
          smsConfigured: this.env.SMS_API_KEY ? 'ok' : 'error',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.env.logger.error('Notification handler health check failed', { error: error as Error });
      return {
        status: 'unhealthy',
        details: {
          error: String(error),
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}