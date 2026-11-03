/* eslint-disable @next/next/no-img-element */

export const BRAND_NAME = "Caminhar para Cristo";

export const BRAND_ASSETS = {
  horizontal: {
    src: "/brand/logo-horizontal.png",
    width: 1024,
    height: 145,
  },
  vertical: {
    src: "/brand/logo-vertical.png",
    width: 792,
    height: 634,
  },
  avatar: {
    src: "/brand/logo-avatar.png",
    width: 1000,
    height: 1000,
  },
  favicon: {
    src: "/brand/favicon.png",
    svgSrc: "/sacred/favicon.svg",
    appleTouchSrc: "/brand/apple-touch-icon.png",
  },
};

export default function BrandLogo({
  variant = "horizontal",
  alt = BRAND_NAME,
  className = "",
  priority = false,
}) {
  const asset = BRAND_ASSETS[variant] || BRAND_ASSETS.horizontal;
  const classes = ["brand-logo", `brand-logo--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <img
      src={asset.src}
      width={asset.width}
      height={asset.height}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={classes}
    />
  );
}
