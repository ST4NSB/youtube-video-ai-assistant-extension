async function main() {
  try {
    const captions = await getYoutubeVideoCaptionBuckets("qLGmj86-j4k");
    console.log(captions);
    const response = await getChatGptAnswer("make a short tl:dr", captions);
    console.log(response);
  } catch (err) {
    const msg = `YouTube captions AI assistant - main_page.js - ${err}`;
    console.error(msg);
  }
}

window.onload = function () {
  main();
};
