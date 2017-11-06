'use strict';

var schemas = require('../../models/schemas.js');
var Assignment = require('../../models/schemas').Assignment;
var Course = require('../../models/schemas').Course;
var Test = require('../../models/schemas').Test;
var User = require('../../models/schemas').User;
var errors = require('../errors.js');

// var Assignment, User, Test = require('../../models/schemas.js');

//get all tests related to a specific assignment.
function getTestsFromAssignment(assignmentID, callback) {

    Assignment.findById(assignmentID)
    .populate({
        path: 'tests.io',
        model: 'Test'
    }).populate({
        path: 'optional_tests.io',
        model: 'Test'
    }).lean().exec(function(err, assignmentObject) {
        let json = {};
        json.tests = assignmentObject.tests;
        json.optional_tests = assignmentObject.optional_tests;
        callback(json);
    });
}




function getUser(id, fields) {
    var wantedFields = fields || "username email admin tokens courses providers";
    return User.findById(id, wantedFields).then(function (user) {
        if (!user) {
            console.log("User not found");
            throw errors.TOKEN_USER_NOT_FOUND;
        }
        return user;
    });
}

function setRefreshToken(userObject, token) {
    userObject.tokens.push(token);
    userObject.save().then(function (updatedUser) {
        console.log("Ref token saved");
    });
}

function removeRefreshToken(userid, token) {
    getUser(userid, "tokens").then(function(userObject) {
        var index = userObject.tokens.indexOf(token);
        if (index > -1) {
            userObject.tokens.splice(index, 1);
            userObject.save().then(function (updatedUser) {
                console.log("Token removed");
            })
        }
    })
    .catch(function(err) {
        next(err);
    })
}

/*
function getUser(id) {
    return new Promise(function (resolve, reject) {
        User.findById(id, "username email courses admin", function (err, user) {
            if (err) {
                reject(err);
            }
            if (!user) {
                reject("User doesn't exist");
            } else {
                console.log("Found user " + user);
                resolve(user);
            }
        });
    });
}
*/

function findOrCreateUser(profile) {
    var username = profile.username;
    var email = profile.email || "";
    var admin = profile.admin || false;
    return User.findOne({username: username}).then(function (user) {
        if (!user) {
            var newUser = new User({username: username, email: email, admin: admin, courses: [], tokens: []});
            return newUser.save().then(function (createdUser) {
                if (!createdUser) {
                    console.log("Error: User not created");
                }
                return createdUser;
            });
        }
        return user;
    });
}

function getCourses(fields, admin) {
    var wantedFields = fields || "name description hidden teachers students assignments";

    if (admin) {
        return Course.find({}, wantedFields).then(function (courseList) {
            if (!courseList) {
                throw errors.NO_COURSES_EXISTS;
            }
            return courseList;
        });
    }
    return Course.find({'hidden': false}, wantedFields).then(function (courseList) {
        if (!courseList) {
            throw errors.NO_COURSES_EXISTS;
        }
        return courseList;
    });
    
}

function createCourse(name, description, hidden) {
    var newCourse = new Course({name: name, description: description, hidden: hidden, teachers: [], students: [], assignments: [], features: []});
    return newCourse.save().then(function (createdCourse) {
        if (!createdCourse) {
            console.log("Error: Course not created");
            //ERROR?!
        }
        return createdCourse;
    });
}

function getUserCourses(id, fields) {
    var wantedFields = fields || "name description hidden teachers students assignments";

    return User.findById(id, "courses").populate("courses", wantedFields).then(function (courseList) {
        if (!courseList) {
            throw errors.NO_COURSES_EXISTS;
        }
        return courseList;
    });
}

function getCourseStudents(id, fields) {
    var wantedFields = fields || "username email admin courses providers";

    return Course.findById(id, "students").populate("students", wantedFields).then(function (studentList) {
        if (!studentList) {
            throw errors.NO_STUDENTS_EXISTS;
        }
        return studentList;
    });
}

function getCourseTeachers(id, fields) {
    var wantedFields = fields || "username email admin courses providers";

    return Course.findById(id, "teachers").populate("teachers", wantedFields).then(function (teacherList) {
        if (!teacherList) {
            throw errors.NO_TEACHERS_EXISTS;
        }
        return teacherList;
    });
}

function getCourseAssignments(id, fields) {
    var wantedFields = fields || "name description hidden tests optional_tests languages";

    return Course.findById(id, "assignments").populate("assignments", wantedFields).then(function (assignmentList) {
        if (!assignmentList) {
            throw errors.NO_ASSINGMENTS_EXISTS;
        }
        return assignmentList;
    });
}

//Field argument needs a check. If i don't want teacher, will it still be populated?!
function getCourse(id, fields) {
    var wantedFields = fields || "name description hidden teachers students assignments";

    return Course.findById(id, wantedFields)
    .populate("teachers", "username email")
    .populate("assignments", "name description").then(function (course) {
        if (!course) {
            throw errors.COURSE_DO_NOT_EXIST;
        }
        return course;
    });
}

/*
function findOrCreateUser(profile) {
    return new Promise(function (resolve, reject) {
        console.log("findUser");

        var username;
        var email;

        username = profile.user;
        email = profile.attributes.mail;

        console.log(profile);
        console.log(username);
        console.log(email);

        User.findOne({username: username}, function (err, user) {
            console.log("findOne");
            if (err) {
              console.log(err);
              reject(err);
            }
            if (!user) {
                console.log("Creating new user with username " + username);
                var newUser = new User({username: username, email: email, admin: false, courses: []});
                newUser.save(function (err, created) {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }
                    resolve(created);
                });
            } else {
                console.log("Found user " + user);
                resolve(user);
            }
        });
    });
}
*/

exports.getTestsFromAssignment = getTestsFromAssignment;
exports.findOrCreateUser = findOrCreateUser;
exports.getUser = getUser;
exports.getCourses = getCourses;
exports.createCourse = createCourse;
exports.getUserCourses = getUserCourses;
exports.getCourseStudents = getCourseStudents;
exports.getCourseTeachers = getCourseTeachers;
exports.getCourseAssignments = getCourseAssignments;
exports.getCourse = getCourse;
exports.setRefreshToken = setRefreshToken;
exports.removeRefreshToken = removeRefreshToken;

