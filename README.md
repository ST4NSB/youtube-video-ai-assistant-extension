# youtube-captions-ai-assistant-extension

Developing a Google Chrome extension for YouTube that utilizes the captions and ChatGPT 3.5 to provide video assistance and information [Work in Progress]

TODO:

- get youtube captions - DONE
- change manifest url to youtube - DONE
- implement 1st mode for chatgpt - DONE
- include the title of the video to the initial requests (included in each separate request)
- (maybe not) implmenet the timestamp reverse step from hours:minutes:seconds to milliseconds (reverse of parseCaptionTimeStampToYoutubeVideoTimeStamp)
- ^ instead of reverse timestamp function, let the time with milliseconds (for performance) and include a text for chatgpt to say smth like: {TIMESTAMP:153}
- ^ preprocess the above timestamp from the chatgpt response to a anchor link
- implement 2nd mode for chatgpt
- clean some providers & functions
- test on longer videos
