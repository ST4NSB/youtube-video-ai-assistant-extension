async function getYoutubeVideoCaptionBuckets(videoId) {
  const config = getYouTubeConfigObject();
  const captionsUrl = await getYoutubeCaptionVideoLink(videoId, config);
  const captions = await getYoutubeCaptionsByCaptionsUrl(captionsUrl);

  const captionBuckets = getCaptionBuckets(
    captions,
    config.CAPTIONS_TOKEN_MAX_SIZE
  );
  return captionBuckets;
}

async function getYoutubeCaptionVideoLink(videoId, config) {
  const response = await fetch(`${config.YOUTUBE_API.URL}${videoId}`, {
    method: config.YOUTUBE_API.METHOD,
  });

  const html = await response.text();

  const regex = new RegExp(config.CAPTION_EXTRACT_REGEX);
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

function getCaptionBuckets(youTubeCaptions, tokenMaxSize) {
  const formattedCaptions = formatCaptions(youTubeCaptions);
  const buckets = getCaptionMessageBuckets(formattedCaptions, tokenMaxSize);
  return buckets;
}

function formatCaptions(youTubeCaptions) {
  let captionStr = "";
  for (let i = 0; i < youTubeCaptions.length; i++) {
    let caption = youTubeCaptions[i];
    captionStr += `${caption.start}|${caption.message}\\n`;
  }
  return captionStr;
}

function getCaptionMessageBuckets(formattedCaptions, tokenMaxSize) {
  const captions = formattedCaptions.split("\\n");
  const bucketSize = tokenMaxSize;

  let buckets = [];
  let currBucket = [];
  for (let i = 0; i < captions.length; i++) {
    let caption = captions[i];
    let currBucketSize = currBucket.reduce(
      (total, str) => total + str.length,
      0
    );

    if (currBucketSize + caption.length > bucketSize) {
      buckets = [...buckets, currBucket];
      currBucket = [caption];
    } else {
      currBucket = [...currBucket, caption];
    }
  }

  buckets = [...buckets, currBucket];
  return buckets;
}
