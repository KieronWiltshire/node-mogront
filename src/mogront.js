'use strict';

import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import ChangeCase from 'change-case';
import {default as createDebugger} from 'debug';
import CombineErrors from 'combine-errors';
import * as Database from './database';

const debug = createDebugger('mogront');

/**
 *
 */
export default class Mogront {

  /**
   * Create a new {Mogront} instance.
   */
  constructor(mongo, {
    collectionName = '_migrations', // The name of the collection that will store migration state
    migrationsDir = (path.join(process.cwd(), 'migrations')), // Relative path to the migrations directory
    url,
    user,
    password,
    host = '127.0.0.1',
    port = 27017,
    db
  } = {}) {
    if (((url && (typeof url === 'string')) || ((host && (typeof host === 'string')) && (port && (typeof port === 'string' || typeof port === 'number')))) && (db && (typeof db === 'string'))) {
      this._connectedInternally = false;
      this._disposed = false;

      collectionName = collectionName.toString();

      if (!(mongo instanceof Database.MongoClient)) {
        mongo = Database.getConnection({ url, user, password, host, port, db });
        this._connectedInternally = true;
      }

      if (collectionName.length <= 0 && !(/^(?![0-9]*$)[a-zA-Z0-9]+$/.test(collectionName))) {
        throw new Error('The specified collection name cannot conform to mongodb\'s specifications')
      }

      if (!fs.existsSync(migrationsDir)) {
        fs.mkdirSync(migrationsDir);
      }

      this._db = db;
      this._mongo = mongo;
      this._collectionName = collectionName;
      this._migrationsDir = migrationsDir;
    } else {
      throw new Error('Option parameters are missing or invalid');
    }
  }

  /**
   * Retrieve the {MongoClient} instance.
   *
   * @returns {MongoClient}
   */
  async mongo() {
    if (this._mongo instanceof Promise) {
      this._mongo = await this._mongo;
    }

    return this._mongo;
  }

  /**
   * Dispose of the {MongoClient} instance.
   *
   * @returns {void}
   */
  async dispose() {
    let result = null;

    try {
      if (this._connectedInternally) {
        result = await Database.dispose();
      } else {
        let connection = await this.mongo();
        result = await connection.close();
      }

      this._disposed = true;

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if the connection has been disposed.
   *
   * @return {boolean}
   */
  isDisposed() {
    return this._disposed;
  }

  /**
   * Retrieve the path to the migrations directory.
   *
   * @returns {string}
   */
  getMigrationsDirectory() {
    return this._migrationsDir;
  }

  /**
   * Create a migration.
   *
   * @param {string} name The name of the migration
   * @returns {boolean} true if the migration file was created successfully
   */
  async create(name, {
    template = 'vanilla'
  } = {}) {
    let self = this;

    return new Promise(function(resolve, reject) {
      template = template.toLowerCase();
      name = ChangeCase.snakeCase(name.toLowerCase());

      let templateFileExtension = '';

      switch (template) {
        case 'vanilla':
        case 'es6':
        default:
          templateFileExtension = '.js';
          break;
      }

      let creationTimestamp = new Date();
      let creationDate = ('0' + creationTimestamp.getDate()).slice(-2);
      let creationMonth = ('0' + (creationTimestamp.getMonth() + 1)).slice(-2);
      let creationYear = creationTimestamp.getFullYear();
      let creationHour = ('0' + creationTimestamp.getHours()).slice(-2);
      let creationMinute = ('0' + creationTimestamp.getMinutes()).slice(-2);
      let creationSecond = ('0' + creationTimestamp.getSeconds()).slice(-2);

      let fileName = creationYear + '_' + creationMonth + '_' + creationDate + '_' + creationHour + creationMinute + creationSecond + '_' + name;
      let fileExtension = '.js';
      let filePath = path.join(self._migrationsDir, fileName + fileExtension);

      if (fs.existsSync(filePath)) {
        return reject(new Error('The file to generate seems to have already been created, [' + filePath + ']'));
      } else {
        let stream = fs.createReadStream(path.resolve(__dirname, 'stubs', template + templateFileExtension)).pipe(fs.createWriteStream(filePath));

        stream.on('error', reject);
        stream.on('close', function () {
          return resolve(fileName + fileExtension);
        });
      }
    });
  }

  async _collectionExist(collectionName) {
    let connection = await this.mongo();

    let db = connection.db(this._db);
    let collections = await db.listCollections().toArray();

    return (collections.indexOf(collectionName) > -1);
  }

  /**
   * Retrieve the status of each migration.
   *
   * @returns {Promise<Array>} The state of each migration
   */
  async state() {
    let connection = await this.mongo();

    let db = connection.db(this._db);
    let exists = await this._collectionExist(this._collectionName);
    let collection = (exists ? db.collection(this._collectionName) : await db.createCollection(this._collectionName));

    let state = await collection.find({}, { sort: { executedOn: -1 } }).toArray();
    let migrations = fs.readdirSync(this._migrationsDir);

    for (let i = 0; i < migrations.length; i++) {
      let migrationName = path.parse(migrations[i]).name;
      let isPending = true;

      for (let n = 0; n < state.length; n++) {
        if (state[n].name === migrationName) {
          isPending = false;
          break;
        }
      }

      if (isPending) {
        state.push({
          name: migrationName,
          status: 'PENDING'
        });
      }
    }

    return state;
  }

  /**
   * Migrate the latest.
   *
   * @returns {Promise<Array>} All of the migrations that were executed
   */
  async migrate() {
    let connection = await this.mongo();

    let db = connection.db(this._db);
    let exists = await this._collectionExist(this._collectionName);
    let collection = (exists ? db.collection(this._collectionName) : await db.createCollection(this._collectionName));

    let migrations = fs.readdirSync(this._migrationsDir);
    let state = await this.state();
    let pending = [];
    let success = [];
    let executedOn = new Date().getTime();

    for (let i = 0; i < migrations.length; i++) {
      let migrationName = path.parse(migrations[i]).name;

      for (let n = 0; n < state.length; n++) {
        if (state[n].name === migrationName) {
          if (state[n].status === 'PENDING') {
            pending.push(migrations[i]);
          }
          break;
        }
      }
    }

    for (let i = 0; i < pending.length; i++) {
      let migrationPath = path.join(this.getMigrationsDirectory(), pending[i]);
      let migration = null;
      try {
        migration = require(migrationPath);
      } catch (error) {
        throw new CombineErrors([
          Error('Unable to find the migration at the specified path [' + migrationPath + ']'),
          error
        ]);
      }

      try {
        let result = await migration.up(connection, this._db);

        if (result instanceof Promise) {
          result = await result;
        }

        let migrationFile = path.parse(path.join(this.getMigrationsDirectory(), pending[i]));
        let migrationFileName = migrationFile.name;

        success.push({
          name: migrationFileName,
          status: 'EXECUTED',
          executedOn
        });
      } catch (error) {
        throw new CombineErrors([
          new Error('[' + pending[i] + '] failed to migrate.'),
          error
        ]);
      }
    }

    if (success.length > 0) {
      await collection.insertMany(success);
    }

    return success;
  }

  /**
   * Rollback previous migrations.
   *
   * @param {boolean} all If all is specified it will rollback all of the history regardless of batch
   * @returns {Promise<Array>} All of the migrations that were rolled back
   */
  async rollback(all) {
    let connection = await this.mongo();

    let db = connection.db(this._db);
    let exists = await this._collectionExist(this._collectionName);
    let collection = (exists ? db.collection(this._collectionName) : await db.createCollection(this._collectionName));

    let migrations = fs.readdirSync(this._migrationsDir);
    let state = await this.state();
    let rolledback = [];

    state = state.filter((k) => {
      if (k.status === 'EXECUTED') {
        return k;
      }
    });

    if (state.length > 0) {
      if (!all) {
        let lastBatchExecutedOn = state[0].executedOn;

        state = state.filter((k) => {
          if ((k.status === 'EXECUTED') && (k.executedOn === lastBatchExecutedOn)) {
            return k;
          }
        });
      }
    }

    for (let i = 0; i < migrations.length; i++) {
      let migrationName = path.parse(migrations[i]).name;

      for (let n = 0; n < state.length; n++) {
        if (state[n].name === migrationName) {
          let migrationPath = path.join(this.getMigrationsDirectory(), migrations[i]);
          let migration = null;
          try {
            migration = require(migrationPath);
          } catch (error) {
            throw new Error('Unable to find the migration at the specified path [' + migrationPath + ']');
          }

          try {
            let result = await migration.down(connection, this._db);

            if (result instanceof Promise) {
              result = await result;
            }

            let migrationFile = path.parse(path.join(this.getMigrationsDirectory(), migrations[i]));
            let migrationFileName = migrationFile.name;

            rolledback.push({
              name: migrationFileName
            });
          } catch (error) {
            throw new CombineErrors([
              new Error('[' + migrations[i] + '] failed to rollback.'),
              error
            ]);
          }

          break;
        }
      }
    }

    for (let i = 0; i < rolledback.length; i++) {
      await collection.deleteMany({ name: rolledback[i].name });
    }

    return rolledback;
  }

}
