"use client";

import { EventCalendar } from "@/components/event-calendar";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TODAY } from "@/data";
import { ScheduleDayItem } from "@/lib/schedule";
import {
  EventClickInfo,
  EventDisplayInfo,
  EventSourceInput,
} from "@fullcalendar/react";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { cn } from "cn";
import { CheckCircle2Icon } from "lucide-react";
import { useState } from "react";

interface Props {
  initialEvents: EventSourceInput;
}

function renderEventContent(eventInfo: EventDisplayInfo) {
  if (eventInfo.event.extendedProps.type !== "study") {
    return (
      <div className="flex flex-col p-2.5">
        <p className="text-sm font-semibold">{eventInfo.event.title}</p>
      </div>
    );
  }

  const extendedProps = eventInfo.event
    .extendedProps as DailyScheduleWithRelations;
  return (
    <div className="flex flex-col p-2.5 gap-1">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{extendedProps.course.title}</p>
      </div>
      <p className="text-xs">Target: {extendedProps.target_pages} Halaman</p>
      <Badge variant="secondary" className="mt-1 w-fit text-xs">
        {extendedProps.milestone.title}
      </Badge>

      <div className="mt-2">
        {extendedProps.status === "completed" && (
          <Badge variant="default" className="mt-1 w-fit gap-1 text-xs">
            <CheckCircle2Icon className="size-8" />
            Selesai
          </Badge>
        )}

        {extendedProps.status === "overdue" && (
          <Badge variant="destructive" className="mt-1 w-fit gap-1 text-xs">
            <WarningCircleIcon className="size-8" />
            Terlambat
          </Badge>
        )}

        {extendedProps.is_overload && (
          <Badge
            variant="default"
            className={cn(
              "mt-1 w-fit gap-1 text-xs",
              "bg-yellow-500 text-black hover:bg-yellow-600 focus:ring-yellow-500",
            )}
          >
            <WarningCircleIcon className="size-8" />
            Overload
          </Badge>
        )}
      </div>
    </div>
  );
}

interface DetailSheetProps {
  selectedEvent: EventClickInfo | null;
  isSheetOpen: boolean;
  setIsSheetOpen: (open: boolean) => void;
}

const DetailSheet = ({
  selectedEvent,
  isSheetOpen,
  setIsSheetOpen,
}: DetailSheetProps) => {
  const extendedProps = (
    selectedEvent?.event.extendedProps.type == "study"
      ? selectedEvent?.event.extendedProps
      : null
  ) as ScheduleDayItem | null;

  return (
    <Sheet open={isSheetOpen} onOpenChange={(open) => setIsSheetOpen(open)}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Detail Kegiatan</SheetTitle>
        </SheetHeader>
        <Table>
          <TableBody>
            {[
              {
                title: "Judul",
                value: selectedEvent?.event.title || "-",
              },
              {
                title: "Tanggal",
                value:
                  selectedEvent?.event.start?.toISOString().split("T")[0] ||
                  "-",
              },
              {
                title: "Mata Kuliah",
                value: extendedProps?.course.title || "-",
              },
              {
                title: "Milestone",
                value: extendedProps?.milestone.title || "-",
              },
              {
                title: "Halaman",
                value: extendedProps
                  ? `${extendedProps.from_page} - ${extendedProps.to_page}`
                  : "-",
              },
            ].map((item, index) => (
              <TableRow key={index}>
                <TableHead>{item.title}</TableHead>
                <TableCell className="whitespace-pre-line">
                  {item.value}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Description */}
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            {selectedEvent?.event.extendedProps.description ||
              "Tidak ada deskripsi."}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default function CalendarContent({ initialEvents }: Props) {
  const [events, setEvents] = useState<EventSourceInput>(initialEvents);
  const [selectedEvent, setSelectedEvent] = useState<EventClickInfo | null>(
    null,
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const onEventClick = (eventInfo: EventClickInfo) => {
    const event = eventInfo.event;
    setSelectedEvent(eventInfo);
    setIsSheetOpen(true);
  };

  return (
    <div className="p-4 lg:p-6">
      <EventCalendar
        now={TODAY}
        showNonCurrentDates={false}
        availableViews={["dayGridMonth", "timeGridWeek", "listWeek"]}
        // addButton={{
        //   text: "Add Event",
        //   click() {
        //     alert("add event...");
        //   },
        // }}
        editable
        selectable
        events={events}
        eventClick={onEventClick}
        eventContent={renderEventContent}
        eventClass={(arg) => {
          if (arg.event.extendedProps.type === "study") {
            const extendedProps = arg.event
              .extendedProps as DailyScheduleWithRelations;

            // if (extendedProps.status === "completed") {
            //   return "bg-green-400 border border-green-400";
            // } else if (extendedProps.status === "overdue") {
            //   return "bg-red-100 border border-red-400 text-red-800";
            // }

            return extendedProps.is_overload ? "ring-2 ring-red-500!" : "";
          }
        }}
      />

      <DetailSheet
        selectedEvent={selectedEvent}
        isSheetOpen={isSheetOpen}
        setIsSheetOpen={setIsSheetOpen}
      />
    </div>
  );
}
