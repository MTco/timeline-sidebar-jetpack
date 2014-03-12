
addon.port.on('new-history-item', function(details) {
  let div = document.createElement('div');
  //div.innerHTML = details.title;
  //div.innerHTML = details.thumbnail;
  let img = document.createElement('img');
  img.setAttribute('src', details.thumbnail);
  img.setAttribute('title', details.title);

  div.addEventListener('click', evt => {
    addon.port.emit('click', details);
  }, false);

  div.appendChild(img);
  document.body.appendChild(div);
});

window.onload = function() {
  addon.port.emit('load');
}
