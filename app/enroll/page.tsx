"use client";

import { useState } from "react";
import { Upload, User, Calendar, Ruler, MapPin, FileText, Loader2 } from "lucide-react";

export default function EnrollPage() {
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    username: "",
    age: "",
    height: "",
    description: "",
    lastSeenLocation: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!image) {
      alert("Please upload an image");
      return;
    }

    setLoading(true);

    try {
      /* 1️⃣ Upload image to Cloudinary */
      const imgForm = new FormData();
      imgForm.append("file", image);

      const uploadRes = await fetch("/api/upload-image", {
        method: "POST",
        body: imgForm,
      });

      if (!uploadRes.ok) throw new Error("Image upload failed");

      const { imageUrl } = await uploadRes.json();

      /* 2️⃣ Send everything to enroll API */
      const enrollRes = await fetch("/api/enroll-face", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          age: Number(form.age),
          height: Number(form.height),
          imageUrl,
        }),
      });

      if (!enrollRes.ok) throw new Error("Enrollment failed");

      alert("Person enrolled successfully");
      
      // Reset form
      setForm({
        username: "",
        age: "",
        height: "",
        description: "",
        lastSeenLocation: "",
      });
      setImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error(error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Enroll Missing Person</h1>
          <p className="text-gray-600">Provide details to help us identify the person</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-2xl p-8 space-y-8">
          {/* Image Upload Section */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Image <span className="text-red-500">*</span>
            </label>
            
            <div className="flex flex-col items-center">
              {imagePreview ? (
                <div className="relative w-48 h-48 mb-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-xl border-4 border-white shadow-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors">
                    <Upload className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-sm text-gray-600 text-center px-4">Click to upload image</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG up to 5MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    required
                  />
                </label>
              )}
            </div>
          </div>

          {/* Personal Details Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Personal Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <User className="w-4 h-4 mr-2" />
                  Full Name <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Age */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Calendar className="w-4 h-4 mr-2" />
                  Age <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  name="age"
                  type="number"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="25"
                  min="0"
                  max="120"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Height */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Ruler className="w-4 h-4 mr-2" />
                  Height (cm)
                </label>
                <input
                  name="height"
                  type="number"
                  value={form.height}
                  onChange={handleChange}
                  placeholder="175"
                  min="0"
                  max="250"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Last Seen Location */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <MapPin className="w-4 h-4 mr-2" />
                  Last Seen Location
                </label>
                <input
                  name="lastSeenLocation"
                  value={form.lastSeenLocation}
                  onChange={handleChange}
                  placeholder="Central Park, New York"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <FileText className="w-4 h-4 mr-2" />
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the person's appearance, clothing, distinguishing features..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t">
            <button
              type="submit"
              disabled={loading || !image}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all flex items-center justify-center ${
                loading || !image
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:scale-95"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Enrolling...
                </>
              ) : (
                "Enroll Person"
              )}
            </button>
            
            {!image && (
              <p className="text-sm text-red-500 text-center mt-2">
                Please upload an image to continue
              </p>
            )}
            
            <p className="text-xs text-gray-500 text-center mt-4">
              All information will be securely stored and used only for identification purposes.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}