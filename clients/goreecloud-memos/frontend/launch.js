const APP_URL = "https://memos.goreecloud.com/";

// Paint the bundled launch surface first, then immediately replace it with the
// canonical GoreeCloud Memos origin. The bundled page gives Android/Linux an
// instant first frame while the browser connection is being established.
requestAnimationFrame(() => {
  window.location.replace(APP_URL);
});
