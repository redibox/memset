global.HOOK_NAME = 'memset';
import Redibox from 'redibox';
import UserHook from './../src/hook';

global.some = {
  coolFunction(data) {
    console.log('COOL');
    console.dir(data);
  },
  unCoolFunc(data) {
    console.log('UNCOOL');
    console.dir(data);
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
    ],
  }, log: { level: 'verbose' },
};
config.hooks[global.HOOK_NAME] = UserHook;

before(done => {
  global.RediBox = new Redibox(config, () => {
    global.Hook = RediBox.hooks[global.HOOK_NAME];
    done();
  });
});

beforeEach(() => {
  Promise.all([
    RediBox.client.flushall(),
  ]);
});

after(() => {
  RediBox.disconnect();
});
