const flyd = require('flyd');
const {curry, pipe, always, merge, props, apply, inc, evolve, identity, unapply, add, comparator, gt, path, partialRight} = require('ramda');
const lift = require('flyd-lift');

const setProp = curry((obj, prop, value) => obj[prop] = value);
const stringify = partialRight(JSON.stringify, null, 2);

const mouse$ = (function() {
  const s = flyd.stream();
  window.addEventListener('mousemove', (ev) => {
    s({ x: ev.x, y: ev.y });
  });
  return s;
}());

const fps$ = (function() {
  var oldTime = Date.now();
  const s = flyd.stream();
  (function frame(time) {
    window.requestAnimationFrame(frame);
    s(1000 / (time - oldTime));
    oldTime = time;
  }());
  return s;
}());

const init = always({
  x: 0,
  y: 0,
  v: 1
});

const setPos = curry((elem, left, top) => {
  elem.style.left = left + 'px';
  elem.style.top  = top + 'px';
});

const centerToElem = curry((elem, coords) => {
  const [w, h] = [elem.offsetWidth, elem.offsetHeight];
  const [x, y] = coords;
  return [x - w / 2, y - h / 2];
});

const limit = function(a, b, step) {
  var x = a + step;
  if      (step < 0 && x < b) return b;
  else if (step > 0 && x > b) return b;
  else                        return x;
};

const compare = comparator(gt);
const step = function(model, streams) {
  const [fps, mouse, slider] = streams;
  const dirX = compare(model.x, mouse.x);
  const dirY = compare(model.y, mouse.y);
  return merge(model, {
    x: limit(model.x, mouse.x, dirX * model.v),
    y: limit(model.y, mouse.y, dirY * model.v),
    v: slider
  });
};

const targetValue = path(['target', 'value']);
const slider$ = (function() {
  const slider = document.getElementById('velocity');
  const s = flyd.stream();
  s(slider.value);
  slider.addEventListener('input', pipe(targetValue, s));
  return s;
}());

const box = document.getElementById('box');
const render = pipe(props(['x', 'y']), centerToElem(box), apply(setPos(box)));
const model$ = flyd.scan(step, init(), lift(unapply(identity), fps$, mouse$, slider$.map(parseInt)));
// model$.map(console.log.bind(console));

flyd.on(render, model$);

const model = document.getElementById('model');
const renderModel = pipe(stringify, setProp(model, 'innerHTML'));

flyd.on(renderModel, model$);
