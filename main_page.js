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
              const chatboxDiv = document.getElementById("chat-box");
              if (chatboxDiv) {
                chatboxDiv.remove();
              }
              return;
            }

            if (config.DEBUG) {
              console.log("YouTube-VideoID:", videoId);
            }

            // check if Link exists, if not, throw error
            await getYoutubeCaptionVideoDetails(videoId);

            renderChatBox();
            await createChatConversation(
              videoId,
              await getAllQuestionPairs(videoId)
            );
            renderChatGptEventListeners(videoId);
          }
        }
      }
    } catch (err) {
      const msg = `Error: ${err.message} - YouTube video AI assistant, main_page.js, mutationObserver.`;
      console.error(msg);
      //alert(msg);
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
