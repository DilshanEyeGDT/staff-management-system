import { jest } from '@jest/globals';
import { handleLeaveRequestsPOST } from '../handlers/leaveRequestsPOSTHandler.mjs';

describe('handleLeaveRequestsPOST', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
    };
  });

  it('should return 400 if required fields are missing', async () => {
    const event = { body: JSON.stringify({ user_id: 'u1' }) };
    const res = await handleLeaveRequestsPOST(mockClient, event);
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toBe('Missing required fields.');
  });

  it('should return 400 if start_date > end_date', async () => {
    const event = {
      body: JSON.stringify({
        user_id: 'u1',
        leave_policy_id: 'lp1',
        start_date: '2025-11-05',
        end_date: '2025-11-01',
      }),
    };
    const res = await handleLeaveRequestsPOST(mockClient, event);
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toBe('start_date cannot be after end_date.');
  });

  it('should return 400 if no leave balance found', async () => {
    mockClient.query.mockResolvedValueOnce({ rows: [] });

    const event = {
      body: JSON.stringify({
        user_id: 'u1',
        leave_policy_id: 'lp1',
        start_date: '2025-11-01',
        end_date: '2025-11-05',
      }),
    };

    const res = await handleLeaveRequestsPOST(mockClient, event);
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toBe('No leave balance found for this type.');
  });

  it('should return 400 if requested days exceed remaining balance', async () => {
    mockClient.query.mockResolvedValueOnce({ rows: [{ remaining_days: 2 }] }); // only 2 days remaining

    const event = {
      body: JSON.stringify({
        user_id: 'u1',
        leave_policy_id: 'lp1',
        start_date: '2025-11-01',
        end_date: '2025-11-05', // 5 days requested
      }),
    };

    const res = await handleLeaveRequestsPOST(mockClient, event);
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toBe('Requested days exceed remaining leave balance.');
  });

  it('should return 400 if leave overlaps with existing leave', async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [{ remaining_days: 10 }] }) // balance check
      .mockResolvedValueOnce({ rows: [{}] }); // overlap check

    const event = {
      body: JSON.stringify({
        user_id: 'u1',
        leave_policy_id: 'lp1',
        start_date: '2025-11-01',
        end_date: '2025-11-03',
      }),
    };

    const res = await handleLeaveRequestsPOST(mockClient, event);
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toBe('Leave request overlaps with existing leave.');
  });

  it('should create leave request successfully', async () => {
    const newLeave = {
      leave_request_id: 'lr1',
      user_id: 'u1',
      leave_policy_id: 'lp1',
      start_date: '2025-11-01',
      end_date: '2025-11-03',
      reason: 'Vacation',
    };

    mockClient.query
      .mockResolvedValueOnce({ rows: [{ remaining_days: 10 }] }) // balance
      .mockResolvedValueOnce({ rows: [] }) // overlap
      .mockResolvedValueOnce({ rows: [newLeave] }) // insert leave_request
      .mockResolvedValueOnce({ rows: [{}] }); // insert leave_audit

    const event = {
      body: JSON.stringify({
        user_id: 'u1',
        leave_policy_id: 'lp1',
        start_date: '2025-11-01',
        end_date: '2025-11-03',
        reason: 'Vacation',
      }),
    };

    const res = await handleLeaveRequestsPOST(mockClient, event);
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.leave_request_id).toBe('lr1');
  });

  it('should return 500 on query error', async () => {
    mockClient.query.mockRejectedValueOnce(new Error('DB error'));

    const event = {
      body: JSON.stringify({
        user_id: 'u1',
        leave_policy_id: 'lp1',
        start_date: '2025-11-01',
        end_date: '2025-11-03',
      }),
    };

    const res = await handleLeaveRequestsPOST(mockClient, event);
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).message).toBe('Internal server error');
  });
});
