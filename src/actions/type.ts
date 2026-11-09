import { z } from "zod";

export const courseSchema = z.object({
  title: z.string().min(1, "Nama mata kuliah wajib diisi."),
  credits: z.number().int().min(1).max(10),
  pageCount: z.number().int().min(1),
  examDate: z.string().min(1, "Tanggal ujian wajib diisi."),
  color: z.string(),
  milestone1: z.number().int().min(1, "Milestone 1 wajib diisi."),
  milestone2: z.number().int().min(1, "Milestone 2 wajib diisi."),
  milestone3: z.number().int().min(1, "Milestone 3 wajib diisi."),
  readPages: z.number().int().min(0).optional().default(0),
});
