'use strict';

import Chai from 'chai';
import ChaiHTTP from 'chai-http';
import Bootit from '../src/bootit';
import Express from 'express';

describe('bootit', function() {

  before(function(done) {
    Chai.use(ChaiHTTP);
    done();
  });

  it('should bootstrap a http server and make a basic request', function(done) {
    let app = Express();

    app.use('/', function(req, res) {
      res.json({
        hello: 'world'
      });
    });

    let server = Bootit.start(app);

    if (server) {
      Chai.request(server)
        .get('/')
        .end(function (error, response) {
          Chai.expect(response).to.be.json;
          Chai.expect(response.body).to.have.property('hello');
          Chai.expect(response.body.hello).to.equal('world');
          done();
        });
    } else {
      done(new Error('Server was not bootstrapped'));
    }
  });

});
