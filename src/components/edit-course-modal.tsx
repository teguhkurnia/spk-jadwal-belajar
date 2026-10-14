"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { milestone } from "@/lib/utils";

const COLOR_PRESETS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

interface EditCourseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course | null;
  onSuccess?: () => void;
}

export function EditCourseModal({
  open,
  onOpenChange,
  course,
  onSuccess,
}: EditCourseModalProps) {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [credits, setCredits] = React.useState(3);
  const [pageCount, setPageCount] = React.useState(100);
  const [examDate, setExamDate] = React.useState("");
  const [color, setColor] = React.useState("#3b82f6");
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (course) {
      setTitle(course.title);
      setCredits(course.credits);
      setPageCount(course.page_count);
      setExamDate(course.exam_date);
      setColor(course.color || "#3b82f6");
    }
  }, [course]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;
    setLoading(true);
    setErrorMsg(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("courses")
      .update({
        title,
        credits: Number(credits),
        page_count: Number(pageCount),
        exam_date: examDate,
        color,
        updated_at: new Date().toISOString(),
      })
      .eq("id", course.id);

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    onOpenChange(false);
    router.refresh();
    if (onSuccess) onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Mata Kuliah</DialogTitle>
          <DialogDescription>
            Ubah detail informasi mata kuliah yang dipilih.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errorMsg && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {errorMsg}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="edit-course-title">Nama Mata Kuliah</Label>
            <Input
              id="edit-course-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Pemrograman Berorientasi Objek"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-course-credits">SKS</Label>
              <Input
                id="edit-course-credits"
                type="number"
                min={1}
                max={6}
                value={credits}
                onChange={(e) => setCredits(Number(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-course-pages">Jumlah Halaman Modul</Label>
              <Input
                id="edit-course-pages"
                type="number"
                min={1}
                value={pageCount}
                onChange={(e) => setPageCount(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-course-exam">Tanggal Ujian (KTPU)</Label>
            <Input
              id="edit-course-exam"
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

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}