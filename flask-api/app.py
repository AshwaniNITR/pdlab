from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import requests
from mtcnn import MTCNN

app = Flask(__name__)
CORS(app)

CONFIDENCE_THRESHOLD = 0.90
VERIFY_ENDPOINT = "http://localhost:3000/api/verify"

detector = MTCNN()


@app.route("/detect-and-verify", methods=["POST"])
def detect_and_verify():
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files["image"]
    image_bytes = file.read()

    # Decode image
    np_img = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

    if img is None:
        return jsonify({"error": "Invalid image"}), 400

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = detector.detect_faces(img_rgb)

    responses = []

    for face in results:
        x, y, w, h = face["box"]
        confidence = face["confidence"]

        if confidence < CONFIDENCE_THRESHOLD:
            continue

        x, y = max(0, x), max(0, y)
        crop = img[y:y+h, x:x+w]

        if crop.size == 0:
            continue

        success, buffer = cv2.imencode(".jpg", crop)
        if not success:
            continue

        files = {
            "image": ("face.jpg", buffer.tobytes(), "image/jpeg")
        }

        try:
            res = requests.post(
                VERIFY_ENDPOINT,
                files=files,
                timeout=10
            )

            verification_result = res.json() if res.ok else res.text

        except Exception as e:
            verification_result = {"error": str(e)}

        responses.append({
            "box": {
                "x": int(x),
                "y": int(y),
                "width": int(w),
                "height": int(h)
            },
            "detection_confidence": float(confidence),
            "verification": verification_result
        })

    return jsonify({
        "faces_detected": len(responses),
        "results": responses
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
