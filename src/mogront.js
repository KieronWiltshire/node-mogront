'use strict';

import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import Monk from 'monk';
import ChangeCase from 'change-case';
import {default as createDebugger} from 'debug';

const debug = createDebugger('mogront');

/**
 *
 */
export default class Mogront {

  /**
   * Create a new {Mogront} instance.
   */
  constructor(monk, {
    collectionName = 'mogront', // The name of the collection that will store migration state
    migrationsDir = './migrations' // Relative path to the migrations directory
  } = {}) {
    collectionName = collectionName.toString();
    migrationsDir = path.join(process.cwd(), migrationsDir);

    if (!(monk instanceof Monk)) {
      throw new Exception('The first argument needs to be an instance of {Monk}.')
    }

    if (collectionName.length <= 0 && !(/^(?![0-9]*$)[a-zA-Z0-9]+$/.test(collectionName))) {
      throw new Exception('The specified collection name cannot conform to mongodb\'s specifications')
    }

    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir);
    }

    this._monk = monk;
    this._collectionName = collectionName;
    this._migrationsDir = migrationsDir;
    this._collection = monk.create(collectionName);
  }

  /**
   * Retrieve the {Monk} instance.
   *
   * @returns {Monk}
   */
  monk() {
    return this._monk;
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
  create(name) {
    name = ChangeCase.snakeCase(name.toLowerCase());

    let creationTimestamp = new Date();
    let creationDate = ('0' + creationTimestamp.getDate()).slice(-2);
    let creationMonth = ('0' + (creationTimestamp.getMonth() + 1)).slice(-2);
    let creationYear = creationTimestamp.getFullYear();
    let creationHour = ('0' + creationTimestamp.getHours()).slice(-2);
    let creationMinute = ('0' + creationTimestamp.getMinutes()).slice(-2);
    let creationSecond = ('0' + creationTimestamp.getSeconds()).slice(-2);

    let fileName = creationYear + '_' + creationMonth + '_' + creationDate + '_' + creationHour + '_' + creationMinute + '_' + creationSecond + '_' + name;
    let fileExtension = '.js';
    let filePath = path.join(this._migrationsDir, fileName + fileExtension);

    if (fs.existsSync(filePath)) {
      throw new Error('The file to generate seems to have already been created, [' + filePath + ']');
    } else {
      fs.createReadStream(path.resolve(__dirname, 'templates', 'vanilla.js')).pipe(fs.createWriteStream(filePath));
      return (fileName + fileExtension);
    }
  }

  /**
   * Retrieve the status of each migration.
   *
   * @returns {Promise<Object>}
   */
  async state() {
    let collection = await this._monk.create(this._collectionName);
    let state = await collection.find({}, { sort: { executedOn: -1 } });
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
   * @returns {void}
   */
  async migrate() {
    let collection = await this._monk.create(this._collectionName);
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
      let migration = require(path.join(this.getMigrationsDirectory(), pending[i]));

      try {
        let result = migration.up(this._monk);

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
        throw new Error('[' + pending[i] + '] failed to migrate.');
        break;
      }
    }

    await collection.insert(success);

    return success;
  }

  /**
   * Rollback previous migrations.
   *
   * @param {boolean} all If all is specified it will rollback all of the history regardless of batch
   * @returns {void}
   */
  async rollback(all) {
    /**
     * TODO:  Sort the migrations by it's timestamp which is used as a batch identifier, and rollback
     *        the migrations that match the last specified timestamp.
     *
     *        If all is specified, ignore the timestamps and rollback each migration.
     */
    let collection = await this._monk.create(this._collectionName);
    let migrations = fs.readdirSync(this._migrationsDir);
    let state = await this.state();
    let rolledback = [];

    if (state.length > 0) {
      state = state.filter((k) => {
        if (k.status === 'EXECUTED') {
          return k;
        }
      });

      if (!all) {
        let lastBatchExecutedOn = state[0].executedOn;

        state = state.filter((k) => {
          if ((k.status === 'EXECUTED') && (k.executedOn === lastBatchExecutedOn)) {
            return k;
          }
        })
      }
    }

    for (let i = 0; i < migrations.length; i++) {
      let migrationName = path.parse(migrations[i]).name;

      for (let n = 0; n < state.length; n++) {
        if (state[n].name === migrationName) {
          let migration = require(path.join(this.getMigrationsDirectory(), migrations[i]));

          try {
            let result = migration.down(this._monk);

            if (result instanceof Promise) {
              result = await result;
            }

            let migrationFile = path.parse(path.join(this.getMigrationsDirectory(), migrations[i]));
            let migrationFileName = migrationFile.name;

            rolledback.push({
              name: migrationFileName
            });
          } catch (error) {
            throw new Error('[' + migrations[i] + '] failed to rollback.');
            break;
          }

          break;
        }
      }
    }

    for (let i = 0; i < rolledback.length; i++) {
      await collection.remove({ name: rolledback[i].name });
    }

    return rolledback;
  }

}
