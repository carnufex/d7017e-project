'use strict';

var testerCom = require('../../lib/tester_communication');
var errors = require('../../lib/errors');
var request = require('supertest');

const TESTER_IP = 'http://130.240.5.118:9100';

module.exports = function(router) {

    //Retrieve tests from db and send them to tester
    router.post('/test', function(req, res) {

        var user_id = req.body.user_id;
        var lang = req.body.lang;
        var code = req.body.code;
        var assignment_id = req.body.assignment_id;

        testerCom.validateCode(user_id, lang, code, assignment_id, res);
    });

    router.get('/languages', function(req, res) {
        testerCom.getTesterLanguages().then(function(languages) {
            res.json(languages);
            res.send();
        });
    });

    // Test to send easy error messages
    router.get('/errortest', function (req, res) {
        res.status(errors.TEST.code).send(errors.TEST.msg);
    });

};
