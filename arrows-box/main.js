const flyd = require('flyd');
const {stream} = flyd;
const {__, liftN, curry, pipe, always, merge, props, apply, identity, unapply, partialRight, map, join} = require('ramda');

const setProp = curry((prop, value, obj) => obj[prop] = value);
const setInnerHTML = setProp('innerHTML');
const stringify = partialRight(JSON.stringify, null, 2);

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
    var d = time - oldTime;
    if (d > 0) s(1000 / d);
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

const init = always({
  x  : 0,
  y  : 0,
  vx : 0,
  vy : 0
});

const physics = (t, model) => {
  return merge(model, {
    x: model.x + t * model.vx,
    y: model.y + t * model.vy
  });
};

const step = (model, streams) => {
  const [dir, t] = streams;
  return move(dir, physics(t, model));
};

const move = function(dir, model) {
  return merge(model, {
    vx: dir.x * 0.05,
    vy: dir.y * 0.05
  });
};

const box = document.getElementById('box');
const render = pipe(props(['x', 'y']), apply(setPos(box)));
const model$ = flyd.scan(step, init(), liftN(2, unapply(identity))(keys$, fps$));

flyd.on(render, model$);

const printStreams = pipe(
  unapply(identity),
  map(stringify),
  join('\n\n'),
  setInnerHTML(__, document.getElementById('debug'))
);

liftN(2, printStreams)(keys$, model$)
