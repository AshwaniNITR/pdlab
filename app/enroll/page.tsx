"use client";

import { useState } from "react";
import { 
  Upload, 
  User, 
  Calendar, 
  Ruler, 
  MapPin, 
  FileText, 
  Loader2,
  Shield,
  AlertCircle,
  CheckCircle2,
  X,
  Camera,
  Info,
  ArrowRight
} from "lucide-react";

export default function EnrollPage() {
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [form, setForm] = useState({
    username: "",
    age: "",
    height: "",
    description: "",
    lastSeenLocation: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear error for this field when user starts typing
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    validateAndSetImage(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0] || null;
    validateAndSetImage(file);
  };

  const validateAndSetImage = (file: File | null) => {
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, image: "Please upload an image file" });
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, image: "Image size should be less than 5MB" });
        return;
      }

      setImage(file);
      setErrors({ ...errors, image: "" });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImage(null);
      setImagePreview(null);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.username.trim()) {
      newErrors.username = "Full name is required";
    }
    
    if (!form.age) {
      newErrors.age = "Age is required";
    } else if (Number(form.age) < 0 || Number(form.age) > 120) {
      newErrors.age = "Please enter a valid age";
    }
    
    if (form.height && (Number(form.height) < 0 || Number(form.height) > 250)) {
      newErrors.height = "Please enter a valid height";
    }
    
    if (!image) {
      newErrors.image = "Please upload an image";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    try {
      /* 1️⃣ Upload image to Cloudinary */
      const imgForm = new FormData();
      imgForm.append("file", image!);

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
          height: form.height ? Number(form.height) : null,
          imageUrl,
        }),
      });

      if (!enrollRes.ok) throw new Error("Enrollment failed");

      // Show success message
      setSubmitSuccess(true);
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setForm({
          username: "",
          age: "",
          height: "",
          description: "",
          lastSeenLocation: "",
        });
        setImage(null);
        setImagePreview(null);
        setSubmitSuccess(false);
      }, 2000);

    } catch (error) {
      console.error(error);
      setErrors({ ...errors, submit: "An error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-gray-900/[0.02] -z-10" />
      
      <div className="max-w-3xl mx-auto relative">
        {/* Header Section */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center justify-center p-2 bg-blue-100 rounded-full mb-4">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Enroll Missing Person
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Help us reunite families by providing accurate information about the missing person
          </p>
        </div>

        {/* Success Message */}
        {submitSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 animate-slide-down">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-green-700">Person enrolled successfully! Thank you for your contribution.</p>
          </div>
        )}

        {/* Error Message */}
        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-slide-down">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{errors.submit}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Image Upload Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <label className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-500" />
                Profile Image <span className="text-red-500">*</span>
              </label>
              {errors.image && (
                <span className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.image}
                </span>
              )}
            </div>

            <div 
              className={`relative ${dragActive ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {imagePreview ? (
                <div className="relative group">
                  <div className="relative w-48 h-48 mx-auto">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-2xl border-4 border-white shadow-xl group-hover:scale-105 transition-transform duration-300"
                    />
                  
                    <button
                      type="button"
                      onClick={() => {
                        setImage(null);
                        setImagePreview(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-all duration-300 opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 text-center mt-2">
                    Click the × to remove and upload a new image
                  </p>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <div className={`
                    border-3 border-dashed rounded-2xl p-8 transition-all duration-300
                    ${dragActive 
                      ? 'border-blue-400 bg-blue-50 scale-105' 
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
                    }
                  `}>
                    <div className="flex flex-col items-center">
                      <div className={`
                        p-4 rounded-full mb-4 transition-all duration-300
                        ${dragActive ? 'bg-blue-100' : 'bg-gray-100'}
                      `}>
                        <Upload className={`w-8 h-8 ${dragActive ? 'text-blue-500' : 'text-gray-500'}`} />
                      </div>
                      <p className="text-lg font-medium text-gray-700 mb-2">
                        {dragActive ? 'Drop your image here' : 'Drag & drop or click to upload'}
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        PNG, JPG, JPEG up to 5MB
                      </p>
                    <span
  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg inline-block"
>
  Choose Image
</span>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Personal Details Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300">
            <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-500" />
              Personal Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2 group">
                <label className="flex items-center text-sm font-medium text-gray-700 group-focus-within:text-blue-600 transition-colors">
                  <User className="w-4 h-4 mr-2 transition-transform group-focus-within:scale-110" />
                  Full Name <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={`text-black
                    w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                    transition-all duration-300 bg-white/50 backdrop-blur-sm
                    ${errors.username ? 'border-red-300 bg-red-50/50' : 'border-gray-200 hover:border-gray-300'}
                  `}
                />
                {errors.username && (
                  <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Age */}
              <div className="space-y-2 group">
                <label className="flex items-center text-sm font-medium text-gray-700 group-focus-within:text-blue-600 transition-colors">
                  <Calendar className="w-4 h-4 mr-2 transition-transform group-focus-within:scale-110" />
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
                  className={`text-black
                    w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                    transition-all duration-300 bg-white/50 backdrop-blur-sm
                    ${errors.age ? 'border-red-300 bg-red-50/50' : 'border-gray-200 hover:border-gray-300'}
                  `}
                />
                {errors.age && (
                  <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.age}
                  </p>
                )}
              </div>

              {/* Height */}
              <div className="space-y-2 group">
                <label className="flex items-center text-sm font-medium text-gray-700 group-focus-within:text-blue-600 transition-colors">
                  <Ruler className="w-4 h-4 mr-2 transition-transform group-focus-within:scale-110" />
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
                  className={`text-black
                    w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                    transition-all duration-300 bg-white/50 backdrop-blur-sm
                    ${errors.height ? 'border-red-300 bg-red-50/50' : 'border-gray-200 hover:border-gray-300'}
                  `}
                />
                {errors.height && (
                  <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.height}
                  </p>
                )}
              </div>

              {/* Last Seen Location */}
              <div className="space-y-2 group">
                <label className="flex items-center text-sm font-medium text-gray-700 group-focus-within:text-blue-600 transition-colors">
                  <MapPin className="w-4 h-4 mr-2 transition-transform group-focus-within:scale-110" />
                  Last Seen Location
                </label>
                <input
                  name="lastSeenLocation"
                  value={form.lastSeenLocation}
                  onChange={handleChange}
                  placeholder="Central Park, New York"
                  className="w-full text-black px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm hover:border-gray-300"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 mt-6 group">
              <label className="flex items-center text-sm font-medium text-gray-700 group-focus-within:text-blue-600 transition-colors">
                <FileText className="w-4 h-4 mr-2 transition-transform group-focus-within:scale-110" />
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the person's appearance, clothing, distinguishing features..."
                rows={4}
                className="w-full px-4 text-black py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm hover:border-gray-300 resize-none"
              />
            </div>
          </div>

          {/* Submit Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className={`
                w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 
                flex items-center justify-center gap-2 text-lg relative overflow-hidden group
                ${loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl active:scale-95'
                }
              `}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enrolling...
                </>
              ) : (
                <>
                  Enroll Person
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>
            
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
              <Shield className="w-4 h-4" />
              <p>All information is securely stored and encrypted</p>
            </div>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        
        .bg-grid-gray-900\/\[0\.02\] {
          background-image: linear-gradient(currentColor 1px, transparent 1px),
            linear-gradient(to right, currentColor 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>
    </div>
  );
}