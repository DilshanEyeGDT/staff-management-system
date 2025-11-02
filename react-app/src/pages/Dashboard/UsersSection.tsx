import React, { useState } from "react";
import { Box, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material";
import axios from "../../axiosConfig";

interface Props {
  users: any[];
}

const UsersSection: React.FC<Props> = ({ users }) => {
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        User List
      </Typography>

      {selectedUser ? (
        <Box>
          <Button variant="outlined" onClick={() => setSelectedUser(null)}>
            ← Back to Users
          </Button>

          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">User Details</Typography>
            <Typography>Email: {selectedUser.email}</Typography>
            <Typography>Display Name: {selectedUser.displayName}</Typography>
            <Typography>Roles: {selectedUser.roles?.join(", ")}</Typography>

            {selectedUser.auditLogs && selectedUser.auditLogs.length > 0 ? (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6">Audit Logs</Typography>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Event Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>IP Address</TableCell>
                      <TableCell>User Agent</TableCell>
                      <TableCell>Created At</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedUser.auditLogs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.eventType}</TableCell>
                        <TableCell>{log.eventDesc}</TableCell>
                        <TableCell>{log.ipAddress}</TableCell>
                        <TableCell>{log.userAgent}</TableCell>
                        <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ) : (
              <Typography sx={{ mt: 2 }}>No audit logs available.</Typography>
            )}
          </Box>
        </Box>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Display Name</TableCell>
              <TableCell>Roles</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow
                id={`user-row-${user.id}`}
                key={user.id}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() =>
                  axios
                    .get(`/admin/users/${user.id}`)
                    .then((res) => setSelectedUser(res.data))
                    .catch(console.error)
                }
              >
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.displayName}</TableCell>
                <TableCell>{user.roles?.join(", ")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
};

export default UsersSection;
