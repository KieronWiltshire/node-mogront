#!/usr/bin/env node
'use strict';

import fs from 'fs';
import Monk from 'monk';
import {default as createDebugger} from 'debug';

const debug = createDebugger('mogront:bootstrap');

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
    if (monk instanceof Monk) {
      this._monk = monk;
    } else {
      throw new Exception('The first argument needs to be an instance of {Monk}.')
    }

    collectionName = collectionName.toString();

    if (collectionName.length > 0 && /^(?![0-9]*$)[a-zA-Z0-9]+$/.test(collectionName)) {
      this._collectionName = collectionName;
    } else {
      throw new Exception('The specified collection name cannot conform to mongodb\'s specifications')
    }

    this._migrationsDir = migrationsDir;
  }

}
