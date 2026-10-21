export { cn } from "cn";

export const milestone = (tutonDate: string, w: number): Date | null => {
  if (!tutonDate) return null;
  const d = new Date(tutonDate);
  if (isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + w * 7);
  return d;
};

export const formatDate = (d: Date) => {
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const getCurrentDay = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};
