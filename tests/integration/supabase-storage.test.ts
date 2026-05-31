import { describe, expect, test } from "vitest";
import { buildPrivateStorageUrl } from "@/lib/supabase-storage";

describe("Supabase storage helpers", () => {
  test("membangun URL aplikasi untuk private upload", () => {
    expect(buildPrivateStorageUrl("certificate-001.pdf")).toBe("/api/storage/uploads/certificate-001.pdf");
  });

  test("meng-encode segment path dengan benar", () => {
    expect(buildPrivateStorageUrl("folder nama/file akhir.pdf")).toBe("/api/storage/uploads/folder%20nama/file%20akhir.pdf");
  });
});
