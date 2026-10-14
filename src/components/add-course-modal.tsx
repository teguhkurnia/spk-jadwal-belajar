"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { milestone } from "@/lib/utils";

const COLOR_PRESETS = [
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
];

interface AddCourseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCourseModal({ open, onOpenChange }: AddCourseModalProps) {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [credits, setCredits] = React.useState(3);
  const [pageCount, setPageCount] = React.useState(100);
  const [examDate, setExamDate] = React.useState("");
  const [color, setColor] = React.useState("#3b82f6");
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [milestonePages, setMilestonePages] = React.useState({
    milestone1: 0,
    milestone2: 0,
    milestone3: 0,
  });

  const resetForm = () => {
    setTitle("");
    setCredits(3);
    setPageCount(100);
    setExamDate("");
    setColor("#3b82f6");
    setErrorMsg(null);
    setMilestonePages({
      milestone1: 0,
      milestone2: 0,
      milestone3: 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMsg("Anda belum terautentikasi.");
      setLoading(false);
      return;
    }

    const preferencesResult = await supabase
      .from("user_preferences")
      .select("max_study_pages, days_of_week, exam_date, tuton_date")
      .eq("user_id", user.id)
      .single();

    const tutonDate = preferencesResult.data?.tuton_date;

    const milestones = [
      {
        title: "Tuton 1",
        target_pages: milestonePages.milestone1,
        deadline: milestone(tutonDate, 3),
      },
      {
        title: "Tuton 2",
        target_pages: milestonePages.milestone2,
        deadline: milestone(tutonDate, 5),
      },
      {
        title: "Tuton 3",
        target_pages: milestonePages.milestone3,
        deadline: milestone(tutonDate, 7),
      },
    ].filter((m) => m.target_pages > 0); // Only include milestones with target pages

    const { error, data } = await supabase
      .from("courses")
      .insert({
        user_id: user.id,
        title,
        credits: Number(credits),
        page_count: Number(pageCount),
        exam_date: examDate,
        color,
      })
      .select("id");

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    // Insert milestones for the newly added course
    if (data && data.length > 0) {
      const courseId = data[0].id;
      const milestoneInsertData = milestones.map((m) => ({
        user_id: user.id,
        course_id: courseId,
        title: m.title,
        target_pages: m.target_pages,
        deadline: m.deadline,
      }));

      const { error: milestoneError } = await supabase
        .from("milestones")
        .insert(milestoneInsertData);

      if (milestoneError) {
        setErrorMsg(milestoneError.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    resetForm();
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val);
        if (!val) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Tambah Mata Kuliah Baru</DialogTitle>
            <DialogDescription>
              Isi rincian mata kuliah untuk dimasukkan ke jadwal belajar.
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">
              {errorMsg}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="course-title">Nama / Judul Mata Kuliah</Label>
            <Input
              id="course-title"
              placeholder="Contoh: Pemrograman Berbasis Web"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="course-credits">Jumlah SKS</Label>
              <Input
                id="course-credits"
                type="number"
                min={1}
                max={10}
                value={credits}
                onChange={(e) => setCredits(Number(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-pages">Jumlah Halaman Modul</Label>
              <Input
                id="course-pages"
                type="number"
                min={1}
                value={pageCount}
                onChange={(e) => setPageCount(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="course-exam">Tanggal Ujian (KTPU)</Label>
            <Input
              id="course-exam"
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Warna Label</Label>
            <div className="flex items-center gap-2 pt-1">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setColor(preset)}
                  className={`size-6 rounded-full transition-transform ${
                    color === preset
                      ? "scale-125 ring-2 ring-ring ring-offset-2"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: preset }}
                  aria-label={`Pilih warna ${preset}`}
                />
              ))}
            </div>
          </div>

          {/* Target Halaman dari setiap milestone */}
          <div className="space-y-2">
            <Label>Target Halaman per Milestone</Label>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Tuton 1</p>
                <Input
                  type="number"
                  min={1}
                  value={milestonePages.milestone1}
                  onChange={(e) =>
                    setMilestonePages({
                      ...milestonePages,
                      milestone1: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Tuton 2</p>
                <Input
                  type="number"
                  min={1}
                  value={milestonePages.milestone2}
                  onChange={(e) =>
                    setMilestonePages({
                      ...milestonePages,
                      milestone2: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Tuton 3</p>
                <Input
                  type="number"
                  min={1}
                  value={milestonePages.milestone3}
                  onChange={(e) =>
                    setMilestonePages({
                      ...milestonePages,
                      milestone3: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <DialogClose
              render={
                <Button type="button" variant="outline" disabled={loading}>
                  Batal
                </Button>
              }
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
