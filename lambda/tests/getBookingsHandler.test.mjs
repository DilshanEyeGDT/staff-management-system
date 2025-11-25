import { jest } from "@jest/globals";
import { handleGetBookings } from "../booking_handlers/getBookingsHandler.mjs";

let mockClient;

beforeEach(() => {
  mockClient = {
    query: jest.fn(),
  };
});

describe("handleGetBookings", () => {
  // ------------------ INVALID PAGINATION ------------------
  test("returns 400 for invalid pagination", async () => {
    const event = {
      queryStringParameters: { page: "0", size: "10" },
    };

    const res = await handleGetBookings(mockClient, event);
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toMatch(/pagination/i);
  });

  // ------------------ GET SINGLE BOOKING: NOT FOUND ------------------
  test("returns 404 if booking_id does not exist", async () => {
    mockClient.query.mockResolvedValueOnce({ rows: [] });

    const event = {
      queryStringParameters: { booking_id: "111" },
    };

    const res = await handleGetBookings(mockClient, event);
    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body).message).toMatch(/not found/i);
  });

  // ------------------ GET SINGLE BOOKING: SUCCESS ------------------
  test("returns single booking when booking_id is provided", async () => {
    const mockRow = {
      booking_id: 10,
      start_time: "2025-01-01T10:00",
      end_time: "2025-01-01T12:00",
      status: "approved",
      user_name: "John Doe",
      room_name: "Conference Room",
    };

    mockClient.query.mockResolvedValueOnce({ rows: [mockRow] });

    const event = {
      queryStringParameters: { booking_id: "10" },
    };

    const res = await handleGetBookings(mockClient, event);
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(mockRow);
  });

  // ------------------ LIST BOOKINGS WITH NO FILTERS ------------------
  test("returns paginated list when no filters are provided", async () => {
    // Count query
    mockClient.query.mockResolvedValueOnce({ rows: [{ total: "2" }] });

    // Data query
    const mockRows = [
      { booking_id: 1, user_name: "A", room_name: "Room A" },
      { booking_id: 2, user_name: "B", room_name: "Room B" },
    ];
    mockClient.query.mockResolvedValueOnce({ rows: mockRows });

    const event = {
      queryStringParameters: {},
    };

    const res = await handleGetBookings(mockClient, event);
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.total).toBe(2);
    expect(body.data).toEqual(mockRows);

    // Check default pagination
    expect(body.page).toBe(1);
    expect(body.size).toBe(10);
  });

  // ------------------ INTERNAL SERVER ERROR ------------------
  test("returns 500 when DB error occurs", async () => {
    mockClient.query.mockRejectedValueOnce(new Error("DB error"));

    const event = {
      queryStringParameters: {},
    };

    const res = await handleGetBookings(mockClient, event);

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).message).toMatch(/internal server error/i);
  });
});
