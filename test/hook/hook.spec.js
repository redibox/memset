/* eslint no-underscore-dangle: 0 */
import { assert, expect } from 'chai';

describe('Core', () => {
  it('Should extend redibox BaseHook class and provide a name property', (done) => {
    assert.isDefined(Hook.name);
    assert.equal(global.HOOK_NAME, Hook.name);
    done();
  });

  it('Hook memset should mount to core.', (done) => {
    assert.isTrue(RediBox.hooks.hasOwnProperty(global.HOOK_NAME));
    done();
  });
});

describe('Memset', () => {
  it('Should return a string', (done) => {
    const value = Hook.string;

    expect(value).to.be.a('string');
    expect(value).to.equal('foo');
    done();
  });

  it('Should return an object', (done) => {
    const value = Hook.object;

    expect(value).to.be.a('object');
    expect(value).to.have.property('foo');
    expect(value.foo).to.equal('bar');
    done();
  });

  it('Should return a number', (done) => {
    const value = Hook.number;

    expect(value).to.be.a('number');
    expect(value).to.equal(1337);
    done();
  });

  it('Should return an array', (done) => {
    const value = Hook.array;

    expect(value).to.be.a('array');
    expect(value).to.have.length(3);
    expect(value[0]).to.equal('foo');
    expect(value[1]).to.equal('bar');
    expect(value[2]).to.be.a('function');
    expect(value[2]()).to.equal('baz');
    done();
  });
});


