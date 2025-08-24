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
  const isScrolledToBottomRef = useRef(true);
  
  useEffect(() => {
    const element = scrollRef.current;
    if (element) {
      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = element;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
        isScrolledToBottomRef.current = isAtBottom;
      };
      element.addEventListener('scroll', handleScroll, { passive: true });
      return () => element.removeEventListener('scroll', handleScroll);
    }
  }, []);
  
  useEffect(() => {
    if (scrollRef.current && isScrolledToBottomRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [dependencies]);
  
  return scrollRef;
}