/**
 * @file roomAvailabilityHandler.test.mjs
 */

import { handleRoomAvailability } from "../booking_handlers/roomAvailabilityHandler.mjs";
import { jest } from '@jest/globals';

describe("handleRoomAvailability", () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
    };
  });

  // --------------------------------------------------------
  // Case 1: No room_id → return all active rooms
  // --------------------------------------------------------
  test("should return all active rooms when room_id is missing", async () => {
    const roomsMock = [
      { room_id: 1, room_name: "Lab 1" },
      { room_id: 2, room_name: "Auditorium" },
    ];

    mockClient.query.mockResolvedValueOnce({ rows: roomsMock });

    const event = { queryStringParameters: {} };

    const res = await handleRoomAvailability(mockClient, event);

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ rooms: roomsMock });
    expect(mockClient.query).toHaveBeenCalledTimes(1);
  });

  // --------------------------------------------------------
  // Case 2: Room not found
  // --------------------------------------------------------
  test("should return 404 if room does not exist", async () => {
    mockClient.query.mockResolvedValueOnce({ rows: [] });

    const event = {
      queryStringParameters: { room_id: "99" },
    };

    const res = await handleRoomAvailability(mockClient, event);

    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body)).toEqual({ error: "Room not found" });
  });

  // --------------------------------------------------------
  // Case 3: Invalid date format
  // --------------------------------------------------------
  test("should return 400 for invalid date input", async () => {
    mockClient.query.mockResolvedValueOnce({
      rows: [{ room_id: 1, room_name: "Lab 1" }],
    });

    const event = {
      queryStringParameters: {
        room_id: "1",
        start: "INVALID_DATE",
        end: "2025-01-01",
      },
    };

    const res = await handleRoomAvailability(mockClient, event);

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body)).toEqual({
      error: "Invalid date format. Use YYYY-MM-DD.",
    });
  });

  // --------------------------------------------------------
  // Case 4: start > end
  // --------------------------------------------------------
  test("should return 400 when start is after end", async () => {
    mockClient.query.mockResolvedValueOnce({
      rows: [{ room_id: 1, room_name: "Lab 1" }],
    });

    const event = {
      queryStringParameters: {
        room_id: "1",
        start: "2025-05-10",
        end: "2025-05-01",
      },
    };

    const res = await handleRoomAvailability(mockClient, event);

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body)).toEqual({
      error: "start date must be before end date",
    });
  });

  // --------------------------------------------------------
  // Case 5: Valid room timeline generation
  // --------------------------------------------------------
  test("should return timeline with free and busy slots", async () => {
  const room = { room_id: 1, room_name: "Lab 1" };

  mockClient.query
    .mockResolvedValueOnce({ rows: [room] }) // Room exists
    .mockResolvedValueOnce({
      rows: [
        { start_time: "2025-02-01T10:00:00.000Z", end_time: "2025-02-01T12:00:00.000Z" },
        { start_time: "2025-02-01T14:00:00.000Z", end_time: "2025-02-01T16:00:00.000Z" },
      ],
    });

  const event = {
    queryStringParameters: {
      room_id: "1",
      start: "2025-02-01",
      end: "2025-02-01",
    },
  };

  const res = await handleRoomAvailability(mockClient, event);

  expect(res.statusCode).toBe(200);

  const body = JSON.parse(res.body);

  expect(body.room_id).toBe(1);
  expect(body.timeline.length).toBe(5);

  // Validate statuses for each slot
  expect(body.timeline[0].status).toBe("free");

});


  // --------------------------------------------------------
  // Case 6: Internal server error
  // --------------------------------------------------------
  test("should return 500 on unexpected error", async () => {
    mockClient.query.mockRejectedValueOnce(new Error("DB crashed"));

    const event = { queryStringParameters: {} };

    const res = await handleRoomAvailability(mockClient, event);

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).error).toBe("Internal server error");
  });
});
