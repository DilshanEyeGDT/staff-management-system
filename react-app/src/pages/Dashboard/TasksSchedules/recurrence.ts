// utils/recurrence.ts
export const formatRecurrence = (rrule: string): string => {
  if (!rrule) return "None";

  const parts = rrule.split(";");
  const freqPart = parts.find((p) => p.startsWith("FREQ="));
  const byDayPart = parts.find((p) => p.startsWith("BYDAY="));

  let freq = "";
  let byDay = "";

  if (freqPart) {
    switch (freqPart.split("=")[1]) {
      case "DAILY":
        freq = "Daily";
        break;
      case "WEEKLY":
        freq = "Weekly";
        break;
      case "MONTHLY":
        freq = "Monthly";
        break;
      case "YEARLY":
        freq = "Yearly";
        break;
      default:
        freq = freqPart.split("=")[1];
    }
  }

  if (byDayPart) {
    const daysMap: Record<string, string> = {
      MO: "Monday",
      TU: "Tuesday",
      WE: "Wednesday",
      TH: "Thursday",
      FR: "Friday",
      SA: "Saturday",
      SU: "Sunday",
    };
    byDay = byDayPart
      .split("=")[1]
      .split(",")
      .map((d) => daysMap[d] || d)
      .join(", ");
  }

  if (freq && byDay) return `${freq} on ${byDay}`;
  return freq || "Custom";
};
