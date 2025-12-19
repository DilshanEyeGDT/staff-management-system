import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Chip,
  Box,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import axiosGo from "../../../axiosConfig/axiosGo";
import axiosAuth from "../../../axiosConfig/axiosConfig"; // Auth axios instance

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateEventDialog: React.FC<Props> = ({ open, onClose, onSuccess }) => {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

  const [attachments, setAttachments] = useState<File[]>([]); // store selected files
  const [userId, setUserId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  // Load logged-in user when dialog opens
  useEffect(() => {
    if (!open) return;

    axiosAuth
      .get("/me")
      .then((res) => {
        setUserId(res.data.id);
      })
      .catch(() => {
        setSnackbar({
          open: true,
          message: "Failed to load user info.",
          severity: "error",
        });
      });
  }, [open]);

  // Fetch tag suggestions
  useEffect(() => {
    if (tagInput.length < 1) {
      setTagSuggestions([]);
      return;
    }

    const fetchTags = async () => {
      try {
        const res = await axiosGo.get(`/tags?query=${tagInput}`);
        setTagSuggestions(res.data.suggestions || []);
      } catch (_) {
        setTagSuggestions([]);
      }
    };

    const delay = setTimeout(fetchTags, 300);
    return () => clearTimeout(delay);
  }, [tagInput]);

  // Add tag (only unique)
  const addTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput("");
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files)); // store files
    }
  };

  // Create event
  const handleCreate = async () => {
    if (!userId) {
      setSnackbar({
        open: true,
        message: "User not loaded.",
        severity: "error",
      });
      return;
    }

    if (!title.trim()) {
      setSnackbar({
        open: true,
        message: "Title is required.",
        severity: "error",
      });
      return;
    }

    setLoading(true);

    try {
      const body = {
        title,
        summary,
        content,
        attachments: attachments.map((file) => file.name), // only filenames
        created_by: userId,
        status: "draft",
        scheduled_at: new Date(scheduledAt).toISOString(),
        tags: [...tags],
      };

      await axiosGo.post("/events", body);

      setSnackbar({
        open: true,
        message: "Event created successfully!",
        severity: "success",
      });

      // Reset form
      setTitle("");
      setSummary("");
      setContent("");
      setScheduledAt("");
      setTags([]);
      setTagInput("");
      setAttachments([]);

      onSuccess();
      onClose();
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to create event.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        data-testid="create-event-dialog"
      >
        <DialogTitle data-testid="create-event-title">
          Create New Event
        </DialogTitle>

        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          data-testid="create-event-content"
        >
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            data-testid="create-event-title-input"
          />

          <TextField
            label="Summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            multiline
            fullWidth
            data-testid="create-event-summary-input"
          />

          <TextField
            label="Announcement Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            multiline
            fullWidth
            data-testid="create-event-content-input"
          />

          <TextField
            label="Scheduled At"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            data-testid="create-event-scheduled-at-input"
          />

          {/* Attachments */}
          <Box data-testid="create-event-attachments-section">
            <Button
              variant="outlined"
              component="label"
              data-testid="create-event-upload-button"
            >
              Upload Files
              <input
                type="file"
                multiple
                hidden
                onChange={handleFileChange}
                data-testid="create-event-file-input"
              />
            </Button>

            {/* Show selected file names */}
            {attachments.length > 0 && (
              <Box
                sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.5 }}
                data-testid="create-event-attachments-list"
              >
                {attachments.map((file, index) => (
                  <Chip
                    key={file.name}
                    label={file.name}
                    data-testid={`create-event-attachment-${index}`}
                  />
                ))}
              </Box>
            )}
          </Box>

          {/* TAG INPUT */}
          <Box data-testid="create-event-tags-section">
            <TextField
              label="Add Tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              fullWidth
              data-testid="create-event-tag-input"
              onKeyDown={(e) => {
                if (e.key === "Enter" && tagInput.trim() !== "") {
                  e.preventDefault();
                  addTag(tagInput.trim());
                }
              }}
            />

            {/* Suggestions */}
            {tagSuggestions.length > 0 && (
              <Box
                sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}
                data-testid="create-event-tag-suggestions"
              >
                {tagSuggestions.map((tag, index) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onClick={() => addTag(tag)}
                    variant="outlined"
                    sx={{ cursor: "pointer" }}
                    data-testid={`create-event-tag-suggestion-${index}`}
                  />
                ))}
              </Box>
            )}

            {/* Selected Tags */}
            <Box
              sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}
              data-testid="create-event-selected-tags"
            >
              {tags.map((t, index) => (
                <Chip
                  key={t}
                  label={t}
                  onDelete={() => setTags(tags.filter((x) => x !== t))}
                  data-testid={`create-event-selected-tag-${index}`}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions data-testid="create-event-actions">
          <Button
            onClick={onClose}
            data-testid="create-event-cancel-button"
          >
            Cancel
          </Button>

          <Button
            onClick={handleCreate}
            disabled={loading}
            variant="contained"
            data-testid="create-event-submit-button"
          >
            {loading ? (
              <CircularProgress
                size={22}
                data-testid="create-event-submit-loading"
              />
            ) : (
              "Create"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        data-testid="create-event-snackbar"
      >
        <Alert
          severity={snackbar.severity}
          data-testid="create-event-snackbar-alert"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );

};

export default CreateEventDialog;
