'use strict';

import _ from 'lodash';
import fs from 'fs-extra';
import path from 'path';
import Chai from 'chai';
import Mogront from '../src/mogront';
import * as Database from '../src/database';
import DatabaseConfig from './config.json';
import CombineErrors from 'combine-errors';

let testOptions = Object.assign({
  collectionName: 'migrations',
  migrationsDir: path.join(process.cwd(), './test/migrations'),
  seedersDir: path.join(process.cwd(), './test/seeders')
}, DatabaseConfig);

describe('mogront', () => {

  before(function(done) {
    this.timeout(10000);

    let mogront = new Mogront(null, testOptions);

    // Clean the directories and recorded state if any exist
    mogront.mongo().then(function(connection) {
      return connection.db(testOptions.db).dropDatabase();
    }).then(function() {
      return mogront.dispose();
    }).then(function() {
      if (fs.existsSync(testOptions.migrationsDir)) {
        return fs.remove(testOptions.migrationsDir, done);
      } else {
        return done();
      }
    })
    .catch(function(error) {
      mogront.dispose().then(function(error2) {
        done(CombineErrors([error, error2]));
      }).catch(function(error2) {
        done(CombineErrors([error, error2]));
      });
    });
  });

  describe('instance', () => {
    it('should create a new {Mogront} instance without an instance of {MongoDB.MongoClient} present', function(done) {
      try {
        let mogront = new Mogront(null, testOptions);

        Chai.expect(mogront).to.be.an.instanceof(Mogront);

        mogront.dispose().then(() => {done()}).catch(done);
      } catch (error) {
        return done(new Error('An instance of {Mogront} could not be created'));
      }
    });

    it('should create a new {Mogront} instance with an instance of {MongoDB} present', async function() {
      try {
        let connection = await Database.getConnection(testOptions);
        let mogront = new Mogront(connection, testOptions);

        Chai.expect(mogront).to.be.an.instanceof(Mogront);

        return Promise.resolve();
      } catch (error) {
        return Promise.reject(error);
      }
    });
  });

  describe('migrations', () => {
    let newMigrationFile = null;

    it('should create a migration file with the specified name', function(done) {
      try {
        let mogront = new Mogront(null, testOptions);

        mogront.createMigration('create test collection').then(function(fileName) {
          if ((fileName.indexOf('create') > -1) && (fileName.indexOf('test') > -1) && (fileName.indexOf('collection') > -1)) {
            if (fs.existsSync(path.join(mogront.getMigrationsDirectory(), fileName))) {
              newMigrationFile = path.parse(path.join(mogront.getMigrationsDirectory(), fileName));
              return done();
            }
          }

          throw new Error('Unable to find the migration file');
        }).catch(done);
      } catch (error) {
        return done(error);
      }
    });

    it('should verify the state of the newly created migration', function(done) {
      try {
        let mogront = new Mogront(null, testOptions);

        mogront.state().then(function(state) {
          Chai.expect(state).to.be.an('array');
          Chai.expect(state).to.have.lengthOf(1);
          Chai.expect(_.some(state, { name: newMigrationFile.name, status: 'PENDING' })).to.be.true;

          return done();
        }).catch(done);
      } catch (error) {
        return done(error);
      }
    });

    it('should execute the newly created migration', function(done) {
      try {
        let mogront = new Mogront(null, testOptions);

        mogront.migrate().then(function(state) {
          Chai.expect(state).to.be.an('array');
          Chai.expect(state).to.have.lengthOf(1);
          Chai.expect(state[0]).to.have.property('name');
          Chai.expect(state[0].name).to.equal(newMigrationFile.name);
          Chai.expect(state[0].status).to.equal('EXECUTED');

          return done();
        }).catch(done);
      } catch (error) {
        return done(error);
      }
    });

    it('should not be able to find the file once it\'s been deleted', function(done) {
      try {
        let mogront = new Mogront(null, testOptions);

        let migrationFilePath = path.join(mogront.getMigrationsDirectory(), newMigrationFile.name + newMigrationFile.ext);

        if (fs.existsSync(migrationFilePath)) {
          fs.removeSync(migrationFilePath);
        }

        mogront.state().then(function(state) {
          return done(new Error('The state returned without error'));
        }).catch((error) => {
          return done();
        });
      } catch (error) {
        return done(error);
      }
    });

    it('should re-add the deleted migration, and rollback', function(done) {
      try {
        let mogront = new Mogront(null, testOptions);

        let migrationFilePath = path.join(mogront.getMigrationsDirectory(), newMigrationFile.name + newMigrationFile.ext);

        if (fs.existsSync(migrationFilePath)) {
          throw new Error('The migration file still exists');
        } else {
          let stream = fs.createReadStream(path.resolve(__dirname, '..', 'src', 'stubs', 'migrations', 'es6.js')).pipe(fs.createWriteStream(migrationFilePath));

          stream.on('error', done);
          stream.on('close', function () {
            mogront.rollback().then(() => {done()}).catch(done);
          });
        }
      } catch (error) {
        return done(error);
      }
    });

    it('should delete the migrations directory and then recreate it so that it clears out the previous migration', function(done) {
      try {
        if (fs.existsSync(testOptions.migrationsDir)) {
          fs.removeSync(testOptions.migrationsDir);
        }

        if (fs.existsSync(testOptions.migrationsDir)) {
          throw new Error('Unable to delete the migrations directory');
        } else {
          let mogront = new Mogront(null, testOptions); // Recreates the migrations directory

          if (fs.existsSync(testOptions.migrationsDir)) {
            return done();
          } else {
            throw new Error('Unable to recreate the migrations directory');
          }
        }
      } catch (error) {
        return done(error);
      }
    });

    it('should copy the "test_migrations/create_test_user.js" file into the migrations directory', function(done) {
      try {
        let mogront = new Mogront(null, testOptions);

        // Copy the file over into the migrations directory
        let fileName = 'create_test_user.js';
        let currentFilePath = path.resolve(__dirname, 'test_migrations', fileName);
        let newFilePath = path.join(testOptions.migrationsDir, fileName);

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

    it('should verify the state of the migration "create_test_user" migration before copying over the "create_test_profile"', function(done) {
      try {
        let mogront = new Mogront(null, testOptions);

        mogront.state().then(function(state) {
          Chai.expect(state).to.be.an('array');
          Chai.expect(state).to.have.lengthOf(1);
          Chai.expect(_.some(state, { name: 'create_test_profile', status: 'PENDING' })).to.be.false;
          Chai.expect(_.some(state, { name: 'create_test_user', status: 'PENDING' })).to.be.true;

          return done();
        }).catch(done);
      } catch (error) {
        return done(error);
      }
    });

    it('should execute the "test_migrations/create_test_user.js" file in the migrations directory', function(done) {
      try {
        let mogront = new Mogront(null, testOptions);

        let fileName = 'create_test_user.js';

        // Check the file exists
        if (fs.existsSync(path.join(mogront.getMigrationsDirectory(), fileName))) {
          mogront.migrate().then(function(state) {
            Chai.expect(state).to.be.an('array');
            Chai.expect(state).to.have.lengthOf(1);
            Chai.expect(state[0]).to.have.property('name');
            Chai.expect(state[0].name).to.equal('create_test_user');
            Chai.expect(state[0].status).to.equal('EXECUTED');

            return done();
          }).catch(done);
        } else {
          return done(new Error('The test_migration.js file was not found in the new file path'));
        }
      } catch (error) {
        return done(error);
      }
    });

    it('should now have the the test data within the "users" collection', function(done) {
      try {
        let mogront = new Mogront(null, testOptions);

        mogront.mongo().then(function(connection) {
          let db = connection.db(testOptions.db);
          let collection = db.collection('users');

          return collection.findOne({ hello: 'world' });
        }).then(function(result) {
          Chai.expect(result).to.be.an('object');
          Chai.expect(result).to.have.property('hello');
          Chai.expect(result).to.have.property('_id');
          Chai.expect(result.hello).to.equal('world');

          return done();
        }).catch(done);
      } catch (error) {
        return done(error);
      }
    });

    it('should copy the" test_migrations/create_test_profile.js" file into the migrations directory', function(done) {
      try {
        let mogront = new Mogront(null, testOptions);

        // Copy the file over into the migrations directory
        let fileName = 'create_test_profile.js';
        let currentFilePath = path.resolve(__dirname, 'test_migrations', fileName);
        let newFilePath = path.join(testOptions.migrationsDir, fileName);

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

    it('should verify the state of the migrations after only executing the "create_test_user" migration', function(done) {
      try {
        let mogront = new Mogront(null, testOptions);

        mogront.state().then(function(state) {
          Chai.expect(state).to.be.an('array');
          Chai.expect(state).to.have.lengthOf(2);
          Chai.expect(state).to.deep.include({ name: 'create_test_profile', status: 'PENDING' });
          Chai.expect(_.some(state, { name: 'create_test_user', status: 'EXECUTED' })).to.be.true;

          return done();
        }).catch(done);
      } catch (error) {
        return done(error);
      }
    });

    it('should execute the "test_migrations/create_test_profile.js" file in the migrations directory', function(done) {
      try {
        let mogront = new Mogront(null, testOptions);

        let fileName = 'create_test_profile.js';

        // Check the file exists
        if (fs.existsSync(path.join(mogront.getMigrationsDirectory(), fileName))) {
          mogront.migrate().then(function(state) {
            Chai.expect(state).to.be.an('array');
            Chai.expect(state).to.have.lengthOf(1);
            Chai.expect(state[0]).to.have.property('name');
            Chai.expect(state[0].name).to.equal('create_test_profile');
            Chai.expect(state[0].status).to.equal('EXECUTED');

            return done();
          }).catch(done);
        } else {
          return done(new Error('The test_migration.js file was not found in the new file path'));
        }
      } catch (error) {
        return done(error);
      }
    });

    it('should verify the state of the migrations after both migrations have been executed', function(done) {
      try {
        let mogront = new Mogront(null, testOptions);

        mogront.state().then(function(state) {
          Chai.expect(state).to.be.an('array');
          Chai.expect(state).to.have.lengthOf(2);
          Chai.expect(_.some(state, { name: 'create_test_profile', status: 'EXECUTED' })).to.be.true;
          Chai.expect(_.some(state, { name: 'create_test_user', status: 'EXECUTED' })).to.be.true;

          return done();
        }).catch(done);
      } catch (error) {
        return done(error);
      }
    });

    it('should rollback the last batch of migrations', function(done) {
      try {
        let mogront = new Mogront(null, testOptions);

        let fileName = 'create_test_profile.js';

        // Check the file exists
        mogront.rollback().then(function(state) {
          Chai.expect(state).to.be.an('array');
          Chai.expect(state).to.have.lengthOf(1);
          Chai.expect(state[0]).to.have.property('name');
          Chai.expect(state[0].name).to.equal('create_test_profile');

          return mogront.mongo();
        }).then(function(connection) {
          let db = connection.db(testOptions.db);
          let collection = db.collection('profiles');

          return collection.findOne({ hello: 'world' });
        }).then(function(result) {
          Chai.expect(result).to.be.a('null');

          return done();
        }).catch(done);
      } catch (error) {
        return done(error);
      }
    });

    it('should verify the state of the migrations after the last batch of migrations were rolled back', function(done) {
      try {
        let mogront = new Mogront(null, testOptions);

        mogront.state().then(function(state) {
          Chai.expect(state).to.be.an('array');
          Chai.expect(state).to.have.lengthOf(2);
          Chai.expect(state).to.deep.include({ name: 'create_test_profile', status: 'PENDING' });
          Chai.expect(_.some(state, { name: 'create_test_user', status: 'EXECUTED' })).to.be.true;

          return done();
        }).catch(done);
      } catch (error) {
        return done(error);
      }
    });

    it('should re-execute the "test_migrations/create_test_profile.js" file in the migrations directory', function(done) {
      try {
        let mogront = new Mogront(null, testOptions);

        let fileName = 'create_test_profile.js';

        // Check the file exists
        if (fs.existsSync(path.join(mogront.getMigrationsDirectory(), fileName))) {
          mogront.migrate().then(function(state) {
            Chai.expect(state).to.be.an('array');
            Chai.expect(state).to.have.lengthOf(1);
            Chai.expect(state[0]).to.have.property('name');
            Chai.expect(state[0].name).to.equal('create_test_profile');
            Chai.expect(state[0].status).to.equal('EXECUTED');

            return done();
          }).catch(done);
        } else {
          return done(new Error('The test_migration.js file was not found in the new file path'));
        }
      } catch (error) {
        return done(error);
      }
    });

    it('should verify the state of the migrations after both migrations have been re-executed', function(done) {
      try {
        let mogront = new Mogront(null, testOptions);

        mogront.state().then(function(state) {
          Chai.expect(state).to.be.an('array');
          Chai.expect(state).to.have.lengthOf(2);
          Chai.expect(_.some(state, { name: 'create_test_profile', status: 'EXECUTED' })).to.be.true;
          Chai.expect(_.some(state, { name: 'create_test_user', status: 'EXECUTED' })).to.be.true;

          return done();
        }).catch(done);
      } catch (error) {
        return done(error);
      }
    });

    it('should rollback all of the migrations regardless of batch', function(done) {
      try {
        let mogront = new Mogront(null, testOptions);

        let fileName = 'create_test_profile.js';
        let db = null;

        // Check the file exists
        mogront.rollback(true).then(function(state) {
          Chai.expect(state).to.be.an('array');
          Chai.expect(state).to.have.lengthOf(2);
          Chai.expect(_.some(state, { name: 'create_test_profile' })).to.be.true;
          Chai.expect(_.some(state, { name: 'create_test_user' })).to.be.true;

          return mogront.mongo();
        }).then(function(connection) {
          db = connection.db(testOptions.db);

          let profileCollection = db.collection('profiles');

          return profileCollection.findOne({ hello: 'world' });
        }).then(function(result) {
          Chai.expect(result).to.be.a('null');

          let userCollection = db.collection('users');

          return userCollection.findOne({ hello: 'world' });
        }).then(function(result) {
          Chai.expect(result).to.be.a('null');
          return done();
        }).catch(done);
      } catch (error) {
        return done(error);
      }
    });

    it('should verify the state of the migrations after both migrations have been rolledback', function(done) {
      try {
        let mogront = new Mogront(null, testOptions);

        mogront.state().then(function(state) {
          Chai.expect(state).to.be.an('array');
          Chai.expect(state).to.have.lengthOf(2);
          Chai.expect(_.some(state, { name: 'create_test_profile', status: 'PENDING' })).to.be.true;
          Chai.expect(_.some(state, { name: 'create_test_user', status: 'PENDING' })).to.be.true;

          return done();
        }).catch(done);
      } catch (error) {
        return done(error);
      }
    });
  });

});
