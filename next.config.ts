import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * Next 16 only honours qualities listed here — the default is `[75]`
     * and any other value on an <Image> is silently ignored, which is why
     * the banner kept coming back at 75 however it was asked for.
     *
     * The artwork is pixel art: JPEG-style quantisation at 75 blurs the hard
     * edges that are the whole point of it, and these files are small enough
     * that the extra bytes do not matter.
     */
    qualities: [75, 100],

    /**
     * The widths next/image is allowed to generate.
     *
     * The banner is 1500px, so 1920 and above upscale on the server and ship
     * a bigger file carrying no more detail. Capping the ladder at 1280 means
     * a wide screen is served the source at roughly 1:1 and the browser does
     * the last bit of scaling, which is sharper than resampling twice.
     */
    deviceSizes: [640, 750, 828, 1080, 1280],
  },
};

export default nextConfig;
