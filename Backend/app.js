'use strict';

var express = require('express'); //Routes package
var mongoose = require('mongoose'); //Database communication
var bodyParser = require('body-parser');
var passport = require('passport'); //authentication
var cors = require('cors');
var config = require('config');
var logger = require('./logger'); //Use Logger

var app = express();

initApp();

//mongoose.set('debug', true);
process.title = 'd7017e-backend';
process.env.JWT_SECRET_KEY = 'supersecret';
process.env.JWT_AUTH_HEADER_PREFIX = 'bearer';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
app.use(passport.initialize());
app.use(cors({origin: '*'}));

//defining routes
var auth = express.Router();
require('./routes/auth')(auth);
app.use('/auth', auth);

var users = express.Router();
require('./routes/api/users')(users);
app.use('/api/users', users);

var courses = express.Router();
require('./routes/api/courses')(courses);
app.use('/api/courses', courses);

//Route not found.
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

//Error in server. Basically http error 500, internal server error.
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    //res.locals.message = err.message;
    //res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.send("HTTP error: " + err.status + ". " + err.message);
});

// Function to initiate the app/server into development- or production mode. (depends on NODE_ENV)
function initApp() {
    var dbConfig = config.get('Mongo.dbConfig'); //Get mongo database config
    console.log("Server running in " + app.get('env') + " mode.");
    mongoose.connect(dbConfig.host + ":" + dbConfig.port); // Connect to development- or production database);
}

module.exports = app;
