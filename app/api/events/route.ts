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
      // Skip the image file as we've already extracted it
      if (key === "image") return;

      // Handle array fields (agenda, tags)
      if (key === "agenda" || key === "tags") {
        if (!eventData[key]) {
          eventData[key] = [];
        }
        (eventData[key] as unknown[]).push(value.toString());
      } else {
        eventData[key] = value.toString();
      }
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

    const tags = JSON.parse(formData.get("tags") as string);
    const agenda = JSON.parse(formData.get("agenda") as string);

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

export async function GET() {
  try {
    await connectToDatabase();

    const events = await Event.find().sort({ createdAt: -1 });

    return NextResponse.json(
      { message: "Events fetched successfully", events },
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
