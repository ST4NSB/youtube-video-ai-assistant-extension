let rendered = false;
let oldPageUrl = "";

function createMutationObserver(config) {
  const observer = new MutationObserver(async (mutationsList, observer) => {
    const currentPageUrl = window.location.href;
    if (oldPageUrl !== currentPageUrl || !rendered) {
      if (oldPageUrl !== currentPageUrl) {
        oldPageUrl = currentPageUrl;
        rendered = false;
      }

      if (!rendered) {
        const youtubeComponent = document.getElementById("above-the-fold");
        if (document.contains(youtubeComponent)) {
          rendered = true;

          renderChatBox();
          const videoId = getYoutubeVideoId();
          if (videoId === null) {
            throw new Error("Couldn't fetch videoId.");
          }

          const captions = await getYoutubeVideoCaptionBuckets(videoId);
          if (config.DEBUG) {
            console.log("YouTube-VideoID:", videoId);
            console.log("YouTube-Captions:", captions);
          }

          const button = document.getElementById("send-to-chat");
          button.addEventListener("click", async () => {
            try {
              const question = document.getElementById("input-text").value;

              if (!question) {
                return;
              }

              const response = await getChatGptAnswer(
                videoId,
                question,
                captions
              );
              if (config.DEBUG) {
                console.log("ChatGPT response:", response);
              }

              const responseTextArea = document.getElementById("chat-response");
              responseTextArea.innerHTML = response;
            } catch (err) {
              const msg = `Error: ${err} in YouTube captions AI assistant, id: send-to-chat - Event Listener.`;
              console.error(msg);
              alert(msg);
            }
          });
        }
      }
    }
  });

  const observerConfig = {
    childList: true,
    subtree: true,
  };

  observer.observe(document.documentElement, observerConfig);
}

async function main() {
  try {
    const config = getMainConfig();
    createMutationObserver(config);
  } catch (err) {
    const msg = `Error: ${err} in YouTube captions AI assistant, main_page.js.`;
    console.error(msg);
    alert(msg);
  }
}

window.onload = function () {
  main();
};
