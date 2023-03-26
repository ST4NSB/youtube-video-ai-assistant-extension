const YOUTUBE_URL = "https://www.youtube.com/watch?v=";

// -----------------------------------------------------------

async function getYoutubeVideoCaptions(videoId) {
  const captionsUrl = await getYoutubeCaptionVideoLink(videoId);
  const captions = await getYoutubeCaptionsByCaptionsUrl(captionsUrl);
  return captions;
}

async function getYoutubeCaptionVideoLink(videoId) {
  const response = await fetch(`${YOUTUBE_URL}${videoId}`, {
    method: "GET",
  });

  const html = await response.text();

  const regex = new RegExp(/"captionTracks":\[\{"baseUrl":"(.*?)"/);
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
      start,
      duration,
      message,
    };
    captions = [...captions, caption];
  }

  return captions;
}
