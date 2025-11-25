// tests/leaveRequestPatchHandler.test.mjs
import { jest } from '@jest/globals';
import { handleLeaveRequestPatch } from '../handlers/leaveRequestPatchHandler.mjs';

describe('handleLeaveRequestPatch', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: jest.fn()
    };
  });

  it('should return 400 if leave_request id is missing', async () => {
    const event = { queryStringParameters: {} };
    const res = await handleLeaveRequestPatch(mockClient, event);
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toBe('Missing path parameter: id');
  });

  it('should return 400 if body is invalid JSON', async () => {
    const event = { queryStringParameters: { id: '1' }, body: '{invalidJson}' };
    const res = await handleLeaveRequestPatch(mockClient, event);
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toBe('Invalid JSON body');
  });

  it('should return 400 if status is invalid', async () => {
    const event = { queryStringParameters: { id: '1' }, body: JSON.stringify({ status: 'pending' }) };
    const res = await handleLeaveRequestPatch(mockClient, event);
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toBe('Invalid or missing status');
  });

  it('should return 404 if leave request not found', async () => {
  // 1️⃣ BEGIN transaction
  mockClient.query.mockResolvedValueOnce({ rows: [] });
  // 2️⃣ SELECT leave_request → empty
  mockClient.query.mockResolvedValueOnce({ rows: [] });

  const event = {
    queryStringParameters: { id: '1' },
    body: JSON.stringify({ status: 'approved' })
  };
  const res = await handleLeaveRequestPatch(mockClient, event);
  expect(res.statusCode).toBe(404);
  expect(JSON.parse(res.body).message).toBe('Leave request not found');
});


  it('should return 403 if approver not found', async () => {
    // 1. BEGIN
    mockClient.query.mockResolvedValueOnce({ rows: [] });
    // 2. SELECT leave_request
    mockClient.query.mockResolvedValueOnce({ rows: [{ leave_request_id: 1, total_days: 2, user_id: 'u1', leave_policy_id: 1 }] });
    // 3. SELECT approver → empty
    mockClient.query.mockResolvedValueOnce({ rows: [] });

    const event = {
      queryStringParameters: { id: '1' },
      body: JSON.stringify({ status: 'approved' }),
      requestContext: { authorizer: { claims: { sub: 'cognitoSub' } } }
    };
    const res = await handleLeaveRequestPatch(mockClient, event);
    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body).message).toBe('Approver not found in system');
  });

  it('should return 400 if leave balance not found', async () => {
    // 1. BEGIN
    mockClient.query.mockResolvedValueOnce({ rows: [] });
    // 2. SELECT leave_request
    mockClient.query.mockResolvedValueOnce({ rows: [{ leave_request_id: 1, total_days: 2, user_id: 'u1', leave_policy_id: 1 }] });
    // 3. SELECT approver
    mockClient.query.mockResolvedValueOnce({ rows: [{ user_id: 'approver1' }] });
    // 4. SELECT leave_balance → empty
    mockClient.query.mockResolvedValueOnce({ rows: [] });

    const event = {
      queryStringParameters: { id: '1' },
      body: JSON.stringify({ status: 'approved' }),
      requestContext: { authorizer: { claims: { sub: 'cognitoSub' } } }
    };
    const res = await handleLeaveRequestPatch(mockClient, event);
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toBe('Leave balance not found for this user/type');
  });

  it('should return 400 if not enough remaining leave days', async () => {
    // 1. BEGIN
    mockClient.query.mockResolvedValueOnce({ rows: [] });
    // 2. SELECT leave_request
    mockClient.query.mockResolvedValueOnce({ rows: [{ leave_request_id: 1, total_days: 10, user_id: 'u1', leave_policy_id: 1 }] });
    // 3. SELECT approver
    mockClient.query.mockResolvedValueOnce({ rows: [{ user_id: 'approver1' }] });
    // 4. SELECT leave_balance → insufficient days
    mockClient.query.mockResolvedValueOnce({ rows: [{ leave_balance_id: 10, remaining_days: 5 }] });

    const event = {
      queryStringParameters: { id: '1' },
      body: JSON.stringify({ status: 'approved' }),
      requestContext: { authorizer: { claims: { sub: 'cognitoSub' } } }
    };
    const res = await handleLeaveRequestPatch(mockClient, event);
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toBe('Not enough remaining leave days');
  });

  it('should return 200 for successful approval', async () => {
    // 1. BEGIN
    mockClient.query.mockResolvedValueOnce({ rows: [] });
    // 2. SELECT leave_request
    mockClient.query.mockResolvedValueOnce({ rows: [{ leave_request_id: 1, total_days: 2, user_id: 'u1', leave_policy_id: 1 }] });
    // 3. SELECT approver
    mockClient.query.mockResolvedValueOnce({ rows: [{ user_id: 'approver1' }] });
    // 4. SELECT leave_balance → sufficient days
    mockClient.query.mockResolvedValueOnce({ rows: [{ leave_balance_id: 10, remaining_days: 5 }] });
    // 5. UPDATE leave_balance
    mockClient.query.mockResolvedValueOnce({ rows: [] });
    // 6. UPDATE leave_request
    mockClient.query.mockResolvedValueOnce({ rows: [{ leave_request_id: 1, status: 'approved', approver_id: 'approver1' }] });
    // 7. INSERT leave_audit
    mockClient.query.mockResolvedValueOnce({ rows: [] });
    // 8. COMMIT
    mockClient.query.mockResolvedValueOnce({ rows: [] });

    const event = {
      queryStringParameters: { id: '1' },
      body: JSON.stringify({ status: 'approved', comment: 'Approved' }),
      requestContext: { authorizer: { claims: { sub: 'cognitoSub' } } }
    };
    const res = await handleLeaveRequestPatch(mockClient, event);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.leaveRequest.status).toBe('approved');
  });
});
