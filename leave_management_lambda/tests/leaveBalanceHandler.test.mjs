// tests/leaveBalanceHandler.test.mjs
import { describe, it, expect, jest } from '@jest/globals';
import { handleLeaveBalance } from '../handlers/leaveBalanceHandler.mjs';

describe('handleLeaveBalance', () => {

  it('should return 400 if user_id is missing', async () => {
    const mockClient = {};
    const event = { queryStringParameters: {} };

    const response = await handleLeaveBalance(mockClient, event);
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Missing query parameter: user_id');
  });

  it('should return 200 with leave balance data for a valid user', async () => {
    const mockClient = {
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            display_name: 'John Doe',
            leave_policy_id: 1,
            leave_type: 'Annual',
            year: 2025,
            allocated_days: 14,
            used_days: 4,
            remaining_days: 10,
          },
          {
            display_name: 'John Doe',
            leave_policy_id: 2,
            leave_type: 'Casual',
            year: 2025,
            allocated_days: 7,
            used_days: 2,
            remaining_days: 5,
          },
        ]
      })
    };

    const event = { queryStringParameters: { user_id: 'u123' } };
    const response = await handleLeaveBalance(mockClient, event);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.requested_user_id).toBe('u123');
    expect(body.display_name).toBe('John Doe');
    expect(body.leave_balance.length).toBe(2);
    expect(body.leave_balance[0].leave_type).toBe('Annual');
    expect(body.leave_balance[1].leave_type).toBe('Casual');
  });

  it('should return 200 with empty leave balance if no records found', async () => {
    const mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [] })
    };

    const event = { queryStringParameters: { user_id: 'u123' } };
    const response = await handleLeaveBalance(mockClient, event);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.display_name).toBe(null);
    expect(body.leave_balance).toEqual([]);
  });

});
