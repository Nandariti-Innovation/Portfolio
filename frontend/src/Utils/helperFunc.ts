export function dateLocalStringFormat(givenDate: Date) {
  return new Date(givenDate).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function CheckImageFileType(filetype: string) {
  const ext = filetype.split("/").pop() || "undefined";
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];

  return imageExtensions.includes(ext.toLowerCase());
}

export function YearsOfExperience() {
  const startDate: Date = new Date("2022-08-01");
  const currentDate: Date = new Date();

  const diffInMilliseconds: number =
    currentDate.getTime() - startDate.getTime();
  const diffInYears: number =
    diffInMilliseconds / (1000 * 60 * 60 * 24 * 365.25); // accounting for leap years

  return Math.round(diffInYears);
}

export function formatSQLDate(sqlDate: string | Date | false) {
  if (!sqlDate) return false;
  const date = new Date(sqlDate); // convert SQL date string to Date
  return date.toLocaleString("en-US", { month: "short", year: "numeric" });
}

export function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // months are 0-based
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function calculateDaysBetween(
  startDate: string | Date,
  endDate: string | Date
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Normalize to midnight to avoid time-zone related issues
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  // Difference in milliseconds
  const diffTime = end.getTime() - start.getTime();

  // Convert to days
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Ensure at least 1 day if same date
  return diffDays >= 0 ? diffDays + 1 : 0;
}
