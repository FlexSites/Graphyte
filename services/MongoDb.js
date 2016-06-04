'use strict';

const Service = require('./Service');
const Bluebird = require('bluebird');
const mongoose = require('mongoose');
const config = require('config');
mongoose.Promise = Bluebird;
const { Schema } = mongoose;

const _model = Symbol('model');

const db = mongoose.connect(config.get('mongo.url'));

const DEFAULT_SCHEMA = new Schema({
  id: Schema.Types.ObjectId,
}, { strict: false });
DEFAULT_SCHEMA.set('toJSON', { getters: true, virtuals: true });
DEFAULT_SCHEMA.set('toObject', { getters: true, virtuals: true });


class Table extends Service {
  constructor(tenantID, model) {
    super('MongoDB Table');
    this[_model] = model;
    this.tenant = tenantID;
  }

  put(obj, conditions) {
    return this[_model]
      .update(conditions, obj, { upsert: true })
      .exec();
  }

  query(where, select) {
    // params.tenant = this.tenant;
    let results = this[_model]
      .find({});

    if (Array.isArray(select) && select.length){
      results = results.select(select.join(' '))
    }

    return results.exec()
      .then((results) => results.map(result => {
        result.id = result._id;
        return result.toJSON();
      }))
      .tap(console.log.bind(console, 'query returned'))
  }
}

module.exports = class MongoDB extends Service {
  constructor({platformId, tenantID}) {
    super(`${platformId} | MongoDB`);

    this.platform = platformId;
    this.tenant = tenantID;
  }

  table(tableName) {
    let args = [`${this.platform}_${tableName}`]
    if (!~db.modelNames().indexOf(args[0])) args.push(DEFAULT_SCHEMA);
    return new Table(this.tenant, db.model(...args));
  }
}

