import { NextResponse } from "next/server";

export const dynamic = "force-static";

export function GET() {
  return new NextResponse(
    [
      "Contact: mailto:security@adorabbc.com",
      "Preferred-Languages: id, en",
      "Canonical: https://adorabbc.com/.well-known/security.txt",
      "Policy: https://adorabbc.com",
      "",
    ].join("\n"),
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
}
