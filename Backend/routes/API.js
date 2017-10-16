var Assignment = require('../models/schemas').Assignment;
var Test = require('../models/schemas').Test;

var request = require('request');

var queries = require('../lib/queries')

module.exports = function(router) {

	router.get('/', function (req, res) {
    queries.getTestsFromAssignment('59e46c453867bc21d4ca69ed', function(tests) {
	   console.log("/ route retrieved");
	   console.log(tests)
	   res.send('Hello World');
    });
});

/*
 * /test/ Endpoints
 */ 
    
	router.post('/test', function (req, res) {
		var lang = req.body.lang;
		var code = req.body.code;
		var assignment_id = req.body.assignment_id;

		//Get tests from our database
        queries.getTestsFromAssignment(assignment_id, function(tests) {
    		/* var assignment = GetTest(test_id)
			//console.log(tests)
			//jsonPackage = {'lang': lang, 'code': code, 'tests': tests}
			//console.log(jsonPackage) */
			request.post(
				'http://130.240.5.118:9100',
				{ json: {
				'lang' : lang,
				'code' : code,
				'tests' : tests
		    }},
		    function (error, response, body){
		    	console.log("asdf")
		    	console.log(body)
		    	res.set('Content-Type', 'application/json');
		    	res.send(body);
		    });
        });
	});

    // TEMPORARY FUNCTION WHILE NOT CONNECTED TO TESTER
	router.post('/tester', function (req, res) {
		res.json(JSON.stringify({
		    'results': [
		        {'id':0, 'time': 45, 'ok': true},
		    ]
		}));
	});

    //TEST INSERT DB
router.get('/temp' , function(req, res) {
	var t1 = new Test({
		stdin: '', 
		stdout: 'Detta är ett program som räknar hur mycket kaffe du dricker.\nJag heter Anna andersson\nJag har druckit 2 koppar kaffe idag.\n'
	});



    t1.save(function(err, savedt1) {
        if (err) {
        	console.log('Error' + err);
        	return;
    	}
    		
    	
	    	console.log("T1")
	    	console.log(savedt1)


	    	var a1 = new Assignment({
	    		assignmentName: 'assignment-kaffe',
	    		tests: [savedt1]
	    	});

	    	a1.save(function(err, saveda1) {
	    		if (err) {
	    			console.log('Error: ' + err);
	    			return;
	    		}

	    		console.log(saveda1)

				console.log("Query DB")

			    Assignment.findOne({ '_id': saveda1._id}, function(err, assignments) {
			        if (err) return console.log(err);
			        		console.log(assignments);
			    });

	    	});
	    });

    
/*router.get('/temp' , function(req, res) {
	var t1 = new Test({
		stdin: '', 
		stdout: 'Detta är ett program som räknar hur mycket kaffe du dricker.\n'
	});
	var t2 = new Test({
		stdin: '', 
		stdout: 'Jag heter Anna andersson\n'
	}); 
	var t3 = new Test({
		stdin: '', 
		stdout: 'Jag har druckit 2 koppar kaffe idag.\n'
	}); 


    t1.save(function(err, savedt1) {
        if (err) {
        	console.log('Error' + err);
        	return;
    	}
    	t2.save(function(err, savedt2) {
    		if (err) {
    			console.log('Error' + err);
    			return;
    		}
    		t3.save(function(err, savedt3) {
    			if (err) {
    				console.log('Error' + err)
    				return;
    			}
    		
    	
	    	console.log("T1")
	    	console.log(savedt1)
	    	console.log("T2")
	    	console.log(savedt2)
	    	console.log("T3")
	    	console.log(savedt3)

	    	var a1 = new Assignment({
	    		assignmentName: 'assignment-kaffe',
	    		tests: [savedt1, savedt2, savedt3]
	    	});

	    	a1.save(function(err, saveda1) {
	    		if (err) {
	    			console.log('Error: ' + err);
	    			return;
	    		}

	    		console.log(saveda1)

				console.log("Query DB")

			    Assignment.findOne({ '_id': saveda1._id}, function(err, assignments) {
			        if (err) return console.log(err);
			        		console.log(assignments);
			    });

	    	});
	    });
	});
    });*/

/*router.get('/temp' , function(req, res) {
	var t1 = new Test({
		stdin: '', 
		stdout: 'Detta är ett program som räknar hur mycket kaffe du dricker.\n'
	});
	var t2 = new Test({
		stdin: '', 
		stdout: 'Jag heter Anna andersson\n'
	}); 
	var t3 = new Test({
		stdin: '', 
		stdout: 'Jag har druckit 2 koppar kaffe idag.\n'
	}); 


    t1.save(function(err, savedt1) {
        if (err) {
        	console.log('Error' + err);
        	return;
    	}
    	t2.save(function(err, savedt2) {
    		if (err) {
    			console.log('Error' + err);
    			return;
    		}
    	
	    	console.log("T1")
	    	console.log(savedt1)
	    	console.log("T2")
	    	console.log(savedt2)

	    	var a1 = new Assignment({
	    		assignmentName: 'assignment-helloworld',
	    		tests: [savedt1, savedt2]
	    	});

	    	a1.save(function(err, saveda1) {
	    		if (err) {
	    			console.log('Error: ' + err);
	    			return;
	    		}

	    		console.log(saveda1)

				console.log("Query DB")

			    Assignment.findOne({ '_id': saveda1._id}, function(err, assignments) {
			        if (err) return console.log(err);
			        		console.log(assignments);
			    });

	    	});
	    });
    });*/    

});
/*
 * /users/ Endpoints
 */
 	router.get('/users', function (req, res) {
 		var ids = req.query.ids;
 		if(!ids) {
 			res.sendStatus(404);
 			return
 		}
 		res.send("/users?ids=" + ids + " GET Endpoint");
 	});

	router.get('/users/:user_id', function (req, res) {
		var user_id = req.params.user_id;
		res.send("/users/" + user_id + " GET Endpoint");
	});

	router.delete('/users/:user_id', function (req, res) {
		var user_id = req.params.user_id;
		res.send("/users/" + user_id + " DELETE Endpoint");
	});

	router.post('/users/register', function (req, res) {
		res.send("/users/register POST Endpoint");
	});

	router.get('/users/:user_id/submissions', function (req, res) {
		var user_id = req.params.user_id;
		res.send("/users/" + user_id + "/submissions GET Endpoint");
	});

	router.get('/users/:user_id/courses', function (req, res) {
		var user_id = req.params.user_id;
		res.send("/users/" + user_id + "/courses GET Endpoint");
	});

	router.post('/users/:user_id/courses', function (req, res) {
		var user_id = req.params.user_id;
		res.send("/users/" + user_id + "/courses POST Endpoint");
	});

	router.get('/users/:user_id/courses/:course_id/submissions', function (req, res) {
		var user_id = req.params.user_id;
		var course_id = req.params.course_id;
		res.send("/users/" + user_id + "/courses/" + course_id + "/submissions GET Endpoint");
	});




/*
 * /courses/ Endpoints
 */
 	router.get('/courses/:course_id/users', function (req, res) {
 		var course_id = req.params.course_id;
		res.send("/courses/" + course_id + "/users GET Endpoint");
	});

 	router.get('/courses/:course_id/submissions', function (req, res) {
 		var course_id = req.params.course_id;
		res.send("/courses/" + course_id + "/submissions GET Endpoint");
	});

 	router.post('/courses/:course_id/submissions', function (req, res) {
 		var course_id = req.params.course_id;
		res.send("/courses/" + course_id + "/submissions POST Endpoint");
	});

	router.get('/courses/:course_id/submissions/:submission_id', function (req, res) {
 		var course_id = req.params.course_id;
 		var submission_id = req.params.submissions_id
		res.send("/courses/" + course_id + "/submissions/" + submission_id + " GET Endpoint");
	});

	router.get('/courses/:course_id/tests', function (req, res) {
 		var course_id = req.params.course_id;
		res.send("/courses/" + course_id + "/tests GET Endpoint");
	});

	router.get('/courses/:course_id/tests/:test_id', function (req, res) {
 		var course_id = req.params.course_id;
 		var test_id = req.params.test_id
		res.send("/courses/" + course_id + "/tests/" + test_id + " GET Endpoint");
	});

};
