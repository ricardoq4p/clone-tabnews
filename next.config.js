const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
module.exports = {
  devIndicators: false,
  images: {
    remotePatterns: cloud
      ? [
          {
            protocol: "https",
            hostname: "res.cloudinary.com",
            pathname: `/${cloud}/image/upload/**`,
          },
        ]
      : [],
  },
};
