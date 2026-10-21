"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  PlusIcon,
  DotsThreeIcon,
  PencilIcon,
  TrashIcon,
  BookOpenIcon,
} from "@phosphor-icons/react";
import { CalendarIcon } from "lucide-react";
import { deleteCourse } from "@/actions/course";
import { AddCourseModal } from "@/components/add-course-modal";
import { EditCourseModal } from "@/components/edit-course-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function CoursesClient({
  initialCourses,
}: {
  initialCourses: Course[];
}) {
  const router = useRouter();
  const [courses, setCourses] = React.useState<Course[]>(initialCourses);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [selectedCourse, setSelectedCourse] = React.useState<Course | null>(
    null,
  );
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  const fetchCourses = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setCourses(data);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus mata kuliah ini?")) return;
    setLoadingId(id);
    const result = await deleteCourse(id);
    if (result.success) {
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } else if (result.error) {
      console.error(result.error);
    }
    setLoadingId(null);
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Manajemen Mata Kuliah
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola daftar mata kuliah, SKS, jumlah halaman modul, dan tanggal
            ujian KTPU Anda.
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2">
          <PlusIcon className="size-4" />
          <span>Tambah Mata Kuliah</span>
        </Button>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <BookOpenIcon className="size-6" />
          </div>
          <h3 className="text-lg font-semibold">Belum ada mata kuliah</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-6">
            Mulai dengan menambahkan mata kuliah pertama Anda untuk menyusun
            jadwal belajar SPK.
          </p>
          <Button onClick={() => setIsAddOpen(true)} className="gap-2">
            <PlusIcon className="size-4" />
            <span>Tambah Mata Kuliah</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => {
            const progress =
              course.page_count > 0
                ? Math.min(
                    100,
                    Math.round(
                      ((course.completed_pages || 0) / course.page_count) * 100,
                    ),
                  )
                : 0;

            return (
              <div
                key={course.id}
                className="group relative flex flex-col justify-between rounded-xl border bg-card p-6 shadow-xs transition-all hover:shadow-md"
              >
                <div className="absolute top-4 right-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon" className="size-8">
                          <DotsThreeIcon className="size-5" />
                          <span className="sr-only">Menu</span>
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedCourse(course);
                          setIsEditOpen(true);
                        }}
                        className="gap-2 cursor-pointer"
                      >
                        <PencilIcon className="size-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(course.id)}
                        className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                        disabled={loadingId === course.id}
                      >
                        <TrashIcon className="size-4" />
                        <span>Hapus</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="size-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: course.color || "#3b82f6" }}
                    />
                    <h3 className="font-semibold text-base leading-snug pr-8">
                      {course.title}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs font-medium">
                    <span className="inline-flex items-center rounded-md bg-secondary px-2.5 py-1 text-secondary-foreground">
                      {course.credits} SKS
                    </span>
                    <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-muted-foreground">
                      {course.page_count} Halaman Modul
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                    <CalendarIcon className="size-4 shrink-0" />
                    <span>
                      Ujian:{" "}
                      {new Date(course.exam_date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">
                      Progress Selesai
                    </span>
                    <span>
                      {progress}% ({course.completed_pages || 0}/
                      {course.page_count} hal)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: course.color || "#3b82f6",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddCourseModal
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) fetchCourses();
        }}
      />

      <EditCourseModal
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setSelectedCourse(null);
            fetchCourses();
          }
        }}
        course={selectedCourse}
      />
    </div>
  );
}
