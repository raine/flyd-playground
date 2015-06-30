const flyd = require('flyd');
const {stream} = flyd;
const kb = require('flyd-keyboard');
const ffilter = require('flyd-filter');
const timeInterval = require('flyd-timeinterval');
const {T, map, liftN, prop, unapply, identity, invoker, forEach, __, pipe, length, equals, compose, filter, partial} = require('ramda');

const MAX_INTERVAL = 1000;
const KONAMI = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
const KEYS = { 38: '↑', 40: '↓', 37: '←', 39: '→', 66: 'b', 65: 'a' };
const list = unapply(identity);

const keyDowns$ = kb.keyDowns();
const interval$ = timeInterval(keyDowns$);
const keyAndInterval$ = liftN(2, list)(keyDowns$, interval$.map(prop('interval')));

const correctSeq$ = flyd.scan((seq, vals) => {
  const [key, interval] = vals;
  const correct = KONAMI[seq.length] === key;
  if (seq.length > 0 && interval <= MAX_INTERVAL && correct)
    return seq.concat(key);
  else if (correct)
    return [key];
  else
    return [];
}, [], keyAndInterval$);

const isCorrect$ = flyd.transduce(compose(
  filter(pipe(length, equals(__, KONAMI.length))),
  map(T)
), correctSeq$);

const onCorrect = () => {
  correctSeq$([]);
  window.alert('Correct!');
};

// alert eats last keyup if it comes too early
isCorrect$.map(partial(setTimeout, onCorrect, 500));

const container = document.getElementById('code');
const render = (keys) => {
  const appendChild = invoker(1, 'appendChild');
  const kbd = (key) => {
    const elem = document.createElement('kbd')
    elem.appendChild(document.createTextNode(KEYS[key]));
    return elem;
  };

  container.innerHTML = '';
  forEach(appendChild(__, container), map(kbd, keys));
};


correctSeq$.map(render);
