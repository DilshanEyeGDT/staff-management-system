import { handleUtilizationReport } from "../booking_handlers/utilizationReportHandler.mjs";
import { jest } from '@jest/globals';

describe("handleUtilizationReport", () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
    };
  });

  // -----------------------------------------------------
  // 1. MISSING PARAMETERS
  // -----------------------------------------------------
  test("should return 400 if start_date or end_date is missing", async () => {
    const event = { queryStringParameters: {} };

    const res = await handleUtilizationReport(mockClient, event);

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.message).toMatch(/Missing required query parameters/);
  });

  // -----------------------------------------------------
  // 2. INVALID DATE RANGE
  // -----------------------------------------------------
  test("should return 400 for invalid date range", async () => {
    const event = {
      queryStringParameters: {
        start_date: "2025-03-10",
        end_date: "2025-03-01", // start > end
      },
    };

    const res = await handleUtilizationReport(mockClient, event);

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.message).toBe("Invalid date range");
  });

  // -----------------------------------------------------
  // 3. SUCCESSFUL REPORT - group_by = room
  // -----------------------------------------------------
  test("should return utilization report grouped by room", async () => {
    const mockRows = [
      {
        room_id: 1,
        room_name: "Lab A",
        total_bookings: 5,
        total_duration_hours: 20,
        utilization_percentage: 50,
      },
      {
        room_id: 2,
        room_name: "Lab B",
        total_bookings: 3,
        total_duration_hours: 15,
        utilization_percentage: 37.5,
      },
    ];

    mockClient.query.mockResolvedValueOnce({ rows: mockRows });

    const event = {
      queryStringParameters: {
        start_date: "2025-03-01",
        end_date: "2025-03-05",
        group_by: "room",
      },
    };

    const res = await handleUtilizationReport(mockClient, event);

    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.group_by).toBe("room");
    expect(body.data.length).toBe(2);
    expect(body.data[0].room_name).toBe("Lab A");
    expect(mockClient.query).toHaveBeenCalledTimes(1);
  });

  // -----------------------------------------------------
  // 4. SUCCESSFUL REPORT - group_by = time
  // -----------------------------------------------------
  test("should return utilization report grouped by time", async () => {
    const mockRows = [
      {
        day: "2025-03-01",
        total_bookings: 2,
        total_duration_hours: 8,
        utilization_percentage: 44.44,
      },
      {
        day: "2025-03-02",
        total_bookings: 3,
        total_duration_hours: 10,
        utilization_percentage: 55.56,
      },
    ];

    mockClient.query.mockResolvedValueOnce({ rows: mockRows });

    const event = {
      queryStringParameters: {
        start_date: "2025-03-01",
        end_date: "2025-03-02",
        group_by: "time",
      },
    };

    const res = await handleUtilizationReport(mockClient, event);

    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.group_by).toBe("time");
    expect(body.data.length).toBe(2);
    expect(body.data[1].day).toBe("2025-03-02");
  });

  // -----------------------------------------------------
  // 5. INTERNAL SERVER ERROR
  // -----------------------------------------------------
  test("should return 500 on unexpected error", async () => {
    mockClient.query.mockRejectedValueOnce(new Error("Database failure"));

    const event = {
      queryStringParameters: {
        start_date: "2025-03-01",
        end_date: "2025-03-05",
      },
    };

    const res = await handleUtilizationReport(mockClient, event);

    expect(res.statusCode).toBe(500);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.message).toBe("Internal server error");
    expect(body.error).toBe("Database failure");
  });
});
