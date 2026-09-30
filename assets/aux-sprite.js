// Injects the Aggie UX icon sprite so `<use xlink:href="#aux_*">` icons in the
// AUX header and footer resolve. Same approach the AUX reference pages use.
(function () {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "https://aux.tamu.edu/icons/aux-sprite.svg", true);
  xhr.onload = function () {
    if (xhr.status < 200 || xhr.status >= 300) return;
    var div = document.createElement("div");
    div.setAttribute("hidden", "");
    div.innerHTML = xhr.responseText;
    function insert() { document.body.insertBefore(div, document.body.firstChild); }
    if (document.body) insert(); else document.addEventListener("DOMContentLoaded", insert);
  };
  xhr.send();
})();
