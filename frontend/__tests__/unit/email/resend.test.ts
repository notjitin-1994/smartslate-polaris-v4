/**
 * Unit Tests for Resend Email Service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendEmail, sendTemplateEmail, sendBatchEmails } from '@/lib/email/resend';
import { render } from '@react-email/render';

// Create mock email methods in hoisted scope
const { mockEmailSend, mockEmailSendBatch } = vi.hoisted(() => ({
  mockEmailSend: vi.fn(),
  mockEmailSendBatch: vi.fn(),
}));

// Mock Resend
vi.mock('resend', () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: mockEmailSend,
      sendBatch: mockEmailSendBatch,
    },
  })),
}));

// Mock React Email render
vi.mock('@react-email/render', () => ({
  render: vi.fn(),
}));

describe('Resend Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('should send a simple email successfully', async () => {
      mockEmailSend.mockResolvedValue({
        data: { id: 'msg-123' },
        error: null,
      } as any);

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-123');
    });

    it('should handle email send failures', async () => {
      mockEmailSend.mockResolvedValue({
        data: null,
        error: { message: 'Invalid email address' },
      } as any);

      const result = await sendEmail({
        to: 'invalid-email',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should send to multiple recipients', async () => {
      mockEmailSend.mockResolvedValue({
        data: { id: 'msg-124' },
        error: null,
      } as any);

      const result = await sendEmail({
        to: ['test1@example.com', 'test2@example.com'],
        subject: 'Test Email',
        html: '<p>Test content</p>',
      });

      expect(result.success).toBe(true);
      expect(mockEmailSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['test1@example.com', 'test2@example.com'],
        })
      );
    });

    it('should include reply-to address when provided', async () => {
      mockEmailSend.mockResolvedValue({
        data: { id: 'msg-125' },
        error: null,
      } as any);

      await sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        replyTo: 'support@smartslate.com',
      });

      expect(mockEmailSend).toHaveBeenCalledWith(
        expect.objectContaining({
          reply_to: 'support@smartslate.com',
        })
      );
    });
  });

  describe('sendTemplateEmail', () => {
    it('should render and send template email', async () => {
      mockEmailSend.mockResolvedValue({
        data: { id: 'msg-126' },
        error: null,
      } as any);

      vi.mocked(render).mockResolvedValue('<html>Rendered template</html>');

      const MockTemplate = () => null;

      const result = await sendTemplateEmail('test@example.com', 'Template Test', MockTemplate({}));

      expect(render).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe('sendBatchEmails', () => {
    it('should send multiple emails in batch', async () => {
      mockEmailSend.mockResolvedValue({
        data: { id: 'msg-127' },
        error: null,
      } as any);

      const emails = [
        {
          to: 'test1@example.com',
          subject: 'Test 1',
          html: '<p>Test 1</p>',
        },
        {
          to: 'test2@example.com',
          subject: 'Test 2',
          html: '<p>Test 2</p>',
        },
      ];

      const results = await sendBatchEmails(emails);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(mockEmailSend).toHaveBeenCalledTimes(2);
    });

    it('should handle batch send failures', async () => {
      mockEmailSend
        .mockResolvedValueOnce({
          data: { id: 'msg-128' },
          error: null,
        } as any)
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Invalid email' },
        } as any);

      const emails = [
        {
          to: 'test1@example.com',
          subject: 'Test 1',
          html: '<p>Test 1</p>',
        },
        {
          to: 'invalid-email',
          subject: 'Test 2',
          html: '<p>Test 2</p>',
        },
      ];

      const results = await sendBatchEmails(emails);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBeDefined();
    });
  });

  describe('Email Validation', () => {
    it('should validate required fields', async () => {
      const result = await sendEmail({
        to: '',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle missing HTML and text content', async () => {
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '',
      });

      expect(result.success).toBe(false);
    });
  });
});
