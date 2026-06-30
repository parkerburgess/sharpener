import { NextResponse } from "next/server";

export function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

export function unprocessable(error: string) {
  return NextResponse.json({ error }, { status: 422 });
}

export function serverError(error: string) {
  return NextResponse.json({ error }, { status: 500 });
}
