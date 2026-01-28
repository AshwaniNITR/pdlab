import { pineconeIndex } from "@/lib/pinecone";
import { v4 as uuidv4 } from "uuid";

/* 🔥 Replace this with your actual FaceNet call */
async function getFaceEmbedding(imageUrl: string): Promise<number[]> {
  // 1️⃣ Download image as ArrayBuffer
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error("Failed to fetch image");
  const imageBuffer = await imgRes.arrayBuffer();

  // 2️⃣ Create FormData
  const formData = new FormData();
  formData.append("image", new Blob([imageBuffer], { type: "image/jpeg" }), "face.jpg");

  // 3️⃣ Send to Flask
  const res = await fetch("https://0dbca314f320.ngrok-free.app/get_embeddings", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FaceNet error: ${text}`);
  }

  const data = await res.json();
  return data.embedding_vector; // ✅ number[]
}

export async function POST(req: Request) {
  const {
    username,
    age,
    height,
    description,
    lastSeenLocation,
    imageUrl,
  } = await req.json();

  const embedding = await getFaceEmbedding(imageUrl);

  await pineconeIndex.upsert([
    {
      id: uuidv4(),
      values: embedding,
      metadata: {
        username,
        age,
        height,
        description,
        lastSeenLocation,
        imageUrl,
      },
    },
  ]);

  return Response.json({ success: true });
}
