import { useEffect, useState } from "react";
import axios from "../../axiosConfig";
import { Table, TableHead, TableRow, TableCell, TableBody, Button } from "@mui/material";
import { useNavigate } from "react-router-dom"; // <-- import navigate

interface User {
  id: number;
  username: string;
  email: string;
  displayName: string;
  roles: string[];
}

const UsersList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(0);
  const [size] = useState(10);

  const navigate = useNavigate(); // <-- hook to navigate

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`/admin/users?page=${page}&size=${size}&query=`);
      setUsers(res.data.content);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleRowClick = (userId: number) => {
    navigate(`/dashboard/users/${userId}`);     // navigate to dynamic route
  };

  return (
    <div>
      <h2>Users List View</h2>
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
          {users.map(user => (
            <TableRow
              key={user.id}
              hover
              style={{ cursor: "pointer" }}
              onClick={() => handleRowClick(user.id)} // <-- make row clickable
            >
              <TableCell>{user.id}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.displayName}</TableCell>
              <TableCell>{user.roles.join(", ")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button onClick={() => setPage(page + 1)}>Next Page</Button>
    </div>
  );
};

export default UsersList;
