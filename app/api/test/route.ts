import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return Response.json({ message: "Test API is working", timestamp: Date.now() });
}

export async function POST(request: NextRequest) {
  return Response.json({ message: "Test POST is working", timestamp: Date.now() });
}