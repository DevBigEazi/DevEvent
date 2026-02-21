import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Event, IEvent } from "@/database";

/**
 * GET /api/events/[slug]
 * Fetches a single event by its slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  try {
    // Extract and validate slug parameter
    const { slug } = await params;

    if (!slug || typeof slug !== "string" || slug.trim() === "") {
      return NextResponse.json(
        { error: "Invalid or missing slug parameter" },
        { status: 400 },
      );
    }

    // Connect to database
    await connectToDatabase();

    // Query event by slug
    const event: IEvent | null = await Event.findOne({ slug: slug.trim() })
      .lean()
      .exec();

    // Handle event not found
    if (!event) {
      return NextResponse.json(
        { error: `Event with slug "${slug}" not found` },
        { status: 404 },
      );
    }

    // Return event data
    return NextResponse.json({ success: true, event }, { status: 200 });
  } catch (error: unknown) {
    // Log error for debugging (in production, use proper logging service)
    console.error("Error fetching event by slug:", error);

    // Handle different error types
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: "Failed to fetch event",
          message: error.message,
        },
        { status: 500 },
      );
    }

    // Fallback for unknown error types
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
