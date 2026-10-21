"use client";

import * as React from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  WarningCircleIcon,
  CheckCircleIcon,
  CalendarCheckIcon,
  BookOpenIcon,
  ArrowRightIcon,
  SmileyIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dayjs from "dayjs";
import { getCurrentDay } from "@/lib/utils";
import { Session } from "@supabase/supabase-js";

interface DashboardClientProps {
  initialSemester: any;
  user: Session["user"];
}

export function DashboardClient({
  initialSemester,
  user,
}: DashboardClientProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [completing, setCompleting] = React.useState(false);

  const [semester, setSemester] = React.useState(initialSemester);
  const [todaySchedule, setTodaySchedule] = React.useState<any>(null);
  const [hasCritical, setHasCritical] = React.useState(false);
  const [coursesProgress, setCoursesProgress] = React.useState<any[]>([]);
  const [nextThreeDays, setNextThreeDays] = React.useState<any[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      let activeSem = semester;
      if (!activeSem) {
        const { data: semData } = await supabase
          .from("semesters")
          .select("*")
          .eq("is_active", true)
          .single();
        activeSem = semData;
        setSemester(semData);
      }

      if (!activeSem) {
        setLoading(false);
        return;
      }

      const now = getCurrentDay();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const todayStr = `${year}-${month}-${day}`;

      const { data: todayData, error: todayError } = await supabase
        .from("daily_schedules")
        .select(
          `
          *,
          course:courses(*),
          milestone:milestones(*)
        `,
        )
        .eq("semester_id", activeSem.id)
        .eq("date", todayStr)
        .maybeSingle();

      if (!todayError) {
        setTodaySchedule(todayData);
      }

      const { data: criticalData } = await supabase
        .from("daily_schedules")
        .select("id")
        .eq("semester_id", activeSem.id)
        .gt("date", todayStr)
        .eq("status", "critical")
        .limit(1);

      setHasCritical(Boolean(criticalData && criticalData.length > 0));

      const { data: coursesData } = await supabase
        .from("courses")
        .select("*, milestones(*)")
        .eq("semester_id", activeSem.id);

      if (coursesData) {
        const mapped = coursesData.map((c: any) => {
          const activeMilestone =
            c.milestones?.find(
              (m: any) => m.status === "pending" || m.status === "critical",
            ) || c.milestones?.[0];

          const targetPages =
            activeMilestone?.target_pages || c.page_count || 100;
          const readedPages = activeMilestone?.readed_pages || 0;
          const progress =
            targetPages > 0
              ? Math.min(100, Math.round((readedPages / targetPages) * 100))
              : 0;

          return {
            ...c,
            activeMilestone,
            progress,
            readedPages,
            targetPages,
          };
        });
        setCoursesProgress(mapped);
      }

      const dateH1 = new Date(now);
      dateH1.setDate(now.getDate() + 1);
      const dateH3 = new Date(now);
      dateH3.setDate(now.getDate() + 3);

      const h1Str = dateH1.toISOString().split("T")[0];
      const h3Str = dateH3.toISOString().split("T")[0];

      const { data: timelineData } = await supabase
        .from("daily_schedules")
        .select(
          `
          *,
          course:courses(title, color)
        `,
        )
        .eq("semester_id", activeSem.id)
        .gte("date", h1Str)
        .lte("date", h3Str)
        .order("date", { ascending: true });

      if (timelineData) {
        setNextThreeDays(timelineData);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCompleteToday = async () => {
    if (!todaySchedule || completing) return;
    setCompleting(true);
    const supabase = createClient();

    try {
      const { error: scheduleError } = await supabase
        .from("daily_schedules")
        .update({ status: "completed" })
        .eq("id", todaySchedule.id);

      if (scheduleError) throw scheduleError;

      if (todaySchedule.milestone_id) {
        const currentMilestone = todaySchedule.milestone;
        const targetToAdd = todaySchedule.target_pages || 0;
        const newReadedPages =
          (currentMilestone?.readed_pages || 0) + targetToAdd;
        const milestoneTarget = currentMilestone?.target_pages || 100;
        const isCompleted = newReadedPages >= milestoneTarget;

        const { error: milestoneError } = await supabase
          .from("milestones")
          .update({
            readed_pages: newReadedPages,
            status: isCompleted ? "completed" : "pending",
            updated_at: new Date().toISOString(),
          })
          .eq("id", todaySchedule.milestone_id);

        if (milestoneError) throw milestoneError;
      }

      await fetchDashboardData();
      router.refresh();
    } catch (err: any) {
      alert("Gagal memperbarui status: " + err.message);
    } finally {
      setCompleting(false);
    }
  };

  if (loading && !semester) {
    return (
      <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full animate-pulse">
        <div className="h-8 w-64 bg-muted rounded-md" />
        <div className="h-40 bg-muted rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-32 bg-muted rounded-xl" />
          <div className="h-32 bg-muted rounded-xl" />
          <div className="h-32 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (!semester) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <BookOpenIcon className="size-8" />
        </div>
        <h2 className="text-xl font-bold">Belum Ada Semester Aktif</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Anda belum mengaktifkan semester atau belum melakukan onboarding.
          Silakan buat semester baru terlebih dahulu.
        </p>
        <Button render={<Link href="/onboarding" />}>Mulai Onboarding</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Halo, {user.user_metadata.full_name} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pusat kendali harian PJJ Anda. Fokus satu mata kuliah per hari untuk
            hasil optimal.
          </p>
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <span className="size-2 rounded-full bg-primary animate-pulse" />
            Semester Aktif: {semester.name}
          </span>
        </div>
      </div>

      {hasCritical && (
        <div className="flex items-start sm:items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
          <WarningCircleIcon className="size-6 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-0" />
          <div className="flex-1 text-sm">
            <span className="font-semibold">⚠️ Peringatan Kritis:</span>{" "}
            Beberapa jadwal belajar Anda di masa depan berstatus Kritis
            (melebihi kapasitas maksimal). Pertimbangkan untuk menambah hari
            belajar di Pengaturan.
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 border-amber-500/30 bg-background/50 hover:bg-amber-500/20 text-xs"
            render={<Link href="/settings" />}
          >
            Atur Pengaturan
          </Button>
        </div>
      )}
      {/* C. Hero Section: "Fokus Hari Ini" (1 Matkul 1 Hari) */}
      <div className="relative overflow-hidden rounded-2xl border bg-card p-6 md:p-8 shadow-sm transition-all">
        <div className="flex items-center justify-between pb-4 border-b mb-6">
          <div className="flex items-center gap-2 font-semibold text-sm text-primary uppercase tracking-wider">
            <CalendarCheckIcon className="size-5" />
            <span>
              Fokus Hari Ini (
              {dayjs(getCurrentDay()).format("dddd, DD MMMM YYYY")})
            </span>
          </div>
          {todaySchedule && (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                todaySchedule.status === "completed"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
              }`}
            >
              {todaySchedule.status === "completed"
                ? "Selesai Hari Ini"
                : "Sedang Berjalan"}
            </span>
          )}
        </div>

        {todaySchedule ? (
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {todaySchedule.course?.title || "Mata Kuliah PJJ"}
              </h2>
              <p className="text-base text-muted-foreground">
                Baca
                <span className="font-semibold text-primary">
                  {" "}
                  {todaySchedule.target_pages}{" "}
                </span>
                Halaman
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-stretch lg:items-center shrink-0">
              {todaySchedule.status === "completed" ? (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-5 py-3.5 text-emerald-600 dark:text-emerald-400 font-semibold text-sm border border-emerald-500/20 justify-center">
                  <CheckCircleIcon className="size-5 shrink-0" />
                  <span>Hari Ini Sudah Selesai! 🎉</span>
                </div>
              ) : (
                <Button
                  onClick={handleCompleteToday}
                  disabled={completing}
                  size="lg"
                  className="gap-2 font-semibold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground py-6 px-8 rounded-xl text-base"
                >
                  <CheckCircleIcon className="size-5" />
                  <span>
                    {completing ? "Menyimpan..." : "  Tandai Selesai"}
                  </span>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <SmileyIcon className="size-7" />
            </div>
            <h3 className="text-lg font-semibold">🎉 Bebas Tugas Hari Ini!</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Anda tidak memiliki jadwal belajar untuk hari ini. Silakan
              beristirahat atau nikmati waktu luang Anda.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* D. Progress Section: "Milestone Aktif" */}
        <div className="lg:col-span-2 rounded-2xl border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold tracking-tight">
                Milestone Aktif
              </h3>
              <Button
                render={
                  <Link href="/courses" className="gap-1">
                    <span>Lihat Semua</span>
                    <ArrowRightIcon className="size-3.5" />
                  </Link>
                }
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                nativeButton={false}
              />
            </div>

            {coursesProgress.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed rounded-xl p-6">
                <p className="text-sm text-muted-foreground mb-3">
                  Belum ada mata kuliah terdaftar di semester ini.
                </p>
                <Button
                  size="sm"
                  nativeButton={false}
                  render={<Link href="/courses" />}
                >
                  Tambah Mata Kuliah
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {coursesProgress.map((course) => (
                  <div
                    key={course.id}
                    className="space-y-2 p-3.5 rounded-xl border bg-muted/20"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2.5 font-medium">
                        <span
                          className="size-3 rounded-full shrink-0"
                          style={{ backgroundColor: course.color || "#3b82f6" }}
                        />
                        <span className="line-clamp-1">{course.title}</span>
                        {course.activeMilestone && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded font-normal">
                            {course.activeMilestone.title}
                          </span>
                        )}
                      </div>
                      <span className="font-semibold text-xs shrink-0">
                        {course.progress}% ({course.readedPages}/
                        {course.targetPages} hal)
                      </span>
                    </div>

                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${course.progress}%`,
                          backgroundColor: course.color || "#3b82f6",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* E. Mini Timeline: "Jadwal 3 Hari ke Depan" */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold tracking-tight">
                Jadwal 3 Hari ke Depan
              </h3>
              <Button
                render={<Link href="/calendar" className="gap-1" />}
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                nativeButton={false}
              >
                <span>Kalender</span>
                <ArrowRightIcon className="size-3.5" />
              </Button>
            </div>

            {nextThreeDays.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed rounded-xl p-6">
                <p className="text-xs text-muted-foreground">
                  Tidak ada jadwal dalam 3 hari ke depan.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {nextThreeDays.map((item: any, idx: number) => {
                  const dateFormatted = dayjs(item.date).format(
                    "ddd, DD MMM YYYY",
                  );

                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-xl border bg-muted/20 text-xs"
                    >
                      <div className="font-semibold px-2 py-1 rounded bg-muted text-muted-foreground shrink-0">
                        {dateFormatted}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{
                              backgroundColor: item.course?.color || "#3b82f6",
                            }}
                          />
                          <span className="line-clamp-1">
                            {item.course?.title || "Mata Kuliah"}
                          </span>
                        </div>
                        <div className="text-muted-foreground">
                          Target: {item.target_pages} Halaman
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
