"use client";

import { useState, useRef, useCallback } from "react";

interface DetectionResult {
  faces_detected: number;
  results: {
    facesProcessed: number;
    matches: Array<{
      faceIndex: number;
      person: {
        age: number;
        description: string;
        height: number;
        id: string;
        imageUrl: string;
        lastSeenLocation: string;
        username: string;
      };
      similarity: number;
    }>;
    matchesFound: number;
  };
  message?: string;
}

export default function FaceDetectionPage() {
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }
    setFile(f);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, []);

  const handleDetect = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("http://localhost:5000/detect_faces", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Detection failed. Is the Flask server running?");
    } finally {
      setLoading(false);
    }
  };

  const formatSimilarity = (similarity: number) => {
    return `${Math.round(similarity * 100)}%`;
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        fontFamily: "'Courier New', monospace",
        color: "#e8e0d0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "60px 20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background grid */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,200,100,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,200,100,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      {/* Glow blob */}
      <div
        style={{
          position: "fixed",
          top: "-200px",
          right: "-200px",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,160,50,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <header style={{ textAlign: "center", marginBottom: "56px", position: "relative" }}>
        <div
          style={{
            display: "inline-block",
            border: "1px solid rgba(255,180,60,0.3)",
            padding: "4px 14px",
            fontSize: "11px",
            letterSpacing: "4px",
            color: "#ffb43c",
            marginBottom: "20px",
            textTransform: "uppercase",
          }}
        >
          Neural Vision · v1.0
        </div>
        <h1
          style={{
            fontSize: "clamp(36px, 6vw, 72px)",
            fontWeight: 900,
            letterSpacing: "-2px",
            lineHeight: 1,
            margin: "0 0 16px",
            fontFamily: "'Georgia', serif",
            background: "linear-gradient(135deg, #fff 30%, #ffb43c 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Face Detection
        </h1>
        <p style={{ color: "#666", fontSize: "14px", letterSpacing: "1px", margin: 0 }}>
          Upload an image — MTCNN does the rest
        </p>
      </header>

      {/* Upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => fileInputRef.current?.click()}
        style={{
          width: "100%",
          maxWidth: "600px",
          minHeight: "300px",
          border: `1px solid ${dragging ? "#ffb43c" : image ? "rgba(255,180,60,0.3)" : "rgba(255,255,255,0.1)"}`,
          borderRadius: "4px",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          transition: "border-color 0.2s",
          background: dragging ? "rgba(255,180,60,0.04)" : "rgba(255,255,255,0.02)",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt="Preview"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                maxHeight: "400px",
                display: "block",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "12px",
                right: "12px",
                background: "rgba(10,10,15,0.85)",
                border: "1px solid rgba(255,180,60,0.3)",
                padding: "4px 10px",
                fontSize: "11px",
                color: "#ffb43c",
                letterSpacing: "1px",
              }}
            >
              click to change
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.4 }}>⬡</div>
            <p style={{ margin: "0 0 8px", fontSize: "15px", color: "#ccc" }}>
              Drop image here or click to browse
            </p>
            <p style={{ margin: 0, fontSize: "12px", color: "#444", letterSpacing: "1px" }}>
              JPG · PNG · WEBP · BMP
            </p>
          </div>
        )}
      </div>

      {/* Detect button */}
      <button
        onClick={handleDetect}
        disabled={!file || loading}
        style={{
          marginTop: "24px",
          padding: "14px 48px",
          background: file && !loading ? "#ffb43c" : "transparent",
          border: `1px solid ${file && !loading ? "#ffb43c" : "rgba(255,255,255,0.1)"}`,
          color: file && !loading ? "#0a0a0f" : "#444",
          fontSize: "13px",
          letterSpacing: "3px",
          textTransform: "uppercase",
          cursor: file && !loading ? "pointer" : "not-allowed",
          fontFamily: "'Courier New', monospace",
          fontWeight: 700,
          transition: "all 0.2s",
          minWidth: "200px",
        }}
      >
        {loading ? (
          <span style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
            <span
              style={{
                width: "14px",
                height: "14px",
                border: "2px solid #444",
                borderTopColor: "#ffb43c",
                borderRadius: "50%",
                display: "inline-block",
                animation: "spin 0.8s linear infinite",
              }}
            />
            Scanning...
          </span>
        ) : (
          "Run Detection"
        )}
      </button>

      {/* Error */}
      {error && (
        <div
          style={{
            marginTop: "24px",
            maxWidth: "600px",
            width: "100%",
            padding: "16px 20px",
            border: "1px solid rgba(255,80,80,0.3)",
            background: "rgba(255,80,80,0.05)",
            color: "#ff6b6b",
            fontSize: "13px",
            letterSpacing: "0.5px",
          }}
        >
          ✗ {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div
          style={{
            marginTop: "40px",
            maxWidth: "800px",
            width: "100%",
          }}
        >
          {result.message ? (
            <div
              style={{
                border: "1px solid rgba(255,180,60,0.25)",
                background: "rgba(255,180,60,0.04)",
                padding: "28px",
                textAlign: "center",
              }}
            >
              <p style={{ margin: 0, color: "#888", fontSize: "14px", letterSpacing: "1px" }}>
                ○ {result.message}
              </p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div
                style={{
                  border: "1px solid rgba(255,180,60,0.25)",
                  background: "rgba(255,180,60,0.04)",
                  padding: "24px",
                  marginBottom: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                  <span
                    style={{
                      fontSize: "42px",
                      fontWeight: 900,
                      fontFamily: "'Georgia', serif",
                      color: "#ffb43c",
                      lineHeight: 1,
                    }}
                  >
                    {result.faces_detected}
                  </span>
                  <span style={{ fontSize: "13px", color: "#666", letterSpacing: "2px", textTransform: "uppercase" }}>
                    face{result.faces_detected !== 1 ? "s" : ""} detected
                  </span>
                </div>
                <div style={{ fontSize: "13px", color: "#888" }}>
                  {result.results.matchesFound} match{result.results.matchesFound !== 1 ? "es" : ""} found
                </div>
              </div>

              {/* Match Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {result.results.matches.map((match, index) => (
                  <div
                    key={index}
                    style={{
                      border: "1px solid rgba(255,180,60,0.25)",
                      background: "rgba(255,180,60,0.04)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "16px 20px",
                        borderBottom: "1px solid rgba(255,180,60,0.15)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: "rgba(0,0,0,0.2)",
                      }}
                    >
                      <span style={{ fontSize: "11px", letterSpacing: "2px", color: "#ffb43c", textTransform: "uppercase" }}>
                        Match #{index + 1}
                      </span>
                      <span
                        style={{
                          background: "rgba(255,180,60,0.15)",
                          padding: "4px 10px",
                          fontSize: "12px",
                          color: "#ffb43c",
                          borderRadius: "2px",
                        }}
                      >
                        {formatSimilarity(match.similarity)} match
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "row", padding: "24px" }}>
                      {/* Image */}
                      <div
                        style={{
                          width: "140px",
                          height: "140px",
                          border: "1px solid rgba(255,180,60,0.2)",
                          overflow: "hidden",
                          background: "rgba(0,0,0,0.3)",
                          flexShrink: 0,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={match.person.imageUrl}
                          alt={match.person.username}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </div>

                      {/* Details */}
                      <div style={{ marginLeft: "24px", flex: 1 }}>
                        <div style={{ marginBottom: "16px" }}>
                          <h3
                            style={{
                              fontSize: "22px",
                              fontWeight: 700,
                              fontFamily: "'Georgia', serif",
                              color: "#fff",
                              margin: "0 0 8px",
                            }}
                          >
                            {match.person.username}
                          </h3>
                          <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#888" }}>
                            <span>Age: {match.person.age}</span>
                            <span>Height: {match.person.height}cm</span>
                            <span>ID: {match.person.id.slice(0, 8)}...</span>
                          </div>
                        </div>

                        <div style={{ marginBottom: "12px" }}>
                          <div
                            style={{
                              fontSize: "10px",
                              letterSpacing: "2px",
                              color: "#555",
                              textTransform: "uppercase",
                              marginBottom: "4px",
                            }}
                          >
                            Description
                          </div>
                          <p style={{ margin: 0, fontSize: "13px", color: "#aaa", lineHeight: 1.6 }}>
                            {match.person.description}
                          </p>
                        </div>

                        <div>
                          <div
                            style={{
                              fontSize: "10px",
                              letterSpacing: "2px",
                              color: "#555",
                              textTransform: "uppercase",
                              marginBottom: "4px",
                            }}
                          >
                            Last Seen
                          </div>
                          <p style={{ margin: 0, fontSize: "13px", color: "#ffb43c" }}>
                            {match.person.lastSeenLocation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Raw JSON (Optional - you can remove this if you don't want to show raw data) */}
              <div
                style={{
                  marginTop: "24px",
                  border: "1px solid rgba(255,180,60,0.25)",
                  background: "rgba(255,180,60,0.04)",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    letterSpacing: "2px",
                    color: "#555",
                    textTransform: "uppercase",
                    marginBottom: "12px",
                  }}
                >
                  Raw API Response
                </div>
                <pre
                  style={{
                    margin: 0,
                    padding: "16px",
                    background: "rgba(0,0,0,0.4)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    fontSize: "12px",
                    color: "#aaa",
                    overflowX: "auto",
                    lineHeight: 1.6,
                    maxHeight: "240px",
                    overflowY: "auto",
                  }}
                >
                  {JSON.stringify(result.results, null, 2)}
                </pre>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}