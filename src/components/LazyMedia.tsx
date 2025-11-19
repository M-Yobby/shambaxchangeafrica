import { useState, useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface LazyMediaProps {
  src: string;
  alt?: string;
  isVideo?: boolean;
  className?: string;
  containerClassName?: string;
}

export const LazyMedia = ({ 
  src, 
  alt = "Media", 
  isVideo = false, 
  className = "",
  containerClassName = ""
}: LazyMediaProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const mediaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mediaRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "50px", // Start loading 50px before entering viewport
      }
    );

    observer.observe(mediaRef.current);

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div ref={mediaRef} className={containerClassName}>
      {!isLoaded && (
        <Skeleton className={className} />
      )}
      {isInView && (
        <>
          {isVideo ? (
            <video
              src={src}
              controls
              className={`${className} ${!isLoaded ? 'hidden' : ''}`}
              onLoadedData={handleLoad}
            />
          ) : (
            <img
              src={src}
              alt={alt}
              className={`${className} ${!isLoaded ? 'hidden' : ''}`}
              onLoad={handleLoad}
              loading="lazy"
            />
          )}
        </>
      )}
    </div>
  );
};
