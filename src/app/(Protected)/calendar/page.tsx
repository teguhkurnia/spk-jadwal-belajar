import { Suspense } from "react";
import CalendarContent from "./calendar-content";

export default function CalendarPage() {
  return (
    <Suspense fallback={<div className="p-6">Memuat kalendar...</div>}>
      <CalendarContent />
    </Suspense>
  );
}
