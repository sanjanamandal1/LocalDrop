"use client";

import { MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useGeolocation } from "@/hooks/useGeolocation";
import { reverseGeocode } from "@/services/reverseGeocode";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";

type FieldMapping = {
  lat?: string;
  lng?: string;
  city?: string;
  state?: string;
  address?: string;
};

type UseCurrentLocationButtonProps = {
  onLocation: (values: FieldMapping) => void;
  fields?: Partial<FieldMapping>;
  className?: string;
};

export function UseCurrentLocationButton({ onLocation, className }: UseCurrentLocationButtonProps) {
  const { t } = useI18n();
  const geo = useGeolocation();

  async function handleClick() {
    try {
      const position = await geo.fetchPosition();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      let city: string | undefined;
      let state: string | undefined;
      let address: string | undefined;

      try {
        const geoData = await reverseGeocode(lat, lng);
        city = geoData.city;
        state = geoData.state;
        address = geoData.address;
      } catch {
        toast.message(t("toast.coordinatesSet"));
      }

      onLocation({ lat: String(lat), lng: String(lng), city, state, address });
      toast.success(t("toast.locationFilled"));
    } catch {
      toast.error(geo.error || t("validation.locationFailed"));
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      disabled={geo.loading}
      onClick={handleClick}
    >
      {geo.loading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <MapPin className="mr-1 h-3 w-3" />}
      {t("action.useCurrentLocation")}
    </Button>
  );
}
