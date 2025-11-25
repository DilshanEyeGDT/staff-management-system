import { handleRoomSearch } from "../booking_handlers/roomSearchHandler.mjs";
import { jest } from '@jest/globals';

describe("handleRoomSearch", () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
    };
  });

  // -----------------------------------------------------
  // 1. INVALID DATE FORMAT
  // -----------------------------------------------------
  test("should return 400 for invalid date", async () => {
    const event = {
      queryStringParameters: {
        date: "not-a-date",
      },
    };

    const res = await handleRoomSearch(mockClient, event);

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toBe("Invalid date format. Use ISO date string.");
  });

  // -----------------------------------------------------
  // 2. NO FILTERS → RETURN ALL ROOMS
  // -----------------------------------------------------
  test("should return all rooms when no filters provided", async () => {
    mockClient.query.mockResolvedValueOnce({
      rowCount: 2,
      rows: [
        { room_id: 1, room_name: "Lab A", capacity: 40 },
        { room_id: 2, room_name: "Lab B", capacity: 30 },
      ],
    });

    const event = { queryStringParameters: {} };

    const res = await handleRoomSearch(mockClient, event);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);

    expect(body.total).toBe(2);
    expect(body.rooms.length).toBe(2);
    expect(mockClient.query).toHaveBeenCalledTimes(1);
  });

  // -----------------------------------------------------
  // 3. CAPACITY FILTER
  // -----------------------------------------------------
  test("should filter rooms by minimum capacity", async () => {
    mockClient.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ room_id: 5, room_name: "Auditorium", capacity: 100 }],
    });

    const event = {
      queryStringParameters: {
        capacity: "80",
      },
    };

    const res = await handleRoomSearch(mockClient, event);
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.total).toBe(1);
    expect(body.rooms[0].capacity).toBe(100);

    // capacity was parameter $1
    const expectedValues = [80, null, null, 10, 0];
    expect(mockClient.query.mock.calls[0][1]).toEqual(expectedValues);
  });

  // -----------------------------------------------------
  // 4. EQUIPMENT FILTER
  // -----------------------------------------------------
  test("should filter rooms by equipment list", async () => {
    mockClient.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [
        { room_id: 3, room_name: "Meeting Room", equipments: ["tv", "projector"] },
      ],
    });

    const event = {
      queryStringParameters: {
        equipments: "tv,projector",
      },
    };

    const res = await handleRoomSearch(mockClient, event);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);

    expect(body.total).toBe(1);
    expect(body.rooms[0].room_id).toBe(3);

    // equipment array passed as parameter $2
    const expectedValues = [null, ["tv", "projector"], null, 10, 0];
    expect(mockClient.query.mock.calls[0][1]).toEqual(expectedValues);
  });

  // -----------------------------------------------------
  // 5. DATE FILTER (check availability)
  // -----------------------------------------------------
  test("should filter rooms by availability on given date", async () => {
    mockClient.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [
        { room_id: 10, room_name: "Computer Lab", capacity: 50 },
      ],
    });

    const event = {
      queryStringParameters: {
        date: "2025-03-01",
      },
    };

    const res = await handleRoomSearch(mockClient, event);

    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.total).toBe(1);
    expect(body.rooms[0].room_id).toBe(10);

    const expectedValues = [null, null, "2025-03-01", 10, 0];
    expect(mockClient.query.mock.calls[0][1]).toEqual(expectedValues);
  });

  // -----------------------------------------------------
  // 6. PAGINATION
  // -----------------------------------------------------
  test("should apply pagination parameters correctly", async () => {
    mockClient.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ room_id: 99, room_name: "Training Room" }],
    });

    const event = {
      queryStringParameters: {
        page: "2",
        size: "5",
      },
    };

    const res = await handleRoomSearch(mockClient, event);

    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.page).toBe(2);
    expect(body.size).toBe(5);

    const expectedValues = [null, null, null, 5, 5]; // limit 5 offset 5
    expect(mockClient.query.mock.calls[0][1]).toEqual(expectedValues);
  });

  // -----------------------------------------------------
  // 7. INTERNAL SERVER ERROR
  // -----------------------------------------------------
  test("should return 500 on unexpected error", async () => {
    mockClient.query.mockRejectedValueOnce(new Error("Database crashed"));

    const event = { queryStringParameters: {} };

    const res = await handleRoomSearch(mockClient, event);

    expect(res.statusCode).toBe(500);

    const body = JSON.parse(res.body);
    expect(body.error).toBe("Internal server error while searching rooms");
  });
});
