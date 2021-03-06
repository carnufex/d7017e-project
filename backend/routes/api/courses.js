'use strict';

var request = require('request');
var mongoose = require('mongoose');
var queries = require('../../lib/queries/queries');
var errors = require('../../lib/errors.js');
var permission = require('../../lib/permission.js');
var inputValidation = require('../../lib/inputValidation.js');
var badInput = require('../../lib/badInputError.js');
var typecheck = require('../../lib/typecheck.js');
var auth = require('../../lib/authentication.js');
var testerCom = require('../../lib/tester_communication');
var logger = require('../../lib/logger');
var features = require('../../lib/queries/features');

var Assignment = require('../../models/schemas').Assignment;
var Test = require('../../models/schemas').Test;
var constants = require('../../lib/constants.js');

// CHANGE THIS TO USE THE CONSTANTS.JS INSTEAD
const BASIC_FILTER = "name description course_code enabled_features";
const ADMIN_FILTER = "name description course_code teachers students assignments features enabled_features hidden";

module.exports = function(router) {

    // TODO:
    // Tests
    // Documentation
    // Query param to query multiple courses?
    //
    // Returns BASE_FIELDS of every course in db.
    // If course is "hidden" only Admin and members of the course can see it.

    router.get('/', function (req, res, next) {

        var p;
        if (req.user.access === "admin") {
            p = queries.getAllCourses();
        } else {
            p = queries.getCourses1().then(function (courseArray) {
                    return queries.getUsersHiddenCourses(req.user.id).then(function (hiddenCourses) {
                        return courseArray.concat(hiddenCourses);
                    });
                });
        }

        p.then(function (courseArray) {
            return res.json({courses: courseArray});
        })
        .catch(next);
    });


    // TODO:
    // Tests
    // Documentation
    //
    // Create new course
    // Admin/teachers can create unlimited courses
    // Students limited to 3 courses?
    router.post('/', function (req, res, next) {
        var input;
        try {
            input = inputValidation.postCourseValidation(req);
        }
        catch(error) {
            return next(error);
        }

        var p;
        if (req.user.access === "basic") {
            p = queries.countOwnedCourses(req.user.id)
                .then(function () {
                    return queries.saveCourseObject(req.user.id, input);
                });
        } else {
            p = queries.saveCourseObject(req.user.id, input);
        }
        p.then(function (savedCourse) {
            return res.status(201).json(savedCourse);
        })
        .catch(next);
    });



    // Get course with id :course_id
    // Different information depending on user roll.
    // What should be given for each roll?
    /*
    router.get('/:course_id', function (req, res, next) {
        var roll;
        var course_id = req.params.course_id;
        var wantedFields = req.query.fields || null;

        queries.getUser(req.user.id, "teaching").then(function (userObject) {
            if (userObject.teaching.indexOf(course_id) !== -1) {
                roll = "teacher";
            } else if (req.user.access === constants.ACCESS.ADMIN) {
                roll = "admin";
            } else {
                roll = "student";
            }
            if (!queries.checkPermission(wantedFields, "course", roll)) {
                return next(errors.INSUFFICIENT_PERMISSION);
            }

            queries.getCourse(course_id, roll, wantedFields).then(function (course) {
                return queries.getCourseMembers1(course_id).then(function(courseMembers) {
                    var courseObject = course.toObject();
                    courseObject.members = courseMembers;
                    console.log(courseObject);
                    return res.json(courseObject);
                });
            });
        })
        .catch(function(err) {
            next(err);
        });
    });
*/

    router.get('/:course_id', function (req, res, next) {
        var roll;
        var course_id = req.params.course_id;
        var wantedFields = req.query.fields || null;
        queries.getCourse(course_id, roll, wantedFields).then(function (course) {
            return queries.getCourseMembers1(course_id).then(function(courseMembers) {
                var courseObject = course.toObject();
                courseObject.members = courseMembers;
                return res.json(courseObject);
            });
        })
        .catch(next);
    });

    // Deletes course with id :course_id
    // Only admin and teacher of course can delete course
    router.delete('/:course_id', function (req, res, next) {
        let {course_id} = inputValidation.courseIdValidation(req);
        permission.checkIfTeacherOrAdmin(req.user.id, course_id, req.user.access)
        .then(() => {
            return queries.deleteCourse(course_id);
        }).then(() => {
            // respond with empty body
            res.json({});
        }).catch(next);
    });

    // Modify course with id :course_id
    // Must be teacher or higher
    router.put('/:course_id', function (req, res, next) {
        let {course_id} = inputValidation.courseIdValidation(req);
        let body = inputValidation.putCourseBodyValidation(req);
        permission.checkIfTeacherOrAdmin(req.user.id, course_id, req.user.access)
        .then(() => {
            return queries.updateCourse(course_id, body);
        }).then(() => {
            // send an empty response
            res.json({});
        }).catch(next);
    });



    // TODO:
    // Tests
    // Documentation
    //
    // Get all members of :course_id.
    // Query parameter "role" takes either "student" or "teacher" if only one type of member is wanted.
    router.get('/:course_id/members', function (req, res, next) {
        var input;
        try {
            input = inputValidation.getMembersValidation(req);
        }
        catch(error) {
            return next(error);
        }

        var p;
        if (input.role === "teacher") {
            p = queries.getCourseTeachers1(input.course_id);
        } else if (input.role === "student") {
            p = queries.getCourseStudents1(input.course_id);
        } else {
            p = queries.getCourseMembers1(input.course_id);
        }

        p.then(function (memberArray) {
            return res.json({members: memberArray});
        })
        .catch(next);
    });


    // TODO:
    // Tests
    // Documentation
    //
    // Teacher or admin can get all invites(invite, pending) regarding a :course_id.
    // Query parameter "type" takes "invite" or "pending" if only one invite type is wanted.
    router.get('/:course_id/members/invite', function (req, res, next) {
        var input;
        try {
            input = inputValidation.getMembersInviteValidation(req);
        }
        catch(error) {
            return next(error);
        }

        var p;
        p = permission.checkIfTeacherOrAdmin(req.user.id, input.course_id, req.user.access).
            then(function () {
                if (input.inviteType === "all") {
                    return queries.getCourseInvites(input.course_id);
                } else {
                    return queries.getCourseInvites(input.course_id, input.inviteType);
                }
            });

        p.then(function(inviteArray) {
            return res.json({invites: inviteArray});
        })
        .catch(next);
    });

    // TODO:
    // Tests
    // Documentation
    //
    // Teacher or admin can invite a user to :course_id by putting the users id in user_id body field.
    // User can ask to join :course_id by leaving user_id blank or filling it with his own id.
    // If course got autojoin a user who asks to join will automatically be added to the course.
    // Statuscode 201 indicates the user been added to course. Statuscode 202 is sent if invite/pending successfully added.
    router.post('/:course_id/members/invite', function (req, res, next) {
        var input;
        try {
            input = inputValidation.postMemberInviteValidation(req);
        }
        catch(error) {
            return next(error);
        }

        var p;
        if (input.user_id === req.user.id) {
            p = permission.checkUserNotInCourse(input.user_id, input.course_id)
                .then(function () {
                    return permission.checkIfAlreadyRequested(input.user_id, input.course_id);
                })
                .then(function () {
                    return queries.getCourseAutoJoin(input.course_id);
                })
                .then(function (courseAutoJoin) {
                    if(courseAutoJoin.autojoin) {
                        return queries.addMemberToCourse(input.user_id, input.course_id)
                        .then(function () {
                            return 201;
                        });
                    } else {
                        return queries.addPendingToCourse(input.user_id, input.course_id)
                        .then(function () {
                            return 202;
                        });
                    }
                });
        } else {
            p = permission.checkIfTeacherOrAdmin(req.user.id, input.course_id, req.user.access)
                .then(function() {
                    return permission.checkUserNotInCourse(input.user_id, input.course_id);
                })
                .then(function () {
                    return permission.checkIfAlreadyInvited(input.user_id, input.course_id);
                })
                .then(function () {
                    return queries.addInviteToCourse(input.user_id, input.course_id);
                })
                .then(function () {
                    return 202;
                });
        }


        p.then(function(statusCode) {
            return res.status(statusCode).json({});
        })
        .catch(next);
    });


    // TODO:
    // Tests
    // Documentation
    //
    // A teacher or admin can accept a pending request to :course_id. By adding their id in user_id body field.
    // A user can accept an invite to :course_id by sending his own id in user_id body field or leaving it blank.
    router.put('/:course_id/members/invite', function (req, res, next) {
        var input;
        try {
            input = inputValidation.putMembersInviteValidation(req);
        }
        catch(error) {
            return next(error);
        }

        var p;
        if (input.user_id === req.user.id) {
            p = queries.acceptInviteToCourse(input.user_id, input.course_id);
        } else {
            p = permission.checkIfTeacherOrAdmin(req.user.id, input.course_id, req.user.access).then(function () {
                        return queries.acceptPendingToCourse(input.user_id, input.course_id);
                });
        }
        p.then(function () {
            return res.status(201).json({});
        })
        .catch(next);
    });


    // TODO:
    // Tests
    // Documentation
    //
    // A teacher can decline or take back an pending/invite to :course_id. By adding user_id of the user he wants to decline in body field user_id
    // A user can decline or take back an invite/pending to :course_id. By adding their own user_id to user_id body field or leaving it blank.
    router.delete('/:course_id/members/invite', function (req, res, next) {
        var input;
        try {
            input = inputValidation.deleteMembersInviteValidation(req);
        }
        catch(error) {
            return next(error);
        }

        var p;
        if (input.user_id === req.user.id) {
            p = queries.removeInviteOrPendingToCourse(input.user_id, input.course_id);
        } else {
            p = permission.checkIfTeacherOrAdmin(req.user.id, input.course_id, req.user.access).then(function () {
                        return queries.removeInviteOrPendingToCourse(input.user_id, input.course_id);
                });
        }
        p.then(function () {
            return res.status(200).json({});
        })
        .catch(next);
    });


    // TODO
    // Documenetation
    // TESTS
    //
    // Admin and teacher of course can remove a student from the course.
    // User can leave course.
    router.delete('/:course_id/students', function (req, res, next) {
        var course_id = req.params.course_id;
        var student_id = req.body.student_id;

        if (!student_id) {
            student_id = req.user.id;
        }

        if (!mongoose.Types.ObjectId.isValid(student_id) || !mongoose.Types.ObjectId.isValid(course_id)) {
            return next(errors.BAD_INPUT);
        }

        // If leaving course then
        // Remove student from course
        //
        // If kicked out of course then
        // Check if admin/teacher then
        // Remove student from course
        queries.returnPromiseForChainStart()
        .then(function () {
            if (student_id === req.user.id) {
                return queries.removeStudentFromCourse(student_id, course_id)
                .then(function () {
                    return res.sendStatus(200).json({});
                });
            } else {
                return permission.checkIfTeacherOrAdmin(req.user.id, course_id, req.user.access)
                .then(function () {
                    return queries.removeStudentFromCourse(student_id, course_id);
                })
                .then(function () {
                    return res.sendStatus(200).json({});
                });
            }
        })
        .catch(function (error) {
            return next(error);
        });
    });


    router.put('/:course_id/members', function (req, res, next) {
        return res.json({fail: "bosse"});
    });
/*
    // TODO
    // Documentation
    // TESTS
    //
    // Admin and teachers of course can promote a student to teacher of course.
    router.put('/:course_id/teachers', function (req, res, next) {
        var course_id = req.params.course_id;
        var teacher_id = req.body.teacher_id;

        if (!mongoose.Types.ObjectId.isValid(teacher_id) || !mongoose.Types.ObjectId.isValid(course_id)) {
            return next(errors.BAD_INPUT);
        }

        permission.checkIfTeacherOrAdmin(req.user.id, course_id, req.user.access, "students teachers")
        .then(function (courseObject) {
            return queries.checkIfUserInCourseAndNotTeacherObject(teacher_id, courseObject);
        })
        .then(function () {
            return queries.addTeacherToCourse(teacher_id, course_id);
        })
        .then(function () {
            return res.sendStatus(201).json({});
        })
        .catch(function (error) {
            return next(error);
        });
    });
*/
    router.delete('/:course_id/members', function (req, res, next) {
        return res.json({fail: "Bosse"});
    });


/*
    // TODO
    // Documentation
    // TESTS
    //
    // Admin and teacher of course can demote a teacher of the course. He will then become a student of the course.
    router.delete('/:course_id/teachers', function (req, res, next) {
        var course_id = req.params.course_id;
        var teacher_id = req.body.teacher_id;

        if (!mongoose.Types.ObjectId.isValid(teacher_id) || !mongoose.Types.ObjectId.isValid(course_id)) {
            return next(errors.BAD_INPUT);
        }

        permission.checkIfTeacherOrAdmin(req.user.id, course_id, req.user.access)
        .then(function (courseObject) {
            return queries.checkIfUserIsTeacherObject(teacher_id, courseObject);
        })
        .then(function () {
            return queries.removeTeacherFromCourse(teacher_id, course_id);
        })
        .then (function () {
            return res.sendStatus(200).json({});
        })
        .catch(function (error) {
            return next(error);
        });
    });
*/

    // Return all assignmnts from a course
    router.get('/:course_id/assignments', function (req, res, next) {
        var course_id = req.params.course_id;

        // TODO: Display hidden assignments to students?
        queries.getCourseAssignments(course_id, "name description hidden languages").then(function (assignments) {
            return res.json(assignments);
        })
        .catch(function (err) {
            next(err);
        });
    });

    // Creates an assignment for a course
    router.post('/:course_id/assignments', function (req, res, next) {
        let {course_id} = inputValidation.courseIdValidation(req);
        let body = inputValidation.postAssignmentBodyValidation(req);

        permission.checkIfTeacherOrAdmin(req.user.id, course_id, req.user.access)
        .then(function () {
            return queries.createAssignment(course_id, body);
        })
        .then(function (assignment) {
            return res.status(201).json(assignment);
        })
        .catch(function (err) {
            next(err);
        });
    });

    // Return specified assignment
    router.get('/:course_id/assignments/:assignment_id', function (req, res, next) {
        let {course_id, assignment_id} = inputValidation.assignmentValidation(req);

        permission.checkIfAssignmentInCourse(course_id, assignment_id)
        .then(function () {
            // TODO: Should students be able to get hidden assignments from this endpoint?
            return queries.getAssignment1(assignment_id, "name description hidden tests optional_tests languages");
        })
        .then(function (assignmentObject) {
            return res.json(assignmentObject);
        })
        .catch(function (err) {
            next(err);
        });
    });

    // Update an assignment
    router.put('/:course_id/assignments/:assignment_id', function (req, res, next) {
        let {course_id, assignment_id} = inputValidation.assignmentValidation(req);
        let body = inputValidation.putAssignmentBodyValidation(req);

        permission.checkIfAssignmentInCourse(course_id, assignment_id)
        .then(function () {
            return permission.checkIfTeacherOrAdmin(req.user.id, course_id, req.user.access);
        })
        .then(function () {
            return queries.updateAssignment(assignment_id, body);
        })
        .then(function () {
            return res.json({});
        })
        .catch(function (err) {
            next(err);
        });
    });

    // Delete an assignment
    router.delete('/:course_id/assignments/:assignment_id', function (req, res, next) {
        let {course_id, assignment_id} = inputValidation.assignmentValidation(req);
        permission.checkIfTeacherOrAdmin(req.user.id, course_id, req.user.access)
        .then(() => permission.checkIfAssignmentInCourse(course_id, assignment_id))
        .then(() => queries.deleteAssignment(assignment_id, course_id))
        .then(() => {
            // respond with empty body
            res.json({});
        }).catch(next);
    });

    router.post('/:course_id/invitecodes', function (req, res, next) {
        var course_id = req.params.course_id;
        var expires;

        if (req.body.expires) {
            if (req.body.expires === "never") {
                expires = req.body.expires;
            } else {
                expires = (+req.body.expires);
                // throw Bad input if number is NaN or too small
                if (expires !== expires || expires <= 0) {
                    return next(errors.BAD_INPUT);
                }
                // Increase number from milliseconds to hours
                expires = expires * 60 * 60 * 1000;
            }
        }

        permission.checkIfTeacherOrAdmin(req.user.id, course_id, req.user.access).then(function () {
            return queries.generateInviteCode(course_id, expires).then(function (obj) {
                if (!obj.expiresAt) {
                    obj.expiresAt = "never";
                }
                res.status(201).json({code: obj.code, course: obj.course, uses: obj.uses, createdAt: obj.createdAt, expiresAt: obj.expiresAt});
            });
        })
        .catch(function (err) {
            next(err);
        });
    });

    router.get('/:course_id/invitecodes', function (req, res, next) {
        var course = req.params.course_id;

        queries.getAllInviteCodes(course, req.user).then(function (result) {
            var obj = [];
            for (var i = 0; i < result.length; i++) {
                var curr = result[i].toObject();
                curr._id = undefined;
                if (!curr.expiresAt) {
                    curr.expiresAt = "never";
                }
                obj.push(curr);
            }
            res.json({codes: obj});
        })
        .catch(function (err) {
            next(err);
        });
    });

    router.post('/invitecodes/:code/join', function (req, res, next) {
        var code = req.params.code;

        queries.validateInviteCode(code, req.user.id).then(function (result) {
            res.json({user: result.user, course: result.course, role: result.role, features: result.features});
        })
        .catch(function (err) {
            next(err);
        });
    });

    router.delete('/invitecodes/:code', function (req, res, next) {
        var code = req.params.code;

        queries.revokeInviteCode(code, req.user).then(function (obj) {
            res.json({code: obj.code, course: obj.course});
        })
        .catch(function (err) {
            next(err);
        });
    });

    router.get('/invitecodes/:code', function (req, res, next) {
        var code = req.params.code;

        queries.getInviteCode(code, req.user).then(function (obj) {
            if (!obj.expiresAt) {
                obj.expiresAt = "never";
            }
            res.json({code: obj.code, course: obj.course, uses: obj.uses, createdAt: obj.createdAt, expiresAt: obj.expiresAt});
        })
        .catch(function (err) {
            next(err);
        });
    });

    //submit user code to Tester service for code validation
    router.post('/:course_id/assignments/:assignment_id/submit', function(req, res, next) {
        var lang = req.body.lang;
        var code = req.body.code;
        var assignment_id = req.params.assignment_id;
        var course_id = req.params.course_id;

        var input;
        try {
            input = inputValidation.assignmentAndCourseValidation(req);
        } catch(error) {
            return next(error);
        }

        
        permission.checkIfAssignmentInCourse(course_id, assignment_id)
        .then(function () {
            return testerCom.validateCode(req.user.id, lang, code, assignment_id)
            .then(function (testerResponse) {
                return res.json(testerResponse);
            });
        })
        .catch(function (err) {
            next(err);
        });
    });

    // TODO: SHOULD BE REMOVED ONCE NEW ROUTE PATH IS USED BY FRONTEND
    // Save draft to assignment
    // course_id not used, should route be changed? Implement some check?
    router.post('/:course_id/assignments/:assignment_id/save', function (req, res, next) {
        var assignment_id = req.params.assignment_id;
        var code = req.body.code || "";
        var lang = req.body.lang || "";

        queries.saveCode(req.user.id, assignment_id, code, lang).then(function (draft) {
            res.status(201).json(draft);
        })
        .catch(function (err) {
            next(err);
        });
    });

    // save a user-draft (code) for an assignment
    router.post('/:course_id/assignments/:assignment_id/draft', function (req, res, next) {
        var assignment_id = req.params.assignment_id;
        var course_id = req.params.course_id;
        var code = req.body.code || "";
        var lang = req.body.lang || "";

        var input;
        try {
            input = inputValidation.assignmentAndCourseValidation(req);
        } catch(error) {
            return next(error);
        }

        permission.checkIfAssignmentInCourse(course_id, assignment_id).then(function () {
            queries.saveCode(req.user.id, assignment_id, code, lang).then(function (draft) {
                return res.status(201).json(draft);
            });
        })
        .catch(function (err) {
            next(err);
        });
    });

    // Retrieve the saved assignment draft, will create and return an empty draft if it doesn't already exist.
    router.get('/:course_id/assignments/:assignment_id/draft', function (req, res, next) {
        var assignment_id = req.params.assignment_id;
        var course_id = req.params.course_id;

        var input;
        try {
            input = inputValidation.assignmentAndCourseValidation(req);
        } catch(error) {
            return next(error);
        }

        permission.checkIfAssignmentInCourse(course_id, assignment_id).then(function () {
            queries.getCode(req.user.id, assignment_id).then(function (draft) {
                return res.json(draft);
            });
        })
        .catch(function (err) {
            next(err);
        });
    });

    // Get tests belonging to a specific assingment
    router.get('/:course_id/assignments/:assignment_id/tests', function (req, res, next) {
        var course_id = req.params.course_id;
        var assignment_id = req.params.assignment_id;

        if (!mongoose.Types.ObjectId.isValid(assignment_id) || !mongoose.Types.ObjectId.isValid(course_id)) {
            return next(errors.BAD_INPUT);
        }

        permission.checkIfAssignmentInCourse(course_id, assignment_id)
        .then(function () {
            return permission.checkIfTeacherOrAdmin(req.user.id, course_id, req.user.access);
        })
        .then(function () {
            return queries.getAssignmentTests(course_id, assignment_id);
        })
        .then(function (assignmentTests) {
            return res.json(assignmentTests);
        })
        .catch(function (error) {
            return next(error);
        });
    });

    // Post test to a specified assignment
    router.post('/:course_id/assignments/:assignment_id/tests', function (req, res, next) {
        var course_id = req.params.course_id;
        var assignment_id = req.params.assignment_id;
        var stdout = req.body.stdout;
        var stdin = req.body.stdin;
        var args = req.body.args;

        if (!mongoose.Types.ObjectId.isValid(assignment_id) || !mongoose.Types.ObjectId.isValid(course_id) || !typecheck.isString(stdout) || !typecheck.isString(stdin) || !Array.isArray(args)) {
            return next(errors.BAD_INPUT);
        }

        permission.checkIfAssignmentInCourse(course_id, assignment_id)
        .then(function () {
            return permission.checkIfTeacherOrAdmin(req.user.id, course_id, req.user.access);
        })
        .then(function () {
            return queries.createTest(stdout, stdin, args, assignment_id);
        })
        .then(function (test) {
            return res.status(201).json(test);
        })
        .catch(function (err) {
            next(err);
        });
    });

    // Get specified test
    router.get('/:course_id/assignments/:assignment_id/tests/:test_id', function (req, res, next) {
        var course_id = req.params.course_id;
        var assignment_id = req.params.assignment_id;
        var test_id = req.params.test_id;

        if (!mongoose.Types.ObjectId.isValid(assignment_id) || !mongoose.Types.ObjectId.isValid(course_id) || !mongoose.Types.ObjectId.isValid(test_id)) {
            return next(errors.BAD_INPUT);
        }

        permission.checkIfTestInAssignment(assignment_id, test_id)
        .then(function () {
            return permission.checkIfAssignmentInCourse(course_id, assignment_id);
        })
        .then(function () {
            return permission.checkIfTeacherOrAdmin(req.user.id, course_id, req.user.access);
        })
        .then(function () {
            return queries.getTest(test_id, "stdout stdin args");
        })
        .then(function (test) {
            return res.json(test);
        })
        .catch(function (err) {
            next(err);
        });
    });

    // Delete specified test
    router.delete('/:course_id/assignments/:assignment_id/tests/:test_id', function (req, res, next) {
        var course_id = req.params.course_id;
        var assignment_id = req.params.assignment_id;
        var test_id = req.params.test_id;

        if (!mongoose.Types.ObjectId.isValid(assignment_id) || !mongoose.Types.ObjectId.isValid(course_id) || !mongoose.Types.ObjectId.isValid(test_id)) {
            return next(errors.BAD_INPUT);
        }

        permission.checkIfTestInAssignment(assignment_id, test_id)
        .then(function () {
            return permission.checkIfAssignmentInCourse(course_id, assignment_id);
        })
        .then(function () {
            return permission.checkIfTeacherOrAdmin(req.user.id, course_id, req.user.access);
        })
        .then(function () {
            return queries.deleteTest(test_id, assignment_id, course_id);
        })
        .then(function () {
            return res.json({});
        })
        .catch(function (err) {
            next(err);
        });
    });

    // Update specified test
    router.put('/:course_id/assignments/:assignment_id/tests/:test_id', function (req, res, next) {
        var course_id = req.params.course_id;
        var assignment_id = req.params.assignment_id;
        var test_id = req.params.test_id;

        if (!mongoose.Types.ObjectId.isValid(assignment_id) || !mongoose.Types.ObjectId.isValid(course_id) || !mongoose.Types.ObjectId.isValid(test_id)) {
            return next(errors.BAD_INPUT);
        }

        let b = req.body;
        let clean_b = {};
        if (b.hasOwnProperty('stdout')) {
            if (typecheck.isString(b.stdout)) {
                clean_b.stdout = b.stdout;
            } else {
                return next(errors.BAD_INPUT);
            }
        }
        if (b.hasOwnProperty('stdin')) {
            if (typecheck.isString(b.stdin)) {
                clean_b.stdin = b.stdin;
            } else {
                return next(errors.BAD_INPUT);
            }
        }
        if (b.hasOwnProperty('args')) {
            if (Array.isArray(b.args)) {
                clean_b.args = b.args;
            } else {
                return next(errors.BAD_INPUT);
            }
        }

        permission.checkIfTestInAssignment(assignment_id, test_id)
        .then(function () {
            return permission.checkIfAssignmentInCourse(course_id, assignment_id);
        })
        .then(function () {
            return permission.checkIfTeacherOrAdmin(req.user.id, course_id, req.user.access);
        })
        .then(function () {
            return queries.updateTest(test_id, clean_b);
        })
        .then(function () {
            return res.json({});
        })
        .catch(function (err) {
            next(err);
        });
    });

    // Return enabled_features of a course
    router.get('/:course_id/enabled_features', function(req, res, next) {

        var course_id = req.params.course_id;

        if (!mongoose.Types.ObjectId.isValid(course_id)) {
            return next(errors.BAD_INPUT);
        }

        return queries.getCoursesEnabledFeatures(course_id)
        .then(enabled_features => res.json(enabled_features))
        .catch(next);
    });

    // Return all features of a course
    router.get('/:course_id/features', function(req, res, next) {

        var course_id = req.params.course_id;

        if (!mongoose.Types.ObjectId.isValid(course_id)) {
            return next(errors.BAD_INPUT);
        }

        return features.getFeaturesOfCourse(course_id)
        .then(features => res.json(features))
        .catch(next);
    });

    // Return feature of user in a course
    router.get('/:course_id/features/me', function(req, res, next) {

        var course_id = req.params.course_id;
        var user_id = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(course_id) || !mongoose.Types.ObjectId.isValid(user_id)) {
            return next(errors.BAD_INPUT);
        }

        features.getFeatureOfUserID(course_id, user_id)
        .then(feature => res.json(feature))
        .catch(next);
    });

    // Get all badges in a course
    router.get('/:course_id/badges', function(req, res, next) {

        var course_id = req.params.course_id;

        if (!mongoose.Types.ObjectId.isValid(course_id)) {
            return next(errors.BAD_INPUT);
        }

        return features.getBadgeByCourseID(course_id)
        .then(badges => res.json({badges: badges}))
        .catch(next);
    });

    // Create badge
    router.post('/:course_id/badges', function (req, res, next) {

        var course_id = req.params.course_id;

        if (!mongoose.Types.ObjectId.isValid(course_id)) {
            return next(errors.BAD_INPUT);
        }

        var input;
        try {
            input = inputValidation.postBadgeValidation(req);
        } catch(error) {
            return next(error);
        }

        return permission.checkIfTeacherOrAdmin(req.user.id, course_id, req.user.access)
        .then(function() {
            return features.createBadge(input);
        })
        .then(function(badge) {
            return res.json(badge);
        })
        .catch(next);
    });

    // Get a badge by id
    router.get('/:course_id/badges/:badge_id', function (req, res, next) {

        var course_id = req.params.course_id;
        var badge_id = req.params.badge_id;

        if (!mongoose.Types.ObjectId.isValid(course_id) || !mongoose.Types.ObjectId.isValid(badge_id)) {
            return next(errors.BAD_INPUT);
        }

        return features.getBadge(badge_id)
        .then(function(badge) {
            return res.json(badge);
        })
        .catch(next);
    });

    // Update a badge by id
    router.put('/:course_id/badges/:badge_id', function(req, res, next) {

        var course_id = req.params.course_id;
        var badge_id = req.params.badge_id;

        if (!mongoose.Types.ObjectId.isValid(course_id) || !mongoose.Types.ObjectId.isValid(badge_id)) {
            return next(errors.BAD_INPUT);
        }
        var input;
        try {
            input = inputValidation.putBadgeValidation(req);
        } catch(error) {
            return next(error);
        }

        return permission.checkIfTeacherOrAdmin(req.user.id, course_id, req.user.access)
        .then(function() {
            return features.updateBadge(badge_id, input);
        })
        .then(function(badge) {
            return res.json(badge);
        })
        .catch(next);
    });

    // Delete a badge by id
    router.delete('/:course_id/badges/:badge_id', function(req, res, next) {

        var course_id = req.params.course_id;
        var badge_id = req.params.badge_id;

        if (!mongoose.Types.ObjectId.isValid(course_id) || !mongoose.Types.ObjectId.isValid(badge_id)) {
            return next(errors.BAD_INPUT);
        }

        return permission.checkIfTeacherOrAdmin(req.user.id, course_id, req.user.access)
        .then(function() {
            return features.deleteBadge(badge_id);
        })
        .then(function(result) {
            return res.json({});
        })
        .catch(next);
    });

    // Get all assignmentgroups of a course
    router.get('/:course_id/assignmentgroups', function(req, res, next) {

        var course_id = req.params.course_id;

        if (!mongoose.Types.ObjectId.isValid(course_id)) {
            return next(errors.BAD_INPUT);
        }

        return queries.getAssignmentgroupsByCourseID(course_id)
        .then(assignmentgroups => res.json({assignmentgroups: assignmentgroups}))
        .catch(next);
    });

    // Create an assignment group
    router.post('/:course_id/assignmentgroups', function(req, res, next) {

        var course_id = req.params.course_id;

        if (!mongoose.Types.ObjectId.isValid(course_id)) {
            return next(errors.BAD_INPUT);
        }

        var input;
        try {
            input = inputValidation.assignmentgroupValidation(req);
        } catch(error) {
            return next(error);
        }

        return permission.checkIfTeacherOrAdmin(req.user.id, course_id, req.user.access)
        .then(function() {
            return queries.createAssignmentgroup(input, course_id);
        })
        .then(function(assignmentgroup) {
            return res.json(assignmentgroup);
        })
        .catch(next);
    });

    // Return an assignment group
    router.get('/:course_id/assignmentgroups/:assignmentgroup_id', function(req, res, next) {

        var course_id = req.params.course_id;
        var assignmentgroup_id = req.params.assignmentgroup_id;

        if (!mongoose.Types.ObjectId.isValid(course_id) || !mongoose.Types.ObjectId.isValid(assignmentgroup_id)) {
            return next(errors.BAD_INPUT);
        }

        return queries.getAssignmentgroupByID(assignmentgroup_id)
        .then(function(assignmentgroup) {
            return res.json(assignmentgroup);
        })
        .catch(next);
    });

    // Update an assignment group
    router.put('/:course_id/assignmentgroups/:assignmentgroup_id', function(req, res, next) {

        var course_id = req.params.course_id;
        var assignmentgroup_id = req.params.assignmentgroup_id;

        if (!mongoose.Types.ObjectId.isValid(course_id) || !mongoose.Types.ObjectId.isValid(assignmentgroup_id)) {
            return next(errors.BAD_INPUT);
        }

        var input;
        try {
            input = inputValidation.assignmentgroupValidation(req);
        } catch(error) {
            return next(error);
        }

        return permission.checkIfTeacherOrAdmin(req.user.id, course_id, req.user.access)
        .then(function() {
            queries.updateAssignmentgroup(input, assignmentgroup_id)
            .then(function(assignmentgroup) {
                return res.json(assignmentgroup);
            });
        })
        .catch(next);
    });

    // Delete an assignment group
    router.delete('/:course_id/assignmentgroups/:assignmentgroup_id', function(req, res, next) {

        var course_id = req.params.course_id;
        var assignmentgroup_id = req.params.assignmentgroup_id;

        if (!mongoose.Types.ObjectId.isValid(course_id) || !mongoose.Types.ObjectId.isValid(assignmentgroup_id)) {
            return next(errors.BAD_INPUT);
        }

        return permission.checkIfTeacherOrAdmin(req.user.id, course_id, req.user.access)
        .then(function() {
            return queries.deleteAssignmentgroup(assignmentgroup_id, course_id);
        })
        .then(function(result) {
            return res.json({});
        })
        .catch(next);
    });
};
