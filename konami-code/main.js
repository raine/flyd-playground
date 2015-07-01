const flyd = require('flyd');
const {stream} = flyd;
const kb = require('flyd-keyboard');
const forwardTo = require('flyd-forwardto');
const timeInterval = require('flyd-timeinterval');
const inLast = require('flyd-inlast');
const {stringify} = require('../utils');
const Type = require('union-type');
const {curry, T, map, liftN, prop, invoker, forEach, __, pipe, length, equals, compose, filter, partial, always, flip, isEmpty} = require('ramda');

const RESET_AFTER = 2000;
const MAX_INTERVAL = 1000;
const KONAMI = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
const KEYS = { 38: '↑', 40: '↓', 37: '←', 39: '→', 66: 'b', 65: 'a' };

const init = always([]);
const showAlert = () => window.alert('KONAMI CODE BOOYAA!');

const Action = Type({
  Keydown: [Number, Number],
  Reset: []
});

const keyDowns$ = kb.keyDowns();
const interval$ = timeInterval(keyDowns$);
const keyAndInterval$ = liftN(2, Action.Keydown)(keyDowns$, interval$.map(prop('interval')));
const actions$ = stream();
flyd.on(actions$, keyAndInterval$);

const tryKeyOnSeq = curry((key, interval, seq) => {
  const correct = KONAMI[seq.length] === key;
  if (seq.length > 0 && interval <= MAX_INTERVAL && correct)
    return seq.concat(key);
  else if (correct)
    return [key];
  else
    return [];
});

const update = Action.caseOn({
  Keydown : tryKeyOnSeq,
  Reset   : init
});

const model$ = flyd.scan(flip(update), init(), actions$);
const recentKeys$ = inLast(RESET_AFTER, keyAndInterval$);
const isInactive$ = flyd.transduce(filter(isEmpty), recentKeys$);
const isCorrect$ = flyd.transduce(compose(
  filter(pipe(length, equals(__, KONAMI.length))),
  map(T)
), model$);

isInactive$.map(forwardTo(actions$, Action.Reset));

isCorrect$.map(pipe(
  partial(setTimeout, showAlert, 250),
  forwardTo(actions$, Action.Reset)
));

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

flyd.on(render, model$);
