var mongoose = require('mongoose');
var schemas = require('./models/schemas.js');
mongoose.connect('mongodb://130.240.5.132:27017');

function insertTest() {
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'))
	db.once('open', function() {
		var Test = mongoose.model('Test', schemas.testSchema);
		var Assignment = mongoose.model('Assignment', schemas.assignmentSchema);
		var a1 = new Assignment({ tests: [new Test({ stdin: '', stdout: 'hello world\n' })] });
		a1.save(function(err, a1) {
			if (err) return console.error(err);
		});

		Assignment.find(function(err, assignments) {
			if (err) return console.log(err);
			console.log(assignments);
		});
	});
}
//
module.exports.insertTest = insertTest
