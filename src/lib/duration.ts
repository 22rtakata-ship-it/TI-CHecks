/** Stored durations remain in minutes; presentation uses hours and minutes. */
export function formatDuration(totalMinutes: number): string {
  const minutes = Number.isFinite(totalMinutes)
    ? Math.max(0, Math.round(totalMinutes))
    : 0;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours} h${remainder ? ` ${remainder} min` : ""}`;
}
