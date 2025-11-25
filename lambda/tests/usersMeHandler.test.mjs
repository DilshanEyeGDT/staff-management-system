import { jest } from '@jest/globals';

// 1️⃣ Mock the entire module
jest.unstable_mockModule('../utils/userSync.mjs', () => ({
  syncUser: jest.fn(),
}));

// 2️⃣ Import modules after mocking
const { handleUsersMe } = await import('../handlers/usersMeHandler.mjs');
const userSync = await import('../utils/userSync.mjs');

describe('handleUsersMe', () => {
  let mockClient;
  let mockEvent;

  beforeEach(() => {
    mockClient = {};
    mockEvent = { headers: {}, requestContext: {} };
    jest.clearAllMocks();
  });

  it('should return 200 and user info when syncUser succeeds', async () => {
    // ✅ Provide mock resolved value
    userSync.syncUser.mockResolvedValue({
      currentUser: { user_id: 123, display_name: 'Alice' },
    });

    const res = await handleUsersMe(mockClient, mockEvent);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.user).toEqual({
      user_id: 123,
      display_name: 'Alice',
    });
  });

  it('should return 500 if syncUser throws an error', async () => {
    const errorMessage = 'DB connection failed';
    userSync.syncUser.mockRejectedValue(new Error(errorMessage));

    const res = await handleUsersMe(mockClient, mockEvent);

    expect(res.statusCode).toBe(500);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Internal server error');
    expect(body.error).toBe(errorMessage);
  });
});
