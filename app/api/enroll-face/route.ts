// app/api/enroll-face/route.ts  (Next.js App Router)
// ─────────────────────────────────────────────────────────
// POST  /api/enroll-face
// Body (JSON):
//   { username, age, height?, description?, lastSeenLocation?, imageUrl }
//
// Flow:
//   1. Download the image from Cloudinary (imageUrl)
//   2. Forward it to the Flask /get_embeddings endpoint
//   3. Save the full record + embedding in MongoDB
// ─────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import MissingPerson from "@/app/models/missingPersonModel";

// ── DB connection helper (reuse across hot-reloads in dev) ──────────────────
const MONGODB_URI = process.env.MongoURL as string;
const FLASK_URL   = "https://embed-fgd9ebbseydrb9fc.canadacentral-01.azurewebsites.net";

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
}

// ── Route handler ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, age, height, description, lastSeenLocation, imageUrl } = body;

    // ── Validate required fields ──────────────────────────────────────────
    if (!username || age === undefined || !imageUrl) {
      return NextResponse.json(
        { error: "username, age, and imageUrl are required" },
        { status: 400 }
      );
    }

    // ── 1. Fetch image bytes from Cloudinary ──────────────────────────────
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      return NextResponse.json({ error: "Failed to fetch image from URL" }, { status: 400 });
    }
    const imgBuffer = await imgRes.arrayBuffer();

    // ── 2. Get face embedding from Flask ──────────────────────────────────
    const formData = new FormData();
    formData.append(
      "image",
      new Blob([imgBuffer], { type: "image/jpeg" }),
      "face.jpg"
    );

    const flaskRes = await fetch(`${FLASK_URL}/get_embeddings`, {
      method: "POST",
      body: formData,
    });

    if (!flaskRes.ok) {
      const err = await flaskRes.json();
      return NextResponse.json(
        { error: err.error ?? "Embedding generation failed" },
        { status: 422 }
      );
    }

    const { embedding_vector } = await flaskRes.json();

    // ── 3. Save to MongoDB ────────────────────────────────────────────────
    await connectDB();

    const person = await MissingPerson.create({
      username,
      age: Number(age),
      height: height ? Number(height) : undefined,
      description,
      lastSeenLocation,
      imageUrl,
      embeddingVector: embedding_vector,   // 512-dim array from FaceNet
    });

    return NextResponse.json(
      { message: "Person enrolled successfully", id: person._id },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("[enroll-face]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}