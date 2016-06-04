'use strict';

var Bluebird = require('bluebird');

module.exports = class Service {
  constructor(name) {
    this.name = name;
  }
  get() {
    return Bluebird.reject(`"get" not implemented for "${this.name}" service`);
  }
  list() {
    return Bluebird.reject(`"list" not implemented for "${this.name}" service`);
  }
  create() {
    return Bluebird.reject(`"create" not implemented for "${this.name}" service`);
  }
  update() {
    return Bluebird.reject(`"update" not implemented for "${this.name}" service`);
  }
}
