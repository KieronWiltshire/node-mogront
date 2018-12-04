#! /usr/bin/env node

import fs from 'fs';
import path from 'path';
import program from 'commander';
import Mogront from '../mogront';
import Database from '../database';
import colors from 'colors';

function getConfig(specifiedPath) {
  if (specifiedPath) {
    let filePath = path.join(process.cwd(), specifiedPath);

    if (fs.existsSync(filePath)) {
      return require(filePath);
    } else {
      throw new Error('the specified config file does not exist.');
    }
  } else {
    throw new Error('--config option is required');
  }
}

program
  .version('1.0.0', '-v, --version')
  .option('-c, --config <path>', 'specify the configuration file to load')
  .action(console.log);

program
  .command('create <name>')
  .description('create a migration file')
  .option("-t, --template <stub>", "specify the template to create the migration file from", /^(vanilla|es6)$/i, 'vanilla')
  .action(function(name){
    let config = getConfig(program.args[1].parent.config);
    let options = {
      template: program.args[1].template
    };

    let mogront = new Mogront(null, config);

    mogront.create(name, options).then((fileName) => {
      console.log('The migration '.green + name.yellow + ' has been created as '.green + '[' + fileName.yellow + ']' + ' using the '.green + options.template.yellow + ' template'.green);
      return mogront.dispose();
    }).then(() => {
      process.exit(0);
    }).catch((error) => { console.error(error); process.exit(1); });
  });

program
  .command('state')
  .description('shows the status of all the migrations')
  .option("--pending", "show only the pending migrations")
  .option("--executed", "show only the executed migrations")
  .action(function() {
    let config = getConfig(program.args[0].parent.config);
    let mogront = new Mogront(null, config);

    mogront.state().then((state) => {
      state.forEach((k) => {
        if (program.args[0].pending && !program.args[0].executed) {
          if (k.status === 'PENDING') {
            console.log(k.name.yellow + ' is currently ' + k.status.gray);
          }
        } else if (program.args[0].executed && !program.args[0].pending) {
          if (k.status === 'EXECUTED') {
            console.log(k.name.yellow + ' has been ' + k.status.gray);
          }
        } else {
          if (k.status === 'PENDING') {
            console.log(k.name.yellow + ' is currently ' + k.status.gray);
          }
          if (k.status === 'EXECUTED') {
            console.log(k.name.yellow + ' has been ' + k.status.gray);
          }
        }
      });
      return mogront.dispose();
    }).then(() => {
      process.exit(0);
    }).catch((error) => { console.error(error); process.exit(1); });
  });

program
  .command('migrate')
  .description('execute the migrations')
  .action(function() {
    let config = getConfig(program.args[0].parent.config);
    let mogront = new Mogront(null, config);

    mogront.migrate().then((state) => {
      state.forEach((k) => {
        console.log(k.name.green + ' has been migrated successfully.');
      });
      return mogront.dispose();
    }).then(() => {
      process.exit(0);
    }).catch((error) => { console.error(error); process.exit(1); });
  });

program
  .command('rollback')
  .description('rollback the last batch of migrations')
  .option('-a, --all', 'rollback all of the migrations')
  .action(function() {
    let config = getConfig(program.args[0].parent.config);
    let mogront = new Mogront(null, config);

    mogront.rollback(program.args[0].all).then((state) => {
      state.forEach((k) => {
        console.log(k.name.green + ' has been rolled back successfully.');
      });
      return mogront.dispose();
    }).then(() => {
      process.exit(0);
    }).catch((error) => { console.error(error); process.exit(1); });
  });

program.parse(process.argv);
