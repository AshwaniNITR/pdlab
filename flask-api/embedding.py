from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from PIL import Image
import io
from keras_facenet import FaceNet
from numpy.linalg import norm

# ================== CONFIG ==================
PORT = 5000
# ============================================

# -------------------- App --------------------
app = Flask(__name__)
CORS(app)

# -------------------- Load Model --------------------
print("🚀 Loading FaceNet model...")
embedder = FaceNet()
print("✅ Model loaded")

# -------------------- Helpers --------------------
def extract_face_embedding(img_bytes):
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    img_array = np.array(img)

    embeddings = embedder.embeddings([img_array])
    if len(embeddings) == 0:
        return None

    emb = embeddings[0]
    return emb / norm(emb)

def cosine_similarity(a, b):
    return np.dot(a, b) / (norm(a) * norm(b))

# -------------------- Routes --------------------
@app.route("/compare_faces", methods=["POST"])
def compare_faces():
    if "image1" not in request.files or "image2" not in request.files:
        return jsonify({"error": "Upload image1 and image2"}), 400

    emb1 = extract_face_embedding(request.files["image1"].read())
    emb2 = extract_face_embedding(request.files["image2"].read())

    if emb1 is None or emb2 is None:
        return jsonify({"error": "Face not detected"}), 400

    similarity = cosine_similarity(emb1, emb2)
    threshold = 0.40

    return jsonify({
        "similarity": float(similarity),
        "threshold": threshold,
        "result": "Same person" if similarity > threshold else "Different person"
    })

@app.route("/get_embeddings", methods=["POST"])
def get_embeddings():
    if "image" not in request.files:
        return jsonify({"error": "Upload image"}), 400

    emb = extract_face_embedding(request.files["image"].read())
    if emb is None:
        return jsonify({"error": "No face detected"}), 400

    return jsonify({
        "embedding_dim": len(emb),
        "embedding_vector": emb.tolist()
    })

# -------------------- Start Server --------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT)