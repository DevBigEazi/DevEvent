"use server";

import { unstable_cache } from "next/cache";
import { Event, SerializedEvent } from "@/database";
import connectToDatabase from "../mongodb";

export const getSimilarEventBySlug = unstable_cache(
  async (slug: string): Promise<SerializedEvent[]> => {
    try {
      await connectToDatabase();
      const event = await Event.findOne({ slug });
      if (!event) {
        return [];
      }
      const similarEvents = await Event.find({
        _id: { $ne: event._id },
        tags: { $in: event.tags },
      }).lean(); // $ne - not equal, in - include.

      // Serialize MongoDB documents for Client Components
      return similarEvents.map((event) => ({
        ...event,
        _id: event._id.toString(),
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
      }));
    } catch {
      return [];
    }
  },
  ["similar-events"],
  {
    revalidate: 3600, // Cache for 1 hour
    tags: ["events"],
  }
);
