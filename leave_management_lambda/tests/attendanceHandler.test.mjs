// tests/attendanceHandler.test.mjs
import { describe, it, expect, jest } from '@jest/globals';
import { handleClockIn, handleClockOut } from '../handlers/attendanceHandler.mjs';

describe('Attendance Handler', () => {

  describe('handleClockIn', () => {
    it('should return 400 if user_id is missing', async () => {
      const mockClient = {};
      const event = { currentUser: {} }; // no user_id
      const response = await handleClockIn(mockClient, event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('User not found');
    });

    it('should return 200 and attendanceRecord when DB insert succeeds', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [{ id: 1, user_id: 'u123', clock_in_time: '2025-11-19T10:00:00Z' }] })
      };
      const event = { currentUser: { user_id: 'u123' } };

      const response = await handleClockIn(mockClient, event);
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.attendanceRecord.user_id).toBe('u123');
      expect(mockClient.query).toHaveBeenCalledWith(expect.any(String), ['u123']);
    });

    it('should return 500 when DB insert fails', async () => {
      const mockClient = {
        query: jest.fn().mockRejectedValue(new Error('DB error'))
      };
      const event = { currentUser: { user_id: 'u123' } };

      const response = await handleClockIn(mockClient, event);
      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Internal server error');
      expect(body.error).toBe('DB error');
    });
  });

  describe('handleClockOut', () => {
    it('should return 400 if user_id is missing', async () => {
      const mockClient = {};
      const event = { currentUser: {} };
      const response = await handleClockOut(mockClient, event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('User not found');
    });

    it('should return 200 and attendanceRecord when DB insert succeeds', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [{ id: 2, user_id: 'u123', clock_out_time: '2025-11-19T18:00:00Z' }] })
      };
      const event = { currentUser: { user_id: 'u123' } };

      const response = await handleClockOut(mockClient, event);
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.attendanceRecord.user_id).toBe('u123');
      expect(mockClient.query).toHaveBeenCalledWith(expect.any(String), ['u123']);
    });

    it('should return 500 when DB insert fails', async () => {
      const mockClient = {
        query: jest.fn().mockRejectedValue(new Error('DB error'))
      };
      const event = { currentUser: { user_id: 'u123' } };

      const response = await handleClockOut(mockClient, event);
      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Internal server error');
      expect(body.error).toBe('DB error');
    });
  });

});
