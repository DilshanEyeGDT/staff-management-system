// tests/getUserDisplayNameHandler.test.mjs
import { describe, it, expect, jest } from '@jest/globals';
import { handleGetUserDisplayName } from '../handlers/getUserDisplayName.mjs';

describe('handleGetUserDisplayName', () => {

  it('should return 200 and user display_name for valid user_id', async () => {
    const mockClient = {
      query: jest.fn().mockResolvedValue({
        rows: [{ display_name: 'John Doe' }]
      })
    };

    const queryParams = { user_id: 'u123' };
    const response = await handleGetUserDisplayName(mockClient, queryParams);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.display_name).toBe('John Doe');
    expect(mockClient.query).toHaveBeenCalledWith(
      `SELECT display_name FROM users WHERE user_id = $1`,
      ['u123']
    );
  });

  it('should return 404 if user not found', async () => {
    const mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [] })
    };

    const queryParams = { user_id: 'nonexistent' };
    const response = await handleGetUserDisplayName(mockClient, queryParams);

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.message).toBe('User not found');
  });

  it('should return 200 and all users if user_id is not provided', async () => {
    const mockClient = {
      query: jest.fn().mockResolvedValue({
        rows: [
          { user_id: 'u123', display_name: 'John Doe' },
          { user_id: 'u124', display_name: 'Jane Smith' }
        ]
      })
    };

    const queryParams = {};
    const response = await handleGetUserDisplayName(mockClient, queryParams);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.length).toBe(2);
    expect(body[0].display_name).toBe('John Doe');
    expect(body[1].display_name).toBe('Jane Smith');
    expect(mockClient.query).toHaveBeenCalledWith(
      `SELECT user_id, display_name FROM users ORDER BY user_id ASC`
    );
  });

  it('should return 500 on database error', async () => {
    const mockClient = {
      query: jest.fn().mockRejectedValue(new Error('DB error'))
    };

    const queryParams = { user_id: 'u123' };
    const response = await handleGetUserDisplayName(mockClient, queryParams);

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Internal server error');
    expect(body.error).toBe('DB error');
  });

});
