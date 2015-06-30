const flyd = require('flyd');
const kb = require('flyd-keyboard');
const {stream} = flyd;
const {__, liftN, curry, pipe, always, merge, props, apply, identity, unapply, partialRight, map, join, createMapEntry} = require('ramda');

const setProp = curry((prop, value, obj) => obj[prop] = value);
const setInnerHTML = setProp('innerHTML');
const stringify = partialRight(JSON.stringify, null, 2);

const setPos = curry((elem, left, top) => {
  elem.style.left = left + 'px';
  elem.style.top  = top + 'px';
});

const fps$ = (function() {
  var oldTime = Date.now();
  const s = flyd.stream();
  (function frame(time) {
    window.requestAnimationFrame(frame);
    var d = time - oldTime;
    if (d > 0) s(1000 / d);
    oldTime = time;
  }());
  return s;
}());

const init = always({
  x  : 200,
  y  : 200,
  vx : 0,
  vy : 0
});

const physics = (t, model) => {
  return merge(model, {
    x: model.x + t * model.vx,
    y: model.y + t * model.vy
  });
};

const move = function(dir, space, model) {
  return merge(model, {
    vx: dir.x * (space ? 0.20 : 0.05),
    vy: dir.y * (space ? 0.20 : 0.05)
  });
};

const step = (model, streams) => {
  const [dir, t, space] = streams;
  return move(dir, space, physics(t, model));
};

const arrows$ = kb.arrows();
const space$ = kb.key('space');

const box = document.getElementById('box');
const render = pipe(props(['x', 'y']), apply(setPos(box)));
const model$ = flyd.scan(step, init(), liftN(3, unapply(identity))(arrows$, fps$, space$));

flyd.on(render, model$);

const printStreams = pipe(
  unapply(identity),
  map(stringify),
  join('\n\n'),
  setInnerHTML(__, document.getElementById('debug'))
);

liftN(3, printStreams)(arrows$, model$, space$.map(createMapEntry('space')));
