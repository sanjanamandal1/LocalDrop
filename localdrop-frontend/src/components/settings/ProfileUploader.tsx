"use client";

import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { assetUrl } from "@/lib/assetUrl";
import { apiError } from "@/lib/api";
import { profileService } from "@/lib/services";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";

type ProfileUploaderProps = {
  userId: string;
  role: "creator" | "business";
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = { sm: "h-9 w-9", md: "h-20 w-20", lg: "h-28 w-28" };

export function ProfileUploader({ userId, role, photoUrl, size = "lg", className }: ProfileUploaderProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const qc = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const session = useAuthStore();

  const mutation = useMutation({
    mutationFn: (file: File) => profileService.uploadPhoto(userId, file, setProgress),
    onSuccess: (data) => {
      setPreview(null);
      setProgress(0);
      qc.invalidateQueries({ queryKey: ["profile", role] });
      if (session.user) {
        setSession({
          user: session.user,
          profile: data,
          accessToken: session.accessToken!,
          refreshToken: session.refreshToken!,
        });
      }
      toast.success(t("toast.profilePhotoUpdated"));
    },
    onError: (err) => {
      setPreview(null);
      setProgress(0);
      toast.error(apiError(err));
    },
  });

  const handleFile = useCallback((file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error(t("validation.imageType"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("validation.imageSize"));
      return;
    }
    setPreview(URL.createObjectURL(file));
    mutation.mutate(file);
  }, [mutation]);

  const displayUrl = preview || assetUrl(photoUrl);

  return (
    <div className={cn("relative inline-flex", className)}>
      <button
        type="button"
        className={cn(
          "group relative overflow-hidden rounded-full border-2 border-[#E5E7EB] bg-[#F8FAFC]",
          sizes[size],
          mutation.isPending && "opacity-80"
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        {displayUrl ? (
          <img src={displayUrl} alt={t("common.profile")} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#6B7280]">
            <Camera className={size === "sm" ? "h-4 w-4" : "h-8 w-8"} />
          </div>
        )}
        <div className={cn(
          "absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100",
          dragOver && "opacity-100"
        )}>
          {mutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : t("upload.changePhoto")}
        </div>
        {mutation.isPending && progress > 0 ? (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#6D28D9]" style={{ width: `${progress}%` }} />
        ) : null}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
