'use strict';

import fs from 'fs-extra';
import path from 'path';
import Chai from 'chai';
import Mogront from '../src/mogront';
import {default as Database, hasDatabaseConnection} from './database';

let defaultOptions = {
  collectionName: 'mogront',
  migrationsDir: path.join('./test/migrations'),
  seedersDir: path.join('./test/seeders')
};

describe('mogront', function() {

  before(function(done) {
    this.timeout(10000);

    let migrationsDirPath = path.join(process.cwd(), defaultOptions.migrationsDir);

    while (!hasDatabaseConnection) {} // Wait for the database to connect

    // Clean the directories and recorded state if any exist
    Database.get(defaultOptions.collectionName).remove({})
    .then(function() {
      if (fs.existsSync(migrationsDirPath)) {
        fs.remove(migrationsDirPath, (error) => {
          done(error);
        });
      } else {
        done();
      }
    }).catch(done);
  });

  it('should not create a new {Mogront} instance without an instance of {Monk} present', function(done) {
    try {
      let mogront = new Mogront(null, defaultOptions);
      done(new Error('A new {Monk} instance was created'));
    } catch (error) {
      done();
    }
  });

  it('should create a new {Mogront} instance with an instance of {Monk} present', function(done) {
    try {
      let mogront = new Mogront(Database, defaultOptions);
      done();
    } catch (error) {
      done(error);
    }
  });

  it('should create a migration file with the specified name', function(done) {
    try {
      let mogront = new Mogront(Database, defaultOptions);
      let fileName = mogront.create('create_test_collection');

      if ((fileName.indexOf('create') > -1) && (fileName.indexOf('test') > -1) && (fileName.indexOf('collection') > -1)) {
        if (fs.existsSync(path.join(mogront.getMigrationsDirectory(), fileName))) {
          return done();
        }
      }

      throw new Error('Unable to find the migration file');
    } catch (error) {
      done(error);
    }
  });

  // it('should ...', function(done) {
  //   try {
  //     let mogront = new Mogront(Database, defaultOptions);
  //
  //     mogront.migrate().then(function(state) {
  //       return mogront.rollback(true);
  //     }).then(function() {
  //       done();
  //     }).catch(done);
  //   } catch (error) {
  //     done(error);
  //   }
  // });

});
