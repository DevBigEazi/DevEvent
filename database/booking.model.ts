import mongoose, { Document, Model, Schema } from "mongoose";
import Event from "./event.model";

// TypeScript interface for Booking document
export interface IBooking extends Document {
  eventId: mongoose.Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event ID is required"],
      index: true, // Index for faster queries
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  }
);

// Pre-save hook: Verify that the referenced event exists
BookingSchema.pre("save", async function () {
  // Only validate eventId if it's modified or document is new
  if (this.isModified("eventId")) {
    try {
      const eventExists = await Event.findById(this.eventId);
      if (!eventExists) {
        throw new Error(`Event with ID ${this.eventId} does not exist`);
      }
    } catch (error) {
      throw new Error(`Failed to validate event: ${(error as Error).message}`);
    }
  }
});

// Prevent model recompilation in development (Next.js hot reload)
const Booking: Model<IBooking> =
  mongoose.models.Booking ||
  mongoose.model<IBooking>("Booking", BookingSchema);

export default Booking;
