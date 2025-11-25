import { jest } from "@jest/globals";
import { handleDeleteBooking } from "../booking_handlers/deleteBookingHandler.mjs";

let mockClient;

beforeEach(() => {
  mockClient = {
    query: jest.fn(),
  };
});

describe("handleDeleteBooking", () => {

  // ------------------ MISSING booking_id ------------------
  test("returns 400 if booking_id is missing", async () => {
    const event = { queryStringParameters: {} };

    const res = await handleDeleteBooking(mockClient, event);

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toMatch(/booking_id/);
  });

  // ------------------ MISSING user_id ------------------
  test("returns 400 if user_id is missing", async () => {
    const event = {
      queryStringParameters: { booking_id: "1" },
      body: JSON.stringify({}),  // no user_id
      currentUser: null,
    };

    const res = await handleDeleteBooking(mockClient, event);

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toMatch(/Missing user_id/);
  });

  // ------------------ BOOKING NOT FOUND ------------------
  test("returns 404 if booking does not exist", async () => {
    mockClient.query
      .mockResolvedValueOnce()            // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // SELECT booking
      .mockResolvedValueOnce();           // ROLLBACK

    const event = {
      queryStringParameters: { booking_id: "10" },
      currentUser: { user_id: 99 },
    };

    const res = await handleDeleteBooking(mockClient, event);

    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body).message).toMatch(/Booking not found/);
  });

  // ------------------ ALREADY CANCELLED ------------------
  test("returns 200 if booking already cancelled", async () => {
    mockClient.query
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({
        rows: [{ booking_id: 5, status: "cancelled" }],
      }) // SELECT
      .mockResolvedValueOnce(); // COMMIT

    const event = {
      queryStringParameters: { booking_id: "5" },
      currentUser: { user_id: 99 },
    };

    const res = await handleDeleteBooking(mockClient, event);

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).message).toMatch(/already cancelled/);
  });

  // ------------------ SUCCESSFUL CANCELLATION ------------------
  test("successfully cancels booking", async () => {
    mockClient.query
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({
        rows: [{ booking_id: 3, status: "approved" }],
      }) // SELECT booking
      .mockResolvedValueOnce() // UPDATE
      .mockResolvedValueOnce() // INSERT audit
      .mockResolvedValueOnce(); // COMMIT

    const event = {
      queryStringParameters: { booking_id: "3" },
      currentUser: { user_id: 50 },
    };

    const res = await handleDeleteBooking(mockClient, event);
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toMatch(/Booking cancelled successfully/);

    // verify correct SQL updates
    expect(mockClient.query).toHaveBeenCalledWith(
      `UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE booking_id = $1;`,
      ["3"]
    );

    expect(mockClient.query).toHaveBeenCalledWith(
      `INSERT INTO booking_audit (booking_id, action, performed_by_user_id) VALUES ($1, 'cancelled', $2);`,
      ["3", 50]
    );
  });

  // ------------------ INTERNAL SERVER ERROR ------------------
  test("returns 500 on DB error", async () => {
    mockClient.query
      .mockResolvedValueOnce() // BEGIN
      .mockRejectedValueOnce(new Error("DB crash")) // SELECT fails
      .mockResolvedValueOnce(); // ROLLBACK

    const event = {
      queryStringParameters: { booking_id: "7" },
      currentUser: { user_id: 20 },
    };

    const res = await handleDeleteBooking(mockClient, event);

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).message).toMatch(/Internal server error/);
  });

});
