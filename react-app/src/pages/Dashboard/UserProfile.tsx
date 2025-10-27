import { useEffect, useState } from "react";
import axios from "../../axiosConfig";
import { useParams } from "react-router-dom";

interface AuditLog {
  id: number;
  eventType: string;
  eventDesc: string;
  createdAt: string;
}

interface UserProfileData {
  id: number;
  email: string;
  displayName: string;
  roles: string[];
  auditLogs: AuditLog[];
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<UserProfileData | null>(null);

  useEffect(() => {
    if (!userId) return;

    axios
      .get(`/admin/users/${userId}`)
      .then((res) => setUser(res.data))
      .catch((err) => console.error(err));
  }, [userId]);

  if (!userId) return <div>No user selected</div>;

  return (
    <div>
      <h2>User Profile</h2>
      {user ? (
        <>
          <p>Email: {user.email}</p>
          <p>Display Name: {user.displayName}</p>
          <p>Roles: {user.roles.join(", ")}</p>

          <h3>Audit Logs</h3>
          <ul>
            {user.auditLogs.map((log) => (
              <li key={log.id}>
                {log.eventType} - {log.eventDesc} (
                {new Date(log.createdAt).toLocaleString()})
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>Loading user...</p>
      )}
    </div>
  );
};

export default UserProfile;
