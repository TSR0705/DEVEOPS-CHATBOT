import { NextRequest } from "next/server";

export async function GET(_request: NextRequest) {
  return Response.json({ message: "Test API is working", timestamp: Date.now() });
}

export async function POST(_request: NextRequest) {
  return Response.json({ message: "Test POST is working", timestamp: Date.now() });
}