'use strict';

var testerCom = require('../../lib/tester_communication');
var errors = require('../../lib/errors');
var request = require('supertest');
var auth = require('../../lib/authentication.js');
var logger = require('../../lib/logger.js');

module.exports = function(router) {

    //get Tester's supported languages
    router.get('/languages', function(req, res) {
        testerCom.getTesterLanguages().then(function(languages) {
            // Passthrough from Tester. Variable langauges is already a json
            res.setHeader('Content-Type', 'application/json');
            return res.send(languages);
        }).catch(err => {
            logger.log("error",err);
        });
    });

};
