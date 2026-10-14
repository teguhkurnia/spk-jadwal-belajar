"use client";

import { EventCalendar } from "@/components/event-calendar";
import { createClient } from "@/utils/supabase/client";
import { EventSourceInput } from "@fullcalendar/react";
import { useEffect, useState } from "react";

export default function CalendarContent() {
  const [events, setEvents] = useState<EventSourceInput>([]);

  // fetch preferences from supabase
  const fetchPreferences = async () => {
    try {
      const supabase = createClient();
      const session = await supabase.auth.getSession();
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", session.data.session?.user.id)
        .single();

      if (error) {
        console.error("Error fetching preferences:", error);
        return;
      }

      if (data) {
        // generate events based on preferences
        const tutonDate = new Date(data.tuton_date);
        const examDate = new Date(data.exam_date);

        const events: EventSourceInput = [
          {
            title: "Mulai Tuton",
            date: tutonDate.toISOString().split("T")[0],
          },
          {
            title: "Ujian",
            date: examDate.toISOString().split("T")[0],
          },
        ];

        [3, 5, 7].forEach((week, index) => {
          const milestoneDate = new Date(tutonDate);
          milestoneDate.setDate(tutonDate.getDate() + week * 7);
          events.push({
            title: `Tugas Tuton ${index + 1}`,
            date: milestoneDate.toISOString().split("T")[0],
            color: "#facc15", // yellow
          });
        });

        setEvents((prevEvents: any) => [...prevEvents, ...events]);
      }
    } catch (error) {}
  };

  const fetchSchedule = async () => {
    try {
      const res = await fetch("/api/generate-schedule");
      if (!res.ok) {
        console.error("Failed to fetch schedule:", res.statusText);
        return;
      }

      const scheduleData = await res.json();
      if (scheduleData.success && scheduleData.schedule) {
        const scheduleEvents = scheduleData.schedule.map((item: any) => ({
          title: `${item.course.title}: Hal ${item.from_page} - ${item.to_page} (${item.milestone?.title || "No Milestone"})`,
          date: item.date,
          color: item.course.color || "#3b82f6", // default blue if no color
        }));

        setEvents((prevEvents: any) => [...prevEvents, ...scheduleEvents]);
      } else {
        console.error("No schedule data found or success flag is false.");
      }
    } catch (error) {
      console.error("Error fetching schedule:", error);
    }
  };

  useEffect(() => {
    fetchPreferences();
    fetchSchedule();
  }, []);

  return (
    <div className="p-4 lg:p-6">
      <EventCalendar
        availableViews={["dayGridMonth", "timeGridWeek", "listWeek"]}
        addButton={{
          text: "Add Event",
          click() {
            alert("add event...");
          },
        }}
        editable
        selectable
        events={events}
      />
    </div>
  );
}
