import React, { useRef, useEffect, useState } from 'react';

interface ImageVariants {
  thumbnail?: string;
  small?: string;
  medium?: string;
  large?: string;
  webp?: {
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
  };
}

interface ResponsiveImageProps {
  src: string;
  variants?: ImageVariants | any;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  variants,
  alt,
  className = '',
  style = {},
  loading = 'lazy',
  sizes = '(max-width: 576px) 100vw, (max-width: 768px) 50vw, 33vw',
  onLoad,
  onError
}) => {
  const [isInView, setIsInView] = useState(loading === 'eager');
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (loading === 'eager' || !('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px'
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [loading]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
    onError?.();
  };

  // Parse variants if they're a JSON string
  let imageVariants = variants;
  if (typeof variants === 'string') {
    try {
      imageVariants = JSON.parse(variants);
    } catch {
      imageVariants = null;
    }
  }

  // Build srcSet for responsive images
  const buildSrcSet = (variantsObj: any, useWebP: boolean = false) => {
    if (!variantsObj) return '';
    
    const sources = useWebP && variantsObj.webp ? variantsObj.webp : variantsObj;
    const srcSetParts: string[] = [];
    
    if (sources.small) srcSetParts.push(`${sources.small} 400w`);
    if (sources.medium) srcSetParts.push(`${sources.medium} 800w`);
    if (sources.large) srcSetParts.push(`${sources.large} 1200w`);
    
    return srcSetParts.join(', ');
  };

  const jpegSrcSet = buildSrcSet(imageVariants, false);
  const webpSrcSet = buildSrcSet(imageVariants, true);

  // Determine the default src (fallback)
  const defaultSrc = imageVariants?.medium || imageVariants?.large || src;
  const thumbnailSrc = imageVariants?.thumbnail || defaultSrc;

  // Blur placeholder styles
  const placeholderStyles: React.CSSProperties = {
    ...style,
    filter: isLoaded ? 'none' : 'blur(10px)',
    transition: 'filter 0.3s ease-in-out',
    backgroundColor: hasError ? '#f8f9fa' : undefined
  };

  if (hasError) {
    return (
      <div 
        className={`d-flex align-items-center justify-content-center ${className}`}
        style={{ ...style, backgroundColor: '#f8f9fa', minHeight: '200px' }}
      >
        <span className="text-muted">Failed to load image</span>
      </div>
    );
  }

  if (!isInView) {
    return (
      <div 
        ref={imgRef as any}
        className={className}
        style={{ ...style, backgroundColor: '#f8f9fa', minHeight: '200px' }}
      />
    );
  }

  // If we have variants, use picture element for better browser support
  if (imageVariants && (jpegSrcSet || webpSrcSet)) {
    return (
      <picture>
        {webpSrcSet && (
          <source
            type="image/webp"
            srcSet={webpSrcSet}
            sizes={sizes}
          />
        )}
        {jpegSrcSet && (
          <source
            type="image/jpeg"
            srcSet={jpegSrcSet}
            sizes={sizes}
          />
        )}
        <img
          ref={imgRef}
          src={defaultSrc}
          alt={alt}
          className={className}
          style={placeholderStyles}
          onLoad={handleLoad}
          onError={handleError}
          loading={loading}
        />
      </picture>
    );
  }

  // Fallback to regular img tag if no variants
  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={className}
      style={placeholderStyles}
      onLoad={handleLoad}
      onError={handleError}
      loading={loading}
    />
  );
};

export default ResponsiveImage;