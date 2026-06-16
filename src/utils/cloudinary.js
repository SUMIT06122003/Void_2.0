/* global __CLOUDINARY_BASE_FOLDER__, __CLOUDINARY_IMAGE_TRANSFORM__, __CLOUDINARY_VIDEO_TRANSFORM__ */
const cloudName = "";
const baseFolder = (__CLOUDINARY_BASE_FOLDER__ || "void").replace(/^\/|\/$/g, "");
const imageTransform = __CLOUDINARY_IMAGE_TRANSFORM__ || "f_auto,q_auto";
const videoTransform = __CLOUDINARY_VIDEO_TRANSFORM__ || "f_auto,q_auto";

function buildCloudinaryUrl(resourceType, publicId, transform) {
  if (!cloudName || !publicId) {
    return "";
  }

  const normalizedPublicId = String(publicId).replace(/^\/|\/$/g, "");
  const folderPrefix = baseFolder ? `${baseFolder}/` : "";
  const transformPath = transform ? `${transform}/` : "";

  return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${transformPath}${folderPrefix}${normalizedPublicId}`;
}

export function cloudinaryImage(publicId, fallback) {
  return fallback || buildCloudinaryUrl("image", publicId, imageTransform);
}

export function cloudinaryVideo(publicId, fallback) {
  return fallback || buildCloudinaryUrl("video", publicId, videoTransform);
}

export function isCloudinaryEnabled() {
  return Boolean(cloudName);
}
