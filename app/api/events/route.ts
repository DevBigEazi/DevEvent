import { v2 as cloudinary } from "cloudinary";

import { Event } from "@/database";
import connectToDatabase from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const formData = await req.formData();

    // Get the image file first before processing other data
    const file = formData.get("image") as File;
    if (!file) {
      return NextResponse.json(
        { message: "Image upload is required" },
        { status: 400 },
      );
    }

    // Extract and process form data
    const eventData: Record<string, unknown> = {};

    formData.forEach((value, key) => {
      // Skip image (handled above) and agenda/tags (parsed explicitly below)
      if (key === "image" || key === "agenda" || key === "tags") return;
      eventData[key] = value.toString();
    });

    // Normalize mode to match enum values
    if (eventData.mode) {
      const modeStr = eventData.mode.toString().toLowerCase();
      if (modeStr.includes("hybrid")) {
        eventData.mode = "hybrid";
      } else if (modeStr.includes("online")) {
        eventData.mode = "online";
      } else if (modeStr.includes("offline") || modeStr.includes("person")) {
        eventData.mode = "offline";
      }
    }

    let tags: unknown;
    let agenda: unknown;

    try {
      const rawTags = formData.get("tags");
      if (!rawTags) {
        return NextResponse.json(
          { message: "Tags field is required" },
          { status: 400 },
        );
      }
      tags = JSON.parse(rawTags.toString());
      if (!Array.isArray(tags)) {
        return NextResponse.json(
          { message: "Tags must be a JSON array" },
          { status: 400 },
        );
      }
      const invalidTagIndex = tags.findIndex(
        (item: unknown) => typeof item !== "string",
      );
      if (invalidTagIndex !== -1) {
        return NextResponse.json(
          { message: `tags[${invalidTagIndex}] must be a string` },
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON for tags" },
        { status: 400 },
      );
    }

    try {
      const rawAgenda = formData.get("agenda");
      if (!rawAgenda) {
        return NextResponse.json(
          { message: "Agenda field is required" },
          { status: 400 },
        );
      }
      agenda = JSON.parse(rawAgenda.toString());
      if (!Array.isArray(agenda)) {
        return NextResponse.json(
          { message: "Agenda must be a JSON array" },
          { status: 400 },
        );
      }
      const invalidAgendaIndex = agenda.findIndex(
        (item: unknown) => typeof item !== "string",
      );
      if (invalidAgendaIndex !== -1) {
        return NextResponse.json(
          { message: `agenda[${invalidAgendaIndex}] must be a string` },
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON for agenda" },
        { status: 400 },
      );
    }

    // Upload image to Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: "image", folder: "DevEvent" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          },
        )
        .end(buffer);
    });

    eventData.image = (uploadResult as { secure_url: string }).secure_url;

    const createdEvent = await Event.create({ ...eventData, tags, agenda });

    return NextResponse.json(
      { message: "Event created successfully", event: createdEvent },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Event creation failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20),
    );
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      Event.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Event.countDocuments(),
    ]);

    return NextResponse.json(
      {
        message: "Events fetched successfully",
        events,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Events fetching failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
