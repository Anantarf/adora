import { describe, expect, test } from "vitest";
import { isValidDocumentUrl, normalizeDocumentUrl } from "@/lib/private-upload";
import { getClientIp, getClientIpFromHeaderMap } from "@/lib/client-ip";
import { NextRequest } from "next/server";

describe("Security Validations", () => {
  describe("Document URL Validation", () => {
    test("menerima URL internal storage yang valid", () => {
      expect(isValidDocumentUrl("/api/storage/uploads/sertifikat-001.pdf")).toBe(true);
      expect(
        normalizeDocumentUrl("/api/storage/uploads/sertifikat-001.pdf", "Sertifikat"),
      ).toBe("/api/storage/uploads/sertifikat-001.pdf");
    });

    test("menerima URL HTTPS yang valid", () => {
      expect(isValidDocumentUrl("https://example.com/docs/rapor.pdf")).toBe(true);
      expect(
        normalizeDocumentUrl("https://example.com/docs/rapor.pdf", "Rapor"),
      ).toBe("https://example.com/docs/rapor.pdf");
    });

    test("menolak skema berbahaya atau tidak aman", () => {
      expect(isValidDocumentUrl("javascript:alert(1)")).toBe(false);
      expect(isValidDocumentUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
      expect(isValidDocumentUrl("http://insecure-domain.com/doc.pdf")).toBe(false);
      expect(isValidDocumentUrl("http://evil.test/api/storage/uploads/sertifikat-001.pdf")).toBe(false);
      expect(isValidDocumentUrl("//phishing.com/doc.pdf")).toBe(false);
      expect(isValidDocumentUrl("//evil.test/api/storage/uploads/sertifikat-001.pdf")).toBe(false);
      expect(isValidDocumentUrl("/api/storage/uploads/sertifikat-001.pdf?download=1")).toBe(false);
      expect(isValidDocumentUrl("/api/storage/uploads/sertifikat-001.pdf#fragment")).toBe(false);
      expect(isValidDocumentUrl("file:///C:/secret.txt")).toBe(false);
      expect(isValidDocumentUrl("   ")).toBe(false);

      expect(() => normalizeDocumentUrl("javascript:alert(1)", "Sertifikat")).toThrow(
        "Sertifikat tidak valid",
      );
      expect(() => normalizeDocumentUrl("http://insecure.com/doc.pdf", "Rapor")).toThrow(
        "Rapor tidak valid",
      );
    });
  });

  describe("Client IP Extraction", () => {
    test("menggunakan req.ip jika tersedia dari runtime", () => {
      const req = new NextRequest("http://localhost/api/upload");
      Object.defineProperty(req, "ip", { value: "203.0.113.195" });
      expect(getClientIp(req)).toBe("203.0.113.195");
    });

    test("mengutamakan header platform terpercaya (x-vercel-forwarded-for, cf-connecting-ip, x-real-ip)", () => {
      const req = new NextRequest("http://localhost/api/upload", {
        headers: {
          "x-vercel-forwarded-for": "198.51.100.1, 10.0.0.1",
          "x-forwarded-for": "1.1.1.1",
        },
      });
      expect(getClientIp(req)).toBe("198.51.100.1");

      const reqCf = new NextRequest("http://localhost/api/upload", {
        headers: {
          "cf-connecting-ip": "198.51.100.2",
          "x-forwarded-for": "1.1.1.1",
        },
      });
      expect(getClientIp(reqCf)).toBe("198.51.100.2");

      const reqReal = new NextRequest("http://localhost/api/upload", {
        headers: {
          "x-real-ip": "198.51.100.3",
        },
      });
      expect(getClientIp(reqReal)).toBe("198.51.100.3");
    });

    test("mengambil IP paling kanan (appended by proxy) dari x-forwarded-for jika tidak ada header khusus platform", () => {
      const req = new NextRequest("http://localhost/api/upload", {
        headers: {
          "x-forwarded-for": "spoofed-ip, 203.0.113.4",
        },
      });
      expect(getClientIp(req)).toBe("203.0.113.4");
    });

    test("mendukung header map NextAuth credentials", () => {
      expect(
        getClientIpFromHeaderMap({
          "x-forwarded-for": "spoofed-ip, 203.0.113.5",
        }),
      ).toBe("203.0.113.5");
    });

    test("fallback ke 127.0.0.1 jika tidak ada IP yang dapat di-resolve", () => {
      const req = new NextRequest("http://localhost/api/upload");
      expect(getClientIp(req)).toBe("127.0.0.1");
    });
  });
});
