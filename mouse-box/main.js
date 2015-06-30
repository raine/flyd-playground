const flyd = require('flyd');
const {curry, pipe, always, merge, props, apply} = require('ramda');

const mouse$ = (function() {
  const s = flyd.stream();
  window.addEventListener('mousemove', (ev) => {
    s({ x: ev.x, y: ev.y });
  });
  return s;
}());

const init = always({
  x: 0,
  y: 0
});

const setPos = curry((elem, left, top) => {
  elem.style.left = left + 'px';
  elem.style.top  = top + 'px';
});

const centerToElem = curry((elem, coords) => {
  const [w, h] = [elem.offsetWidth, elem.offsetHeight];
  return {
    x: coords.x - w / 2,
    y: coords.y - h / 2
  };
});

const box = document.getElementById('box');
const render = pipe(centerToElem(box), props(['x', 'y']), apply(setPos(box)));
const model$ = flyd.scan(merge, init(), mouse$);
flyd.on(render, model$);
