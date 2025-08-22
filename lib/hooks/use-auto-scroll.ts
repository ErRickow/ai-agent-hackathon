import React, { useRef, useEffect } from "react";

/**
 * Hook kustom untuk secara otomatis menggulir elemen ke bawah
 * hanya jika pengguna sudah berada di bagian bawah.
 * @param dependencies Array dependensi yang akan memicu pemeriksaan scroll.
 * @returns Ref yang harus dilampirkan ke elemen yang dapat digulir.
 */
export function useAutoScroll < T extends HTMLElement > (
  dependencies: any[] = []
): React.RefObject < T > {
  const scrollRef = useRef < T > (null);
  
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    
    // Tentukan "ambang batas" untuk dianggap "di bawah"
    const scrollThreshold = 100; // dalam piksel
    
    // Hitung posisi sebelum konten baru ditambahkan
    const position = element.scrollTop + element.clientHeight;
    const isAtBottom = position >= element.scrollHeight - scrollThreshold;
    
    // Hanya gulir jika pengguna sudah berada di bagian bawah
    if (isAtBottom) {
      element.scrollTo({
        top: element.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [dependencies]);
  
  return scrollRef;
}