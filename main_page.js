let rendered = false;
let oldPageUrl = "";

function createMutationObserver() {
  const observer = new MutationObserver(async (mutationsList, observer) => {
    try {
      const currentPageUrl = window.location.href;
      if (oldPageUrl !== currentPageUrl || !rendered) {
        if (oldPageUrl !== currentPageUrl) {
          oldPageUrl = currentPageUrl;
          rendered = false;
        }

        if (!rendered) {
          const config = getMainConfig();
          const youtubeComponent = document.getElementById("above-the-fold");
          if (document.contains(youtubeComponent)) {
            rendered = true;

            const videoId = getYoutubeVideoId();
            if (videoId === null) {
              console.error(
                "Couldn't fetch videoId. - YouTube video AI assistant"
              );
              return;
            }

            const captions = await getYoutubeVideoCaptionBuckets(videoId);
            if (config.DEBUG) {
              console.log("YouTube-VideoID:", videoId);
              console.log("YouTube-Captions:", captions);
            }
            if (captions.length === 0) {
              throw new Error("Couldn't fetch the CAPTIONS of this video!");
            }

            renderChatBox();
            await createChatConversation(
              videoId,
              await getAllQuestionPairs(videoId)
            );
            renderChatGptEventListeners(videoId, captions);
          }
        }
      }
    } catch (err) {
      const msg = `Error: ${err}. - YouTube video AI assistant, main_page.js, mutationObserver.`;
      console.error(msg);
      alert(msg);
    }
  });

  const observerConfig = {
    childList: true,
    subtree: true,
  };

  observer.observe(document.documentElement, observerConfig);
}

window.onload = function () {
  createMutationObserver();
};
