import { Capacitor } from "@capacitor/core";
import { useIsMobile } from "@/hooks/use-mobile";

/** Use bottom sheet instead of popover on narrow viewports and Capacitor native shells. */
export function useResponsiveOverlay(): boolean {
  const isMobile = useIsMobile();
  return isMobile || Capacitor.isNativePlatform();
}
