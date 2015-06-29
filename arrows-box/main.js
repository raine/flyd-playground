const flyd = require('flyd');
const {stream} = flyd;
const {__, liftN, curry, pipe, always, merge, props, apply, inc, evolve, identity, unapply, add, comparator, gt, path, partialRight, equals} = require('ramda');

const setProp = curry((prop, value, obj) => obj[prop] = value);
const setInnerHTML = setProp('innerHTML');
const stringify = partialRight(JSON.stringify, null, 2);

const init = always({
  x: 0,
  y: 0
});

const setPos = curry((elem, left, top) => {
  elem.style.left = left + 'px';
  elem.style.top  = top + 'px';
});

function strictEq(a, b) {
  return a === b;
}

const skipDuplicates = function(eq, s) {
  if (flyd.isStream(eq)) {
    s  = eq;
    eq = strictEq;
  }

  var prev;
  return stream([s], function(self) {
    if (!eq(s.val, prev)) {
      self(s.val);
      prev = s.val;
    }
  });
};

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

const keys$ = (function() {
  const left  = stream(false);
  const right = stream(false);
  const up    = stream(false);
  const down  = stream(false);

  document.addEventListener('keydown', function(ev) {
    if      (ev.keyCode === 37) left(true);
    else if (ev.keyCode === 39) right(true);
    else if (ev.keyCode === 38) up(true);
    else if (ev.keyCode === 40) down(true);
  }, false);

  document.addEventListener('keyup', function(ev) {
    if      (ev.keyCode === 37) left(false);
    else if (ev.keyCode === 39) right(false);
    else if (ev.keyCode === 38) up(false);
    else if (ev.keyCode === 40) down(false);
  }, false);

  var eqCoords = function(a, b) {
    return a && b && a.x === b.x && a.y === b.y;
  };

  return skipDuplicates(eqCoords, stream([left, right, up, down], function() {
    return {
      x: left()  ? -1 :
         right() ?  1 : 0,
      y: up()    ? -1 :
         down()  ?  1 : 0
    };
  }));
}());

// TODO: move fps
const step = function(model, streams) {
  const [keys, fps] = streams;
  return evolve({
    x: add(keys.x),
    y: add(keys.y)
  }, model);
};

const box = document.getElementById('box');
const render = pipe(props(['x', 'y']), apply(setPos(box)));
const model$ = flyd.scan(step, init(), liftN(2, unapply(identity))(keys$, fps$));

flyd.on(render, model$);

flyd.on(pipe(
  stringify,
  setInnerHTML(__, document.getElementById('model'))
), model$);

flyd.on(pipe(
  stringify,
  setInnerHTML(__, document.getElementById('keys'))
), keys$);
