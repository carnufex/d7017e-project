'use strict';
var features_helper = require('../features/features_helper');
var assert = require('assert');

// performs a deep copy assuming a is simple (no functions or circular references)
function clone(a) {
   return JSON.parse(JSON.stringify(a));
}

describe('Test passAllMandatoryTests', () => {

    const input = {
        "results": {
            "io": [
                {
                    "id": "59f8a1401ac36c0762eb46ab",
                    "ok": true,
                    "stderr": "",
                    "time": 81440918
                },
                {
                    "id": "59f8a1541ac36c0762eb46ac",
                    "ok": true,
                    "stderr": "",
                    "time": 65636960
                }
            ],
            "prepare": "",
            "code_size": 20,
            "optional_tests": [
                {
                    "id": "59f8a1621ac36c0762eb46ad",
                    "ok": true,
                    "stderr": "",
                    "time": 23770657
                }
            ],
            "lint": "/tmp/tmp-21okZiNRuZOCOu.tmp:1:21: W292 no newline at end of file\n"
        }
    };

    it('should pass the mandatory tests', () => {
        assert(features_helper.passAllMandatoryTests(input));
    });

    it('should pass even if optional tests fail', () => {
        let i = clone(input);
        i.results.optional_tests[0].ok = false;
        assert(features_helper.passAllMandatoryTests(i));
    });

    let fail_one_test = (n) => {
        let i = clone(input);
        i.results.io[n].ok = false;
        console.log(i.results);
        assert(!features_helper.passAllMandatoryTests(i));
    };

    for (let n = 0; n < input.results.io.length; n++) {
        it(`should fail if mandatory test ${n} fails`, fail_one_test.bind(null, n));
    }
    
});

