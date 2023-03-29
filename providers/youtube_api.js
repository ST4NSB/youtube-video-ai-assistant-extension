function getYoutubeVideoId() {
  const config = getYouTubeConfigObject();
  const currentUrl = window.location.href;
  const videoIdRegex = new RegExp(config.VIDEOID_EXTRACT_REGEX);
  const match = videoIdRegex.exec(currentUrl);
  const videoId = match ? match[1] : null;
  return videoId;
}

async function getYoutubeVideoCaptionBuckets(videoId) {
  const config = getYouTubeConfigObject();
  const { title, captionsUrl } = await getYoutubeCaptionVideoDetails(
    videoId,
    config
  );
  const captions = await getYoutubeCaptionsByCaptionsUrl(captionsUrl, config);

  const captionBuckets = getCaptionBuckets(
    captions,
    config.CAPTIONS_SENTENCES_MAX_SIZE,
    `TITLE|${title}`
  );
  return captionBuckets;
}

function getCaptionBuckets(captions, bucketSize, title) {
  let buckets = [];
  let currBucket = [title];
  for (let i = 0; i < captions.length; i++) {
    let caption = `${captions[i].start}|${captions[i].message}`;
    let currBucketSize = currBucket.length;

    if (currBucketSize + 1 > bucketSize) {
      buckets = [...buckets, currBucket];
      currBucket = [title, caption];
    } else {
      currBucket = [...currBucket, caption];
    }
  }

  if (currBucket.length !== 0) {
    buckets = [...buckets, currBucket];
  }
  return buckets;
}

async function getYoutubeCaptionVideoDetails(videoId, config) {
  const response = await fetch(`${config.YOUTUBE_API.URL}${videoId}`, {
    method: config.YOUTUBE_API.METHOD,
  });

  const html = await response.text();

  const regex = new RegExp(config.CAPTION_EXTRACT_REGEX);
  const match = regex.exec(html);

  if (!match || match.length === 0) {
    throw new Error("Caption link was NOT found.");
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const title = doc.title;

  const captionsUrl = match[1].replace(/\\u0026/g, "&");
  return {
    title,
    captionsUrl,
  };
}

async function getYoutubeCaptionsByCaptionsUrl(captionsUrl, config) {
  const url = changeUrlLanguageParamToEnglish(captionsUrl);
  const response = await fetch(url);
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
      start: formatTimestamp(start, config.DETAILED_CAPTION_TIMESTAMPS),
      duration: formatTimestamp(duration, config.DETAILED_CAPTION_TIMESTAMPS),
      message: removeSpecialCharactersAndTags(message),
    };
    captions = [...captions, caption];
  }

  return captions;
}

function changeUrlLanguageParamToEnglish(address) {
  const url = new URL(address);
  const params = new URLSearchParams(url.search);
  params.set("lang", "en");
  url.search = params.toString();
  return url.toString();
}

function formatTimestamp(timestamp, allowDetailedTimestamps) {
  if (allowDetailedTimestamps) {
    return timestamp;
  }

  return timestamp.split(".")[0];
}

function removeSpecialCharactersAndTags(message) {
  const regex = /[\n\t\r\\]/g;
  const htmlEntityRegex = /&#[0-9]+;/g;
  const htmlTagRegex = /<\/?[a-zA-Z0-9]+[^>]*>/g;
  return message
    .replace(regex, " ")
    .replace(htmlEntityRegex, "")
    .replace(htmlTagRegex, "");
}
