// tests/healthHandler.test.mjs
import { describe, it, expect, jest } from '@jest/globals';
import { handleHealthCheck } from '../handlers/healthHandler.mjs';

describe('handleHealthCheck', () => {

  it('should return 200 and db_time when DB query succeeds', async () => {
    const mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [{ db_time: '2025-11-19T10:00:00Z' }] }),
      end: jest.fn().mockResolvedValue()
    };

    const event = {};
    const response = await handleHealthCheck(mockClient, event);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('ok');
    expect(body.db_time).toBe('2025-11-19T10:00:00Z');
    expect(mockClient.query).toHaveBeenCalledWith('SELECT NOW() as db_time;');
  });

  it('should return 500 when DB query fails', async () => {
    const mockClient = {
      query: jest.fn().mockRejectedValue(new Error('DB connection failed')),
      end: jest.fn().mockResolvedValue()
    };

    const event = {};
    const response = await handleHealthCheck(mockClient, event);

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('error');
    expect(body.message).toBe('Database connection failed.');
    expect(body.error).toBe('DB connection failed');
  });

});
