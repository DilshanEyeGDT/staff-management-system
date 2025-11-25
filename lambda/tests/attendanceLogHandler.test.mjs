// tests/attendanceLogHandler.test.mjs
import { describe, it, expect, jest } from '@jest/globals';
import { handleAttendanceLogs } from '../handlers/attendanceLogHandler.mjs';

describe('handleAttendanceLogs', () => {

  it('should return 400 if user_id is missing', async () => {
    const mockClient = {};
    const queryParams = {}; // no user_id
    const response = await handleAttendanceLogs(mockClient, queryParams);

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Missing required parameter: user_id');
  });

  it('should return 200 and attendance logs without date filters', async () => {
    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [{ attendance_log_id: 1, date: '2025-11-19', clock_in_time: '09:00', clock_out_time: '17:00' }] }) // fetch logs
        .mockResolvedValueOnce({ rows: [{ total: '1' }] }) // count total
    };

    const queryParams = { user_id: 'u123', page: 1, size: 10 };
    const response = await handleAttendanceLogs(mockClient, queryParams);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.pagination.page).toBe(1);
    expect(body.data.pagination.size).toBe(10);
    expect(body.data.pagination.total).toBe(1);
    expect(body.data.attendanceLogs.length).toBe(1);
    expect(mockClient.query).toHaveBeenCalledTimes(2);
  });

  it('should return 200 and attendance logs with start_date and end_date', async () => {
    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [{ attendance_log_id: 2, date: '2025-11-19', clock_in_time: '10:00', clock_out_time: '18:00' }] }) // fetch logs
        .mockResolvedValueOnce({ rows: [{ total: '1' }] }) // count total
    };

    const queryParams = { user_id: 'u123', start_date: '2025-11-01', end_date: '2025-11-30', page: 1, size: 10 };
    const response = await handleAttendanceLogs(mockClient, queryParams);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.pagination.total).toBe(1);
    expect(body.data.attendanceLogs[0].attendance_log_id).toBe(2);
  });

  it('should handle default page and size if not provided', async () => {
    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })
    };

    const queryParams = { user_id: 'u123' }; // no page, size
    const response = await handleAttendanceLogs(mockClient, queryParams);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.pagination.page).toBe(1);
    expect(body.data.pagination.size).toBe(10);
  });

});
