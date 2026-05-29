"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDashboardData } from "../../_components/DashboardDataProvider";
import { useUploadThing } from "@/utils/uploadthing";

const profileImageUrl =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuApIvNFMJXHCg8P4tpG5QDsfymtv-urWSYBmXDYrNt9JRKsYzVCASmmYLijjs7p5tsT_r72DIv-dfvV9jy7r5-jyTvcH8jMGmAkBtOjB8JinodWzKr6jkTm_cVbxPCfco3eCxPSm2SBtD9-VWB-yGRSecULyws75JmL9YZAkCFMlSgCRceb5J2ojTsF0u6FY5_EI7SGKq-wJhUVIs0JKetZHC1PHt7YZZu6LOB88CQMWpbrPqyZutKn2TggFRTQ8yBriIB5_ltIzdYl";

export default function ProfileSection() {
  const { profile, isLoading, updateProfile } = useDashboardData();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  const [interests, setInterests] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { startUpload, isUploading, uploadProgress } = useUploadThing("imageUploader");

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsDataURL(file);
    });

  useEffect(() => {
    setName(profile?.name ?? "");
    setAge(typeof profile?.age === "number" ? String(profile.age) : "");
    setGender(profile?.gender ?? "");
    setLocation(profile?.location ?? "");
    setInterests((profile?.interests ?? []).join(", "));
  }, [profile]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const avatarSrc = useMemo(
    () => previewUrl || profile?.avatarUrl || profile?.userBodyImageUrl || profileImageUrl,
    [previewUrl, profile?.avatarUrl, profile?.userBodyImageUrl]
  );

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image must be 4MB or smaller.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      let avatarUrl = profile?.avatarUrl || undefined;

      if (selectedFile) {
        try {
          const uploaded = await startUpload([selectedFile]);
          const uploadedFile = uploaded?.[0] as
            | { url?: string; ufsUrl?: string }
            | undefined;
          avatarUrl = uploadedFile?.url || uploadedFile?.ufsUrl || avatarUrl;
        } catch {
          // Fallback keeps profile updates working when UploadThing is not configured in local env.
          avatarUrl = await fileToDataUrl(selectedFile);
          toast.error("UploadThing failed. Saved image using local fallback.");
        }
      }

      const nextInterests = interests
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      const payload: Parameters<typeof updateProfile>[0] = {};

      if (name.trim()) {
        payload.name = name.trim();
      }

      if (avatarUrl) {
        payload.avatarUrl = avatarUrl;
      }

      if (age) {
        payload.age = Number(age);
      }

      if (gender.trim()) {
        payload.gender = gender.trim();
      }

      if (location.trim()) {
        payload.location = location.trim();
      }

      if (nextInterests.length) {
        payload.interests = nextInterests;
      }

      await updateProfile(payload);

      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const disabled = isLoading || isSubmitting || isUploading;

  return (
    <section className="space-y-6" id="profile">
      <div className="pb-4 border-b border-outline-variant">
        <h3 className="font-headline-md text-headline-md text-on-surface">
          Profile
        </h3>
        <p className="text-body-md text-on-surface-variant">
          Manage your public identity and core account details.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
        <div className="relative">
          <Image
            src={avatarSrc}
            alt="Profile"
            width={96}
            height={96}
            className="w-24 h-24 rounded-full border-2 border-outline-variant object-cover"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 bg-primary p-1 rounded-full border-2 border-background"
          >
            <span className="material-symbols-outlined text-[16px] text-on-primary">
              edit
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <div className="flex-1 w-full space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-label-sm uppercase tracking-wider text-outline">
                Full Name
              </label>
              <Input
                className="bg-surface-container border-outline-variant rounded px-4 py-2"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={disabled}
              />
            </div>
            <div className="space-y-1">
              <label className="text-label-sm uppercase tracking-wider text-outline">
                Email Address
              </label>
              <Input
                className="bg-surface-container border-outline-variant rounded px-4 py-2 opacity-80"
                type="email"
                value={profile?.email ?? ""}
                disabled
              />
            </div>
            <div className="space-y-1">
              <label className="text-label-sm uppercase tracking-wider text-outline">
                Age
              </label>
              <Input
                className="bg-surface-container border-outline-variant rounded px-4 py-2"
                type="number"
                value={age}
                onChange={(event) => setAge(event.target.value)}
                disabled={disabled}
              />
            </div>
            <div className="space-y-1">
              <label className="text-label-sm uppercase tracking-wider text-outline">
                Gender
              </label>
              <Input
                className="bg-surface-container border-outline-variant rounded px-4 py-2"
                type="text"
                value={gender}
                onChange={(event) => setGender(event.target.value)}
                disabled={disabled}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-label-sm uppercase tracking-wider text-outline">
                Location
              </label>
              <Input
                className="bg-surface-container border-outline-variant rounded px-4 py-2"
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                disabled={disabled}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-label-sm uppercase tracking-wider text-outline">
                Interests
              </label>
              <Input
                className="bg-surface-container border-outline-variant rounded px-4 py-2"
                type="text"
                value={interests}
                onChange={(event) => setInterests(event.target.value)}
                placeholder="Comma-separated interests"
                disabled={disabled}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <p className="text-label-sm text-outline-variant">
              {isUploading
                ? `Uploading avatar ${Math.round(uploadProgress)}%`
                : selectedFile
                  ? "Avatar preview ready to upload."
                  : "Profile image is synced from the backend."}
            </p>
            <Button className="w-full sm:w-auto px-6" onClick={handleSave} disabled={disabled}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}