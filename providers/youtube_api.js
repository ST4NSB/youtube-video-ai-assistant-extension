async function getYoutubeVideoCaptions(videoId) {
  const captionsUrl = await getYoutubeCaptionVideoLink(videoId);
  const captions = await getYoutubeCaptionsByCaptionsUrl(captionsUrl);
  return captions;
}

async function getYoutubeCaptionVideoLink(videoId) {
  const youTubeConfig = getYouTubeConfigObject();
  const response = await fetch(`${youTubeConfig.YOUTUBE_API.URL}${videoId}`, {
    method: youTubeConfig.YOUTUBE_API.METHOD,
  });

  const html = await response.text();

  const regex = new RegExp(youTubeConfig.CAPTION_EXTRACT_REGEX);
  const match = regex.exec(html);

  if (!match || match.length === 0) {
    throw new Error("Caption link was NOT found!");
  }

  const captionUrl = match[1].replace(/\\u0026/g, "&");
  return captionUrl;
}

async function getYoutubeCaptionsByCaptionsUrl(captionsUrl) {
  const response = await fetch(captionsUrl);
  const xmlString = await response.text();

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");
  const texts = xmlDoc.getElementsByTagName("text");

  let captions = [];
  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    const start = text.getAttribute("start");
    const duration = text.getAttribute("dur");
    const message = text.textContent;

    let caption = {
      start: parseCaptionTimeStampToYoutubeVideoTimeStamp(start),
      duration: parseCaptionTimeStampToYoutubeVideoTimeStamp(duration),
      message,
    };
    captions = [...captions, caption];
  }

  return captions;
}

function parseCaptionTimeStampToYoutubeVideoTimeStamp(timestamp) {
  // Video start time (in seconds)
  const videoStart = 0;

  // Calculate the absolute start time (in seconds)
  const absoluteStart = timestamp + videoStart;

  // Convert the absolute start time to the video timestamp format
  const date = new Date(absoluteStart * 1000); // Convert to milliseconds
  const convertedTimestamp = date.toISOString().substr(11, 12);

  return convertedTimestamp;
}
