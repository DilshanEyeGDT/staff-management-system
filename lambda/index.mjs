import { createDBClient } from './utils/db.mjs';
import { syncUser } from './utils/userSync.mjs';
import { handleLeaveBalance } from './handlers/leaveBalanceHandler.mjs';
import { handleHealthCheck } from './handlers/healthHandler.mjs';
import { handleLeaveRequests } from './handlers/leaveRequestsHandler.mjs';
import { handleLeaveRequestsPOST } from './handlers/leaveRequestsPostHandler.mjs';
import { handleLeaveRequestPatch } from './handlers/leaveRequestPatchHandler.mjs';
import { handleClockIn, handleClockOut } from './handlers/attendanceHandler.mjs';
import { handleAttendanceLogs } from './handlers/attendanceLogHandler.mjs';
import { handleLeaveSummaryReport } from './handlers/leaveSummaryReportHandler.mjs';
import { handleGetUserDisplayName } from './handlers/getUserDisplayName.mjs';
import { handleUsersMe } from './handlers/usersMeHandler.mjs';

export const handler = async (event) => {
  const client = await createDBClient();

  try {

    // Step 1: Sync user (middleware)
    const { currentUser, userSyncMessage } = await syncUser(client, event);
    console.log('👤', userSyncMessage, '=>', currentUser.email);

    // ✅ Step 2: Safely extract request details
    const requestPath = event?.resource || event?.path || '';
    const requestMethod = event?.httpMethod || 'GET';
    const queryParams = event?.queryStringParameters || {};
    let requestBody = {};

    try {
      if (event?.body) {
        requestBody = JSON.parse(event.body);
      }
    } catch {
      console.warn('⚠️ Invalid JSON body, skipping parse');
    }

    // Step 3: Route to API-specific handler
    let response;

    switch (requestPath) {
      
      // view all leave type balance for a specific user
      case '/api/v1/leave/balance':
        response = await handleLeaveBalance(client, event);
        break;

      case '/healthz':
        response = await handleHealthCheck(client, event);
        break;

      case '/api/v1/leave/requests':
        if (event.httpMethod === 'GET') {
          response = await handleLeaveRequests(client, event.httpMethod, event.queryStringParameters);
        } else if (event.httpMethod === 'POST') {
          response = await handleLeaveRequestsPOST(client, event);
        } else if (event.httpMethod === 'PATCH') {
          response = await handleLeaveRequestPatch(client, event);
        } else {
          response = {
            statusCode: 405,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: false, message: 'Method Not Allowed' }),
          };
        }
        break;

        case '/api/v1/users/me':
          if (event.httpMethod === 'GET') {
            response = await handleUsersMe(client, event);
          } else {
            response = {
              statusCode: 405,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ success: false, message: 'Method Not Allowed' }),
            };
          }
          break;

        case '/api/v1/attendance':
          if (requestMethod === 'GET') {
            response = await handleAttendanceLogs(client, event.queryStringParameters);
          } else {
            response = {
              statusCode: 405,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ success: false, message: 'Method Not Allowed' }),
            };
          }
          break;

        case '/api/v1/attendance/clock-in':
          if (requestMethod === 'POST') {
            response = await handleClockIn(client, { ...event, currentUser });
          } else {
            response = { statusCode: 405, 
              headers: {'Content-Type': 'application/json'}, 
              body: JSON.stringify({ success:false, message:'Method not allowed' }) };
          }
          break;
      
        case '/api/v1/attendance/clock-out':
          if (requestMethod === 'POST') {
            response = await handleClockOut(client, { ...event, currentUser });
          } else {
            response = { statusCode: 405, 
              headers: {'Content-Type': 'application/json'}, 
              body: JSON.stringify({ success:false, message:'Method not allowed' }) };
          }
          break;

        case '/api/v1/reports/leave-summary':
          if (event.httpMethod === 'GET') {
            response = await handleLeaveSummaryReport(client, event);
          } else {
            response = {
              statusCode: 405,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ success: false, message: 'Method Not Allowed' }),
            };
          }
          break;

        case '/api/v1/users':
          if (event.httpMethod === 'GET') {
            response = await handleGetUserDisplayName(client, event.queryStringParameters || {});
          } else {
            response = {
              statusCode: 405,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ success: false, message: "Method Not Allowed" })
            };
          }
          break;
          
      default:
        response = {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Route not found' }),
        };
    }

    await client.end();
    return response;
  } catch (err) {
    console.error('❌ Error:', err);
    await client.end();
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Internal server error',
        error: err.message,
      }),
    };
  }
};
