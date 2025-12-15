// src/utils/eventModeration.ts
import axiosGo from "../../../axiosConfig/axiosGo";
import axiosAuth from "../../../axiosConfig/axiosConfig";

export const getCurrentUserId = async (): Promise<number> => {
  const res = await axiosAuth.get("/me");
  return res.data.id;
};

export const approveEvent = async (
  eventId: number,
  performedBy: number,
  channel: "push" | "email" = "push"
) => {
  const body = {
    action: "approved",
    performed_by: performedBy,
    channel,
  };
  return axiosGo.post(`/events/${eventId}/moderate`, body);
};

export const rejectEvent = async (eventId: number, performedBy: number) => {
  const body = {
    action: "rejected",
    performed_by: performedBy,
  };
  return axiosGo.post(`/events/${eventId}/moderate`, body);
};
