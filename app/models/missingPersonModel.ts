import mongoose, { Schema, Document, Model } from "mongoose";

// ─── TypeScript Interface ───────────────────────────────────────────────────

export interface IMissingPerson extends Document {
  username: string;
  age: number;
  height?: number;
  description?: string;
  lastSeenLocation?: string;
  imageUrl: string;
  embeddingVector: number[];   // 512-dim FaceNet embedding (L2-normalised)
  enrolledAt: Date;
  updatedAt: Date;
}

// ─── Schema ────────────────────────────────────────────────────────────────

const MissingPersonSchema = new Schema<IMissingPerson>(
  {
    // Basic info
    username: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },

    age: {
      type: Number,
      required: [true, "Age is required"],
      min: [0, "Age must be a positive number"],
      max: [120, "Age must be realistic"],
    },

    height: {
      type: Number,
      min: [0, "Height must be a positive number"],
      max: [250, "Height must be realistic (cm)"],
    },

    description: {
      type: String,
      trim: true,
    },

    lastSeenLocation: {
      type: String,
      trim: true,
    },

    // Cloudinary (or any CDN) public URL of the uploaded photo
    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
    },

    // 512-dimensional FaceNet embedding returned by /get_embeddings
    // Stored as a flat array of Numbers for easy cosine-similarity queries
    embeddingVector: {
      type: [Number],
      required: [true, "Face embedding is required"],
      validate: {
        validator: (v: number[]) => v.length === 512,
        message: "FaceNet embedding must have exactly 512 dimensions",
      },
    },
  },
  {
    // Mongoose adds `createdAt` (= enrolledAt) and `updatedAt` automatically
    timestamps: { createdAt: "enrolledAt", updatedAt: "updatedAt" },
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────

// Fast lookups by name or location
MissingPersonSchema.index({ username: 1 });
MissingPersonSchema.index({ lastSeenLocation: 1 });
MissingPersonSchema.index({ enrolledAt: -1 });   // latest enrollments first

// ─── Model ────────────────────────────────────────────────────────────────

const MissingPerson: Model<IMissingPerson> =
  mongoose.models.MissingPerson ||
  mongoose.model<IMissingPerson>("MissingPerson", MissingPersonSchema);

export default MissingPerson;