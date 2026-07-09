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

type CoverUploaderProps = {
  userId: string;
  coverUrl?: string | null;
  className?: string;
};

export function CoverUploader({ userId, coverUrl, className }: CoverUploaderProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const qc = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const session = useAuthStore();

  const mutation = useMutation({
    mutationFn: (file: File) => profileService.uploadCover(userId, file, setProgress),
    onSuccess: (data) => {
      setPreview(null);
      setProgress(0);
      qc.invalidateQueries({ queryKey: ["profile", "business"] });
      if (session.user) {
        setSession({
          user: session.user,
          profile: data,
          accessToken: session.accessToken!,
          refreshToken: session.refreshToken!,
        });
      }
      toast.success(t("toast.coverPhotoUpdated"));
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

  const displayUrl = preview || assetUrl(coverUrl);

  return (
    <div className={cn("relative w-full", className)}>
      <button
        type="button"
        className={cn(
          "group relative h-36 w-full overflow-hidden rounded-lg border-2 border-[#E5E7EB] bg-[#F8FAFC]",
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
          <img src={displayUrl} alt={t("form.coverUrl")} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-[#6B7280]">
            <Camera className="h-8 w-8 mb-1" />
            <span className="text-xs font-semibold">{t("upload.addCoverPhoto")}</span>
          </div>
        )}
        <div className={cn(
          "absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100",
          dragOver && "opacity-100"
        )}>
          {mutation.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Upload className="h-5 w-5 mb-1" />
              <span>{t("upload.changeCoverPhoto")}</span>
            </>
          )}
        </div>
        {mutation.isPending && progress > 0 ? (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#6D28D9]" style={{ width: `${progress}%` }} />
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
