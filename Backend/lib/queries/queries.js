'use strict';

var schemas = require('../../models/schemas.js');
var Assignment = require('../../models/schemas').Assignment;
var Course = require('../../models/schemas').Course;
var Test = require('../../models/schemas').Test;
var User = require('../../models/schemas').User;
var errors = require('../errors.js');
var mongoose = require('mongoose');

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
    }).lean().exec(function (err, assignmentObject) {
        let json = {};
        json.tests = assignmentObject.tests;
        json.optional_tests = assignmentObject.optional_tests;
        callback(json);
    });
}




function getUser(id, fields) {
    var wantedFields = fields || "username email admin tokens courses providers";
    if (!mongoose.Types.ObjectId.isValid(id)) {
            throw errors.INVALID_ID;
    }
    return User.findById(id, wantedFields).then(function (user) {
        if (!user) {
            console.log("User not found");
            throw errors.USER_NOT_FOUND;
        }
        return user;
    });
}

function getUsers(id_array, fields) {
    var wantedFields = fields || "username email admin tokens courses providers";
    var promises = [];
    for (var i = 0; i < id_array.length; i++) {
        // Check validity of id
        if (!mongoose.Types.ObjectId.isValid(id_array[i])) {
            throw errors.INVALID_ID;
        }
        // Make a promise for each id
        var temp = User.findById(id_array[i], wantedFields).then(function (user) {
            if (!user) {
                console.log("User not found");
                throw errors.USER_NOT_FOUND;
            }
            return user;
        });
        promises.push(temp); // Gather all promisese in an array
    }
    return Promise.all(promises);
}

function deleteUser(id) {
    return User.findById(id).then(function (user) {
        if (!user) {
            console.log("deleteUser: User not found");
            throw errors.USER_NOT_FOUND;
        }
        User.deleteOne(user, function (err) {
            return err;
        });
    });
}

function setRefreshToken(userObject, token) {
    userObject.tokens.push(token);
    userObject.save().then(function (updatedUser) {
        console.log("Ref token saved");
    });
}

function removeRefreshToken(userid, token) {
    getUser(userid, "tokens").then(function (userObject) {
        var index = userObject.tokens.indexOf(token);
        if (index > -1) {
            userObject.tokens.splice(index, 1);
            userObject.save().then(function (updatedUser) {
                console.log("Token removed");
            });
        }
    });
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

function getAssignment(id, fields) {
    var wantedFields = fields || "name description hidden tests optional_tests languages";

    return Assignment.findById(id, fields).then(function (assignment) {
        if (!assignment) {
            throw errors.ASSIGNMENT_DOES_NOT_EXIST;
        }
        return assignment;
    });
}

function getTest(id, fields) {
    var wantedFields = fields || "stdout stdin args";

    return Test.findById(id, fields).then(function (test) {
        if (!test) {
            throw errors.TEST_DOES_NOT_EXIST;
        }
        return test;
    });
}

function createAssignment(name, description, hidden, languages, course_id) {
    var newAssignment = new Assignment({name: name, description: description, hidden: hidden, tests: {io: [], lint: false}, optionaal_tests: {io: [], lint: false}, languages: languages});
    return newAssignment.save().then(function (createdAssignment) {
        if (!createdAssignment) {
            console.log("Error: Assignment not created");
            throw errors.ASSINGMENT_NOT_CREATED;
        }
        //Push createdAssignment _id into course_id's assignments
        Course.findById(course_id).then( function (course) {
            if (!course) {
                throw errors.COURSE_DOES_NOT_EXIST;
            }
            course.assignments.push(createdAssignment._id);
            course.save().then(function (updatedCourse) {
                if (!updatedCourse) {
                    throw errors.FAILED_TO_UPDATE_COURSE;
                }
            });
        });
        return createdAssignment;
    });
}

//Field argument needs a check. If i don't want teacher, will it still be populated?!
function getCourse(id, fields) {
    var wantedFields = fields || "name description hidden teachers students assignments";

    return Course.findById(id, wantedFields)
    .populate("teachers", "username email")
    .populate("assignments", "name description").then(function (course) {
        if (!course) {
            throw errors.COURSE_DOES_NOT_EXIST;
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
exports.getUsers = getUsers;
exports.deleteUser = deleteUser;
exports.getCourses = getCourses;
exports.createCourse = createCourse;
exports.getUserCourses = getUserCourses;
exports.getCourseStudents = getCourseStudents;
exports.getCourseTeachers = getCourseTeachers;
exports.getCourseAssignments = getCourseAssignments;
exports.getCourse = getCourse;
exports.setRefreshToken = setRefreshToken;
exports.removeRefreshToken = removeRefreshToken;
exports.createAssignment = createAssignment;
exports.getAssignment = getAssignment;
exports.getTest = getTest;

