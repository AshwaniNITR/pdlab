import { NextResponse } from "next/server";
import { pineconeIndex } from "@/lib/pinecone";

const EMBEDDING_API = "https://fcb51d7ec299.ngrok-free.app/get_embeddings";
const SIMILARITY_THRESHOLD = 0.3; // 🔥 tune this

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get("image");

    if (!image || !(image instanceof Blob)) {
      return NextResponse.json(
        { error: "Image is required" },
        { status: 400 }
      );
    }

    // 1️⃣ Send image to Flask to get embedding
    const embedForm = new FormData();
    embedForm.append("image", image, "face.jpg");

    const embedRes = await fetch(EMBEDDING_API, {
      method: "POST",
      body: embedForm,
    });

    if (!embedRes.ok) {
      const err = await embedRes.text();
      throw new Error(`Embedding API failed: ${err}`);
    }

    const { embedding_vector } = await embedRes.json();

    if (!Array.isArray(embedding_vector)) {
      throw new Error("Invalid embedding returned");
    }

    // 2️⃣ Vector search in Pinecone
    const queryResponse = await pineconeIndex.query({
      vector: embedding_vector,
      topK: 1,
    });

    if (!queryResponse.matches || queryResponse.matches.length === 0) {
      return NextResponse.json({
        match: false,
        confidence: 0,
      });
    }

    const bestMatch = queryResponse.matches[0];
    const confidence = bestMatch.score ?? 0;

    const isMatch = confidence >= SIMILARITY_THRESHOLD;

    return NextResponse.json({
      match: isMatch,
      confidence,
      metadata: isMatch ? bestMatch.metadata : null,
    });

  } catch (err: any) {
    console.error("Verify error:", err);
    return NextResponse.json(
      { error: err.message || "Verification failed" },
      { status: 500 }
    );
  }
}
