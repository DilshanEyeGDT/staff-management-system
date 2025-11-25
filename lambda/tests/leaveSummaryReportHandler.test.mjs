import { jest } from '@jest/globals';
import { handleLeaveSummaryReport } from '../handlers/leaveSummaryReportHandler.mjs';

describe('handleLeaveSummaryReport', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
    };
  });

  it('should return 400 if start_date or end_date is missing', async () => {
    const event = { queryStringParameters: { start_date: '2025-11-01' } };
    const res = await handleLeaveSummaryReport(mockClient, event);
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toBe('start_date and end_date are required');
  });

  it('should return leave summary and attendance report successfully', async () => {
    const leaveRows = [
      { user_id: 1, display_name: 'Alice', leave_type: 'Annual', total_taken: 5, remaining_days: 10 },
      { user_id: 2, display_name: 'Bob', leave_type: 'Casual', total_taken: 2, remaining_days: 8 },
    ];

    const attendanceRows = [
      { user_id: 1, total_present: 20, total_absent: 2, total_leave: 5 },
      { user_id: 2, total_present: 18, total_absent: 4, total_leave: 2 },
    ];

    mockClient.query
      .mockResolvedValueOnce({ rows: leaveRows }) // leave summary query
      .mockResolvedValueOnce({ rows: attendanceRows }); // attendance summary query

    const event = { queryStringParameters: { start_date: '2025-11-01', end_date: '2025-11-30' } };
    const res = await handleLeaveSummaryReport(mockClient, event);

    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.data[0]).toMatchObject({
      user_id: 1,
      display_name: 'Alice',
      leave_type: 'Annual',
      total_leave_taken: 5,
      remaining_days: 10,
      attendance: { total_present: 20, total_absent: 2, total_leave: 5 },
    });
    expect(body.data[1]).toMatchObject({
      user_id: 2,
      display_name: 'Bob',
      leave_type: 'Casual',
      total_leave_taken: 2,
      remaining_days: 8,
      attendance: { total_present: 18, total_absent: 4, total_leave: 2 },
    });
  });

  it('should handle users with no attendance records', async () => {
    const leaveRows = [
      { user_id: 3, display_name: 'Charlie', leave_type: 'Annual', total_taken: 0, remaining_days: 15 },
    ];

    mockClient.query
      .mockResolvedValueOnce({ rows: leaveRows }) // leave summary
      .mockResolvedValueOnce({ rows: [] }); // no attendance

    const event = { queryStringParameters: { start_date: '2025-11-01', end_date: '2025-11-30' } };
    const res = await handleLeaveSummaryReport(mockClient, event);

    const body = JSON.parse(res.body);
    expect(res.statusCode).toBe(200);
    expect(body.data[0].attendance).toEqual({ total_present: 0, total_absent: 0, total_leave: 0 });
  });

  it('should return 500 if query fails', async () => {
    mockClient.query.mockRejectedValueOnce(new Error('DB error'));

    const event = { queryStringParameters: { start_date: '2025-11-01', end_date: '2025-11-30' } };
    const res = await handleLeaveSummaryReport(mockClient, event);

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).message).toBe('Internal server error');
  });

  it('should filter by user_id if provided', async () => {
    const leaveRows = [
      { user_id: 2, display_name: 'Bob', leave_type: 'Casual', total_taken: 2, remaining_days: 8 },
    ];
    const attendanceRows = [
      { user_id: 2, total_present: 18, total_absent: 4, total_leave: 2 },
    ];

    mockClient.query
      .mockResolvedValueOnce({ rows: leaveRows })
      .mockResolvedValueOnce({ rows: attendanceRows });

    const event = { queryStringParameters: { start_date: '2025-11-01', end_date: '2025-11-30', user_id: '2' } };
    const res = await handleLeaveSummaryReport(mockClient, event);

    const body = JSON.parse(res.body);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].user_id).toBe(2);
  });
});
