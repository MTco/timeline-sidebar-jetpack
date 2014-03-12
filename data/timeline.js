
addon.port.on('new-history-item', function(details) {
  let div = document.createElement('div');
  div.setAttribute('data-index', details.index);
  //div.innerHTML = details.title;
  //div.innerHTML = details.thumbnail;
  let img = document.createElement('img');
  img.setAttribute('src', details.thumbnail);
  img.setAttribute('title', details.title);

  div.addEventListener('click', evt => {
    addon.port.emit('click', details);
  }, false);

  div.appendChild(img);
  let lastEle;
  for (let i = document.body.children.length - 1; i >=0; i--) {
    let ele = document.body.children[i];
    if ((ele.getAttribute('data-index')*1) > details.index) {
      break;
    }
    lastEle = ele;
  }
  if (lastEle) {
    document.body.insertBefore(div, lastEle);
  }
  else {
    document.body.appendChild(div);
  }
});

window.onload = function() {
  addon.port.emit('load');
}
