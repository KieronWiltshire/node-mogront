#!/usr/bin/env node
'use strict';

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
    name = ChangeCase.snakeCase(name);

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

    /**
     * TODO:  Create a javascript file with the specified name in the migrations directory
     *        with a default structure copied over from a template. It should include and up
     *        and a down method.
     */

    if (fs.existsSync(filePath)) {
      throw new Error('The file to generate seems to have already been created, [' + filePath + ']');
    } else {
      fs.createReadStream(path.resolve(__dirname, 'templates', 'vanilla.js')).pipe(fs.createWriteStream(filePath));
    }
  }

  /**
   * Retrieve the status of each migration.
   *
   * @returns {Promise<Object>}
   */
  async status() {
    /**
     * TODO:  Read the migrations directory and compare it to the state stored in the database
     *        and then provide their status whether it be pending or executed.
     *
     *        It would also be a good idea to return the timestamp for each migration to be
     *        used as a batch identifier as multiple migrations should have the same timestamp
     *        which will show when they were executed, thus giving them the same batch identifier.
     */
  }

  /**
   * Migrate the latest.
   *
   * @returns {void}
   */
  async migrate() {
    /**
     * TODO:  Retrieve the status of each migration, generate a timestamp and then execute the
     *        migrations that are pending, providing the timestamp as it's batch identifier.
     */
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
  }

}
