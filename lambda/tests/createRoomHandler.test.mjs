import { jest } from '@jest/globals';
import { handleRoomCreate } from '../booking_handlers/createRoomHandler.mjs';

// Mock DB client
let mockClient;

beforeEach(() => {
  mockClient = {
    query: jest.fn(),
  };
});

describe("handleRoomCreate", () => {

  // ------------------------ INVALID JSON ------------------------
  test("should return 400 for invalid JSON body", async () => {
    const event = { body: "{invalid-json" };

    const res = await handleRoomCreate(mockClient, event);

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/Invalid JSON body/);
  });

  // ------------------------ MISSING FIELDS ------------------------
  test("should return 400 when required fields are missing", async () => {
    const event = {
      body: JSON.stringify({ room_name: "" }),
    };

    const res = await handleRoomCreate(mockClient, event);

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/Missing required fields/);
  });

  // ------------------------ INVALID EQUIPMENTS TYPE ------------------------
  test("should return 400 when equipments is not an array", async () => {
    const event = {
      body: JSON.stringify({
        room_name: "Room A",
        capacity: 10,
        equipments: "not-array",
      }),
    };

    const res = await handleRoomCreate(mockClient, event);

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/equipments must be an array/);
  });

  // ------------------------ DUPLICATE ROOM ------------------------
  test("should return 409 when room already exists", async () => {
    mockClient.query.mockResolvedValueOnce({
      rows: [{ room_id: 1 }],
    });

    const event = {
      body: JSON.stringify({
        room_name: "Meeting Room",
        capacity: 12,
      }),
    };

    const res = await handleRoomCreate(mockClient, event);

    expect(res.statusCode).toBe(409);
    expect(JSON.parse(res.body).error).toMatch(/already exists/);
  });

  // ------------------------ SUCCESSFUL CREATE ------------------------
  test("should return 201 when room is created successfully", async () => {
    // first query → duplicate check
    mockClient.query
      .mockResolvedValueOnce({ rows: [] }) // no duplicates
      .mockResolvedValueOnce({
        rows: [
          {
            room_id: 10,
            room_name: "New Room",
            description: "Nice room",
            capacity: 20,
            location: "Building A",
            equipments: ["TV"],
          },
        ],
      });

    const event = {
      body: JSON.stringify({
        room_name: "New Room",
        description: "Nice room",
        capacity: 20,
        location: "Building A",
        equipments: ["TV"],
      }),
    };

    const res = await handleRoomCreate(mockClient, event);
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(201);
    expect(body.success).toBe(true);
    expect(body.room.room_id).toBe(10);
  });

  // ------------------------ INTERNAL SERVER ERROR ------------------------
  test("should return 500 when DB query throws", async () => {
    mockClient.query.mockRejectedValueOnce(new Error("DB failure"));

    const event = {
      body: JSON.stringify({
        room_name: "Room X",
        capacity: 5,
      }),
    };

    const res = await handleRoomCreate(mockClient, event);

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).error).toMatch(/Internal server error/);
  });

});
