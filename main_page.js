async function main() {
  try {
    const config = await getConfigObject();
    console.log(config);
  } catch (err) {
    const msg = `YouTube captions AI assistant - main_page.js - ${err}`;
    console.log(msg);
  }
}

window.onload = function () {
  main();
};
