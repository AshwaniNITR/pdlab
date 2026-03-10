import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import MissingPerson from "@/app/models/missingPersonModel";

// ── DB connection helper ───────────────────────────────────────────────
const MONGODB_URI = process.env.MongoURL as string;
const FLASK_URL   = "https://embed-fgd9ebbseydrb9fc.canadacentral-01.azurewebsites.net";

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
}

// ── cosine similarity (dot product because normalized) ─────────────────
function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

// ── Route handler ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "imageUrl is required" },
        { status: 400 }
      );
    }

    // ── 1. Fetch image bytes ───────────────────────────────────────────
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: 400 }
      );
    }

    const imgBuffer = await imgRes.arrayBuffer();

    // ── 2. Get embedding from Flask ────────────────────────────────────
    const formData = new FormData();
    formData.append(
      "image",
      new Blob([imgBuffer], { type: "image/jpeg" }),
      "face.jpg"
    );

    const flaskRes = await fetch(`${FLASK_URL}/get_embeddings`, {
      method: "POST",
      body: formData
    });

    if (!flaskRes.ok) {
      const err = await flaskRes.json();
      return NextResponse.json(
        { error: err.error ?? "Embedding generation failed" },
        { status: 422 }
      );
    }

    const { embedding_vector } = await flaskRes.json();

    if (!embedding_vector || embedding_vector.length !== 512) {
      return NextResponse.json(
        { error: "Invalid embedding received" },
        { status: 422 }
      );
    }

    // ── 3. Load persons from DB ────────────────────────────────────────
    await connectDB();

    const persons = await MissingPerson.find();

    let bestMatch = null;
    let bestScore = -1;

    for (const person of persons) {
      const score = cosineSimilarity(
        embedding_vector,
        person.embeddingVector
      );

      if (score > bestScore) {
        bestScore = score;
        bestMatch = person;
      }
    }

    const threshold = 0.40;

    if (!bestMatch || bestScore < threshold) {
      return NextResponse.json({
        result: "No match found",
        similarity: bestScore
      });
    }

    return NextResponse.json({
      result: "Match found",
      similarity: bestScore,
      person: {
        id: bestMatch._id,
        username: bestMatch.username,
        age: bestMatch.age,
        height: bestMatch.height,
        description: bestMatch.description,
        lastSeenLocation: bestMatch.lastSeenLocation,
        imageUrl: bestMatch.imageUrl
      }
    });

  } catch (err: unknown) {
    console.error("[identify-face]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}