import { pineconeIndex } from "@/lib/pinecone";

export async function POST(req: Request) {
  const { embedding, username } = await req.json();

  const result = await pineconeIndex.query({
    vector: embedding,
    topK: 5,
    includeMetadata: true,
    // filter: {
    //   username: { $eq: username }, // optional
    // },
  });

  return Response.json(result.matches);
}
