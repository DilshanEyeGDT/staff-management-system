import { handleCreateBooking } from '../booking_handlers/createBookingHandler.mjs';
import { jest } from '@jest/globals';

// Mock crypto.randomUUID()
jest.unstable_mockModule('crypto', () => ({
  default: {
    randomUUID: () => 'generated-idempotency-key'
  }
}));

// Re-import after mocking crypto
const { default: crypto } = await import('crypto');

describe('handleCreateBooking', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: jest.fn()
    };
  });

  const baseEvent = {
    body: JSON.stringify({
      room_id: 1,
      user_id: 50,
      start_time: "2025-11-21T09:00:00",
      end_time: "2025-11-21T10:00:00"
    }),
    currentUser: { user_id: 50 }
  };

  // ------------------------
  // 400: Missing Fields
  // ------------------------
  test('should return 400 when required fields are missing', async () => {
    const event = { body: JSON.stringify({}) };

    const res = await handleCreateBooking(mockClient, event);

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toMatch(/Missing required fields/);
  });

  // ------------------------
  // 400: Invalid timestamps
  // ------------------------
  test('should return 400 for invalid timestamps', async () => {
    const event = {
      body: JSON.stringify({
        room_id: 1,
        user_id: 50,
        start_time: "invalid",
        end_time: "invalid"
      })
    };

    const res = await handleCreateBooking(mockClient, event);

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toMatch(/Invalid start_time or end_time/);
  });

  // ------------------------
  // 200: Idempotency Hit
  // ------------------------
  test('should return 200 if idempotency key already exists', async () => {
    const event = {
      body: JSON.stringify({
        ...JSON.parse(baseEvent.body),
        idempotency_key: "abc123"
      })
    };

    mockClient.query
      .mockResolvedValueOnce({})            // BEGIN
      .mockResolvedValueOnce({ rows: [      // Idempotent match
        {
          booking_id: 99,
          room_id: 1,
          user_id: 50,
          start_time: "2025-11-21T09:00:00",
          end_time: "2025-11-21T10:00:00",
          status: "approved",
          idempotency_key: "abc123"
        }
      ]})
      .mockResolvedValueOnce({});           // COMMIT

    const res = await handleCreateBooking(mockClient, event);

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).message).toMatch(/already exists/);
  });

  // ------------------------
  // 409: Booking conflict
  // ------------------------
  test('should return 409 if a booking conflict exists', async () => {
    mockClient.query
      .mockResolvedValueOnce({})                      // BEGIN
      .mockResolvedValueOnce({ rows: [] })            // No idempotency match
      .mockResolvedValueOnce({ rows: [{ room_id: 1 }] }) // Lock room OK
      .mockResolvedValueOnce({ rows: [{ conflict: 1 }] }); // Conflict row found

    const res = await handleCreateBooking(mockClient, baseEvent);

    expect(res.statusCode).toBe(409);
    expect(JSON.parse(res.body).message).toMatch(/Booking conflict/);
  });

  // ------------------------
  // 409: Blackout window overlap
  // ------------------------
  test('should return 409 when blackout window exists', async () => {
    mockClient.query
      .mockResolvedValueOnce({})                      // BEGIN
      .mockResolvedValueOnce({ rows: [] })            // No idempotency match
      .mockResolvedValueOnce({ rows: [{ room_id: 1 }] }) // Lock OK
      .mockResolvedValueOnce({ rows: [] })            // No booking conflict
      .mockResolvedValueOnce({ rows: [{ blackout: 1 }] }); // Blackout found

    const res = await handleCreateBooking(mockClient, baseEvent);

    expect(res.statusCode).toBe(409);
    expect(JSON.parse(res.body).message).toMatch(/blackout window/);
  });

  // ------------------------
  // 201: Successful booking
  // ------------------------
  test('should return 201 for successful booking creation', async () => {
    const fakeBooking = {
      booking_id: 100,
      room_id: 1,
      user_id: 50,
      start_time: "2025-11-21T09:00:00",
      end_time: "2025-11-21T10:00:00",
      status: "approved",
      idempotency_key: "generated-idempotency-key"
    };

    mockClient.query
      .mockResolvedValueOnce({})                      // BEGIN
      .mockResolvedValueOnce({ rows: [] })            // No idempotency match
      .mockResolvedValueOnce({ rows: [{ room_id: 1 }] }) // Lock OK
      .mockResolvedValueOnce({ rows: [] })            // No conflict
      .mockResolvedValueOnce({ rows: [] })            // No blackout
      .mockResolvedValueOnce({ rows: [fakeBooking] }) // Insert booking
      .mockResolvedValueOnce({})                      // Insert audit
      .mockResolvedValueOnce({});                     // COMMIT

    const res = await handleCreateBooking(mockClient, baseEvent);

    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body).data.booking_id).toBe(100);
  });

  // ------------------------
  // 500: DB Error
  // ------------------------
  test('should return 500 when DB throws error', async () => {
    mockClient.query.mockRejectedValueOnce(new Error("DB exploded"));

    const res = await handleCreateBooking(mockClient, baseEvent);

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).message).toMatch(/Internal server error/);
  });
});
