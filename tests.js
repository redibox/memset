global.HOOK_NAME = 'memset';
const Redibox = require('redibox').default;
const UserHook = require('./lib/hook').default;

global.some = {
  coolFunction() {
    console.log('COOL');
    return {
      foo: 'bar',
    };
  },
  unCoolFunc() {
    console.log('UNCOOL');
    return [
      'faa',
      'bor',
    ];
  },

  promise() {
    console.log('PROMISE');
    return Promise.resolve([
      'faa',
      'bor',
    ]);
  },
};

const config = {
  hooks: {}, memset: {
    sets: [
      {
        key: 'cool',
        runs: 'some.coolFunction',
        refreshInterval: 'every 15 seconds',
      },
      {
        key: 'uncool',
        runs: global.some.unCoolFunc,
        refreshInterval: 'every 25 seconds',
      },
      {
        key: 'prom',
        runs: global.some.promise,
        refreshInterval: 'every 5 seconds',
      },
    ],
  }, log: { level: 'debug' },
};
config.hooks[global.HOOK_NAME] = UserHook;
global.RediBox = new Redibox(config, () => {
  global.Hook = RediBox.hooks[global.HOOK_NAME];
});
