const flyd = require('flyd');
const {curry, pipe} = require('ramda');

const setProp = curry((obj, prop, value) => obj[prop] = value);
const mouse$ = (function() {
  const s = flyd.stream();
  window.addEventListener('mousemove', (ev) =>
    s({ x: ev.x, y: ev.y }));
  return s;
}());

const formatCoords = (coords) => `(${coords.x}, ${coords.y})`;
const render = pipe(formatCoords, setProp(document.getElementById('mouse'), 'innerHTML'));

flyd.on(render, mouse$);
