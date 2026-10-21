import { z } from "zod";

export const courseSchema = z.object({
  title: z.string().min(1, "Nama mata kuliah wajib diisi."),
  credits: z.number().int().min(1).max(10),
  pageCount: z.number().int().min(1),
  examDate: z.string().min(1, "Tanggal ujian wajib diisi."),
  color: z.string(),
  milestone1: z.number().int().min(0),
  milestone2: z.number().int().min(0),
  milestone3: z.number().int().min(0),
  readPages: z.number().int().min(0).optional().default(0),
});

