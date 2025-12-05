import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import axiosNet from "../../../axiosConfig/axiosNet";
import CreateTaskButton from "./CreateTaskButton";
import EditTaskDialog from "./EditTaskDialog";

interface User {
  id: number;
  displayName: string;
}

interface Task {
  taskId: string;
  title: string;
  description: string;
  priority: number;
  status: string;
  dueAt: string;
  createdByUserId: number;
  assigneeUserId: number;
  notesCount: number;
}

const statuses = ["open", "inprogress", "done", "cancelled"];

const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<number | "">("");

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const fetchTasks = async (assigneeId?: number) => {
    try {
      const res = await axiosNet.get(`/v1/tasks`, {
        params: assigneeId ? { assignee: assigneeId } : {},
      });
      setTasks(res.data.tasks);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axiosNet.get(`/v1/users`);
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTasks(); // load all tasks initially
  }, []);

  const handleAssigneeChange = (id: number | "") => {
    setSelectedAssignee(id);
    fetchTasks(id === "" ? undefined : Number(id));
  };

  const tasksByStatus = (status: string) =>
    tasks.filter((t) => t.status.toLowerCase() === status.toLowerCase());

  return (
  <Box p={3} id="tasks-container">
    {/* Assignee Filter */}
    <Box mb={3} width={250} id="assignee-filter-box">
      <FormControl fullWidth>
        <InputLabel id="assignee-filter-label">Filter by Assignee</InputLabel>
        <Select
          id="assignee-filter-select"
          value={selectedAssignee}
          label="Filter by Assignee"
          onChange={(e) => handleAssigneeChange(e.target.value as any)}
        >
          <MenuItem id="assignee-filter-all" value="">
            All
          </MenuItem>
          {users.map((u) => (
            <MenuItem key={u.id} value={u.id} id={`assignee-filter-${u.id}`}>
              {u.displayName}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>

    {/* ===== Kanban Layout Using Flexbox ===== */}
    <Box
      display="flex"
      gap={2}
      alignItems="flex-start"
      sx={{ overflowX: "auto" }}
      id="kanban-board"
    >
      {statuses.map((status) => (
        <Box
          key={status}
          flex="1 1 0"
          minWidth="250px"
          bgcolor="#f5f5f5"
          p={2}
          borderRadius={2}
          id={`status-column-${status}`}
        >
          <Typography
            variant="h6"
            sx={{ textTransform: "capitalize", mb: 2 }}
            id={`status-title-${status}`}
          >
            {status}
          </Typography>

          {/* If empty */}
          {tasksByStatus(status).length === 0 && (
            <Typography variant="body2" color="gray" id={`status-empty-${status}`}>
              No tasks
            </Typography>
          )}

          {/* Task Cards */}
          {tasksByStatus(status).map((task) => (
            <Card
              key={task.taskId}
              sx={{
                mb: 2,
                cursor: "pointer",
                ":hover": { boxShadow: 4, bgcolor: "#fafafa" },
              }}
              onClick={() => {
                setSelectedTask(task);
                setEditOpen(true);
              }}
              id={`task-card-${task.taskId}`}
            >
              <CardContent>
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  id={`task-title-${task.taskId}`}
                >
                  {task.title}
                </Typography>

                <Typography
                  variant="body2"
                  color="gray"
                  id={`task-description-${task.taskId}`}
                >
                  {task.description}
                </Typography>

                <Typography
                  variant="caption"
                  color="primary"
                  id={`task-due-${task.taskId}`}
                >
                  Due: {new Date(task.dueAt).toLocaleString()}
                </Typography>

                <Typography
                  variant="caption"
                  sx={{ display: "block", mt: 0.5 }}
                  id={`task-notes-${task.taskId}`}
                >
                  Notes: {task.notesCount}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      ))}
    </Box>

    <CreateTaskButton onTaskCreated={fetchTasks} />

    <EditTaskDialog
      task={selectedTask}
      open={editOpen}
      onClose={() => setEditOpen(false)}
      onUpdated={fetchTasks}
    />
  </Box>
);

};

export default TasksPage;
