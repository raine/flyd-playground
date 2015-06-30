const flyd = require('flyd');
const {curry, pipe, invoker} = require('ramda');

const fps$ = (function() {
  var oldTime = +new Date;
  const s = flyd.stream();
  (function frame(time) {
    window.requestAnimationFrame(frame);
    s(1000 / (time - oldTime));
    oldTime = time;
  }());
  return s;
}());

const toFixed = invoker(1, 'toFixed');
const setProp = curry((obj, prop, value) => obj[prop] = value);
const render = pipe(toFixed(1), setProp(document.getElementById('fps'), 'innerHTML'));

flyd.on(render, fps$);
