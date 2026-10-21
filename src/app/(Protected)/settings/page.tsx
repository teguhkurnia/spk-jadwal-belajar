"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { PreferenceSettingsCard } from "./preference-card";
import { DangerZoneCard } from "./danger-zone-card";
import {
  SpinnerIcon,
  CheckCircleIcon,
  WarningIcon,
} from "@phosphor-icons/react";

interface NotificationState {
  type: "success" | "warning" | "error";
  text: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [endingSemester, setEndingSemester] = React.useState(false);
  const [semester, setSemester] = React.useState<any>(null);
  const [notice, setNotice] = React.useState<NotificationState | null>(null);

  React.useEffect(() => {
    fetchSemesterData();
  }, []);

  const fetchSemesterData = async () => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data } = await supabase
      .from("semesters")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!data) {
      router.replace("/onboarding");
      return;
    }

    setSemester(data);
    setLoading(false);
  };

  const handleSavePreferences = async (
    max_study_pages: number,
    days_of_week: string[],
  ) => {
    setSaving(true);
    setNotice(null);

    try {
      const res = await fetch("/api/settings/update-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          max_study_pages,
          days_of_week,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal menyimpan preferensi jadwal.");
      }

      if (data.has_overload_risk) {
        setNotice({
          type: "warning",
          text:
            data.warning ||
            "Pengaturan disimpan, tetapi kapasitas/hari luang Anda terlalu sedikit untuk mengejar deadline ujian. Pertimbangkan untuk menambahkannya lagi.",
        });
      } else {
        setNotice({
          type: "success",
          text: "Pengaturan berhasil disimpan dan jadwal masa depan telah dihitung ulang!",
        });
      }

      router.refresh();
    } catch (err: any) {
      setNotice({
        type: "error",
        text: err.message || "Terjadi kesalahan saat menyimpan pengaturan.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEndSemester = async () => {
    setEndingSemester(true);
    setNotice(null);

    try {
      const res = await fetch("/api/settings/new-semester", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal mengakhiri semester.");
      }

      router.replace("/onboarding");
    } catch (err: any) {
      setNotice({
        type: "error",
        text: err.message || "Gagal mengakhiri semester.",
      });
      setEndingSemester(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <SpinnerIcon className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Jadwal</h1>
        <p className="text-sm text-muted-foreground">
          Sesuaikan kecepatan belajar harian, hari aktif, serta manajemen
          semester aktif Anda.
        </p>
      </div>

      {notice && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 text-sm border ${
            notice.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-900"
              : notice.type === "warning"
                ? "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-900"
                : "bg-destructive/10 text-destructive border-destructive/20"
          }`}
        >
          {notice.type === "success" && (
            <CheckCircleIcon className="size-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          )}
          {notice.type === "warning" && (
            <WarningIcon className="size-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          )}
          {notice.type === "error" && (
            <WarningIcon className="size-5 shrink-0 mt-0.5 text-destructive" />
          )}
          <div className="flex-1">{notice.text}</div>
        </div>
      )}

      {/* Card 1: Pengaturan Kecepatan & Waktu Belajar */}
      <PreferenceSettingsCard
        semesterName={semester?.name}
        initialPages={semester?.max_study_pages ?? 40}
        initialDays={
          semester?.days_of_week ?? [
            "Senin",
            "Selasa",
            "Rabu",
            "Kamis",
            "Jumat",
          ]
        }
        onSave={handleSavePreferences}
        saving={saving}
      />

      {/* Card 2: Danger Zone */}
      <DangerZoneCard
        semesterName={semester?.name}
        onEndSemester={handleEndSemester}
        loading={endingSemester}
      />
    </div>
  );
}
