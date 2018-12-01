'use strict';

import fs from 'fs-extra';
import path from 'path';
import Chai from 'chai';
import Mogront from '../src/mogront';
import {default as Database, hasDatabaseConnection} from './database';

let testOptions = {
  collectionName: 'migrations',
  migrationsDir: path.join('./test/migrations')
};

describe('mogront', function() {

  before(function(done) {
    this.timeout(10000);

    let migrationsDirPath = path.join(process.cwd(), testOptions.migrationsDir);

    while (!hasDatabaseConnection) {} // Wait for the database to connect

    // Clean the directories and recorded state if any exist
    Database.get(testOptions.collectionName).remove({})
    .then(function() {
      if (fs.existsSync(migrationsDirPath)) {
        fs.remove(migrationsDirPath, done);
      } else {
        return done();
      }
    }).catch(done);
  });

  it('should not create a new {Mogront} instance without an instance of {Monk} present', function(done) {
    try {
      let mogront = new Mogront(null, testOptions);
      return done(new Error('A new {Monk} instance was created'));
    } catch (error) {
      return done();
    }
  });

  it('should create a new {Mogront} instance with an instance of {Monk} present', function(done) {
    try {
      let mogront = new Mogront(Database, testOptions);
      return done();
    } catch (error) {
      return done(error);
    }
  });

  it('should create a migration file with the specified name', function(done) {
    try {
      let mogront = new Mogront(Database, testOptions);

      mogront.create('create test collection').then(function(fileName) {
        if ((fileName.indexOf('create') > -1) && (fileName.indexOf('test') > -1) && (fileName.indexOf('collection') > -1)) {
          if (fs.existsSync(path.join(mogront.getMigrationsDirectory(), fileName))) {
            return done();
          }
        }

        throw new Error('Unable to find the migration file');
      }).catch(done);
    } catch (error) {
      return done(error);
    }
  });

  it('should clear the migrations directory', function(done) {
    try {
      // Clear the directory to prevent an empty migration from running and giving an error
      let migrationsDirPath = path.join(process.cwd(), testOptions.migrationsDir);

      if (fs.existsSync(migrationsDirPath)) {
        fs.removeSync(migrationsDirPath);
      }

      let mogront = new Mogront(Database, testOptions); // Recreates the migrations directory

      return done();
    } catch (error) {
      return done(error);
    }
  });

  it('should copy the test_migrations/create_test_user.js file into the migrations directory', function(done) {
    try {
      let mogront = new Mogront(Database, testOptions);

      // Copy the file over into the migrations directory
      let fileName = 'create_test_user.js';
      let currentFilePath = path.resolve(__dirname, 'test_migrations', fileName);
      let newFilePath = path.join(process.cwd(), testOptions.migrationsDir, fileName);

      /**
       * Create the file.
       *
       * There is no need to check if the file already exists withion the directory
       * as the directory shouldn't exist. It is removed before the tests are executed.
       */
      let stream = fs.createReadStream(currentFilePath).pipe(fs.createWriteStream(newFilePath));

      // Catch error on write stream
      stream.on('error', done);

      // Continue
      stream.on('close', done);
    } catch (error) {
      return done(error);
    }
  });

  it('should execute the test_migrations/create_test_user.js file in the migrations directory', function(done) {
    try {
      let mogront = new Mogront(Database, testOptions);

      let fileName = 'create_test_user.js';

      // Check the file exists
      if (fs.existsSync(path.join(mogront.getMigrationsDirectory(), fileName))) {
        mogront.migrate().then(function(success) {
          // TODO: check status
          done();
        }).catch(done);
      } else {
        return done(new Error('The test_migration.js file was not found in the new file path'));
      }
    } catch (error) {
      return done(error);
    }
  });

  it('should copy the test_migrations/create_test_profile.js file into the migrations directory', function(done) {
    try {
      let mogront = new Mogront(Database, testOptions);

      // Copy the file over into the migrations directory
      let fileName = 'create_test_profile.js';
      let currentFilePath = path.resolve(__dirname, 'test_migrations', fileName);
      let newFilePath = path.join(process.cwd(), testOptions.migrationsDir, fileName);

      /**
       * Create the file.
       *
       * There is no need to check if the file already exists withion the directory
       * as the directory shouldn't exist. It is removed before the tests are executed.
       */
      let stream = fs.createReadStream(currentFilePath).pipe(fs.createWriteStream(newFilePath));

      // Catch error on write stream
      stream.on('error', done);

      // Continue
      stream.on('close', done);
    } catch (error) {
      return done(error);
    }
  });

  it('should execute the test_migrations/create_test_profile.js file in the migrations directory', function(done) {
    try {
      let mogront = new Mogront(Database, testOptions);

      let fileName = 'create_test_profile.js';

      // Check the file exists
      if (fs.existsSync(path.join(mogront.getMigrationsDirectory(), fileName))) {
        mogront.migrate().then(function(success) {
          // TODO: check status
          done();
        }).catch(done);
      } else {
        return done(new Error('The test_migration.js file was not found in the new file path'));
      }
    } catch (error) {
      return done(error);
    }
  });


});
