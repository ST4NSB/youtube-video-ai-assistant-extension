# youtube-captions-ai-assistant-extension

Developing a Google Chrome extension for YouTube that utilizes the captions and ChatGPT 3.5 to provide video assistance and information [Work in Progress]

TODO:

- get youtube captions - DONE
- change manifest url to youtube - DONE
- implement 1st mode for chatgpt - DONE
- include path: youtube.com/watch in manifest - DONE
- include the title of the video to the initial requests (included in each separate request) - DONE
- instead of reverse timestamp function, let the time with milliseconds (for performance) and include a text for chatgpt to say smth like: {TIMESTAMP:153} - DONE
- ^ preprocess the above timestamp from the chatgpt response to a anchor link - DONE
- disable text input and button on waiting for chatgpt response - DONE
- change language from cn to en in captions request - DONE

- save the videoId with the chatgpt answer, when you come back to the video, you will have the chatgpt previous answer

- move these TODO in issues
- implement 2nd mode for chatgpt
- clean some providers & functions
- change config file logic, instead of function, just do the object
- test on longer videos
