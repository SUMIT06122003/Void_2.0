export function pauseOtherVideos(event) {
  const activeVideo = event.currentTarget;

  document.querySelectorAll("video").forEach((video) => {
    if (video !== activeVideo && !video.paused) {
      video.pause();
    }
  });
}
