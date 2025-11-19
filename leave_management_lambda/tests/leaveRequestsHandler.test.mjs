// tests/leaveRequestsHandler.test.mjs
import { handleLeaveRequests } from '../handlers/leaveRequestsHandler.mjs';
import { jest } from '@jest/globals';

describe('handleLeaveRequests', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
    };
  });

  it('should return 405 if method is not GET', async () => {
    const res = await handleLeaveRequests(mockClient, 'POST', {});
    expect(res.statusCode).toBe(405);
    expect(JSON.parse(res.body).message).toBe('Method not allowed');
  });

  it('should return leave requests with pagination', async () => {
    mockClient.query
      .mockResolvedValueOnce({
        rows: [
          {
            leave_request_id: 1,
            display_name: 'John Doe',
            leave_type: 'Annual',
            start_date: '2025-11-01',
            end_date: '2025-11-03',
            total_days: 3,
            reason: 'Vacation',
            status: 'pending',
            approver_name: null,
            approved_at: null,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ total: '1' }],
      });

    const queryParams = { user_id: 'u1', page: '1', size: '10' };
    const res = await handleLeaveRequests(mockClient, 'GET', queryParams);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.pagination.page).toBe(1);
    expect(body.data.pagination.size).toBe(10);
    expect(body.data.pagination.total).toBe(1);
    expect(body.data.leaveRequests.length).toBe(1);
    expect(body.data.leaveRequests[0].display_name).toBe('John Doe');
  });

  it('should handle no query parameters', async () => {
    mockClient.query
      .mockResolvedValueOnce({
        rows: [
          {
            leave_request_id: 2,
            display_name: 'Alice',
            leave_type: 'Casual',
            start_date: '2025-11-05',
            end_date: '2025-11-06',
            total_days: 2,
            reason: 'Personal',
            status: 'approved',
            approver_name: 'Manager',
            approved_at: '2025-11-04T10:00:00Z',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ total: '1' }],
      });

    const res = await handleLeaveRequests(mockClient, 'GET', {});
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.leaveRequests[0].display_name).toBe('Alice');
  });

  it('should correctly handle start_date and end_date filters', async () => {
    mockClient.query
      .mockResolvedValueOnce({
        rows: [
          {
            leave_request_id: 3,
            display_name: 'Bob',
            leave_type: 'Sick',
            start_date: '2025-11-10',
            end_date: '2025-11-12',
            total_days: 3,
            reason: 'Flu',
            status: 'pending',
            approver_name: null,
            approved_at: null,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ total: '1' }],
      });

    const queryParams = { start_date: '2025-11-10', end_date: '2025-11-12' };
    const res = await handleLeaveRequests(mockClient, 'GET', queryParams);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.leaveRequests[0].display_name).toBe('Bob');
  });
});
