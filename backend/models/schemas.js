'use strict';
//Mongoose schemas.

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('config');

/*
* Base schemas
*/
var assignmentSchema = new Schema({
    name: {type: String, required: true},
    description: String,
    hidden: { type: Boolean, required: true },
    tests: {
        io: [{ type: Schema.Types.ObjectId, ref: 'Test', required: true }],
        lint: Boolean
    },
    optional_tests: {
        io: [{ type: Schema.Types.ObjectId, ref: 'Test', required: false }],
        lint: Boolean
    },
    languages: [{type: String, required: true}]
});
assignmentSchema.index({name: 'text', description: 'text'}, {weights: {name: 10, description: 1}});

var assignmentgroupSchema = new Schema({
    name: {type: String, required: true},
    assignments: [{
        coords: {
            x: {type: Number, default: 100},
            y: {type: Number, default: 100}
        },
        story: {type: String, default: ""},
        assignment: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true}
    }],
    adventuremap: {
        background: {type: String, required: false},
        transitionstory: {type: String, default: ""}
    }
});

var testSchema = new Schema({
    stdout: {type: String, default: ''},
    stdin: String,
    args: [String]
});

var userSchema = new Schema({
	username: {type: String, required: true},
    email: {type: String, required: false},
    admin: {type: Boolean, required: true},
    access: {type: String, enum: ['admin', 'advanced', 'basic'], required: false}, //change to required: true later
    tokens: [{type: String, required: false}],
    providers: [{type: String, required: true}] //LTU, KTH etc.
});
userSchema.index({username: 'text', email: 'text'});

//user code submissions
var draftSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true},
    assignment: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true},
    code: { type: String, required: false },
    lang: { type: String, required: false }
});

var joinRequests = new Schema({
    inviteType: {type: String, required: true},
    user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    course: {type: Schema.Types.ObjectId, ref: 'Course', required: true}
});

var courseMembers = new Schema({
    role: {type: String, required: true},
    course: {type: Schema.Types.ObjectId, ref: 'Course', required: true},
    user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    features: {type: Schema.Types.ObjectId, ref: 'Features', required: true}
});

var inviteCodes = new Schema({
    code: {type: String, required: true},
    course: {type: Schema.Types.ObjectId, ref: 'Course', required: true},
    uses: {type: Number, default: 0},
    createdAt: {type: Date, default: Date.now()},
    expiresAt: {type: Date}
});

var courseSchema = new Schema({
    course_code: {type: String, required: false},
    name: {type: String, required: true},
    description: {type: String, required: false},
    hidden: {type: Boolean, default: false},  //public or private course
    autojoin: {type: Boolean, default: false},
    owner: {type: Schema.Types.ObjectId, ref: 'User', required: false},
    assignments: [{ type: Schema.Types.ObjectId, ref: 'Assignment', required: false }],
    assignmentgroups: [{ type: Schema.Types.ObjectId, ref: 'Assignmentgroup', required: false }],
    enabled_features: {
        badges: Boolean,
        progressbar: Boolean,
        leaderboard: Boolean,
        adventuremap: Boolean
    }
});
courseSchema.index({course_code: 'text', name: 'text', description: 'text'}, {weights: {course_code: 50, name: 10, description: 1}});

/*
* Feature schemas
*/

//a course-specific badge. Needs reference to a course, badge and goals that "unlocks" it.
var badgeSchema = new Schema({
    course_id: { type: Schema.Types.ObjectId, ref: 'Course', required: true},
    icon: {type: String, required: true},   //name of an icon image file
    title: {type: String, required: true},
    description: {type: String, required: true},
    //Goals that "unlocks" the badge. This can be other Badge(s), Assignment(s) etc.
    goals: {
        badges: [{ type: Schema.Types.ObjectId, ref: 'Badge', required: false}],
        assignments:
        [{
            assignment: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true},
            tests: [{ type: Schema.Types.ObjectId, ref: 'Test', required: false}],
            code_size: {type: Number, required: false}
        }]
    }
});

var featuresSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    progress: [{
        assignment: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true},
        tests: [{test: { type: Schema.Types.ObjectId, ref: 'Test', required: true}, result: Boolean, optional_test: Boolean}],
        timing: {type: Number, required: true},
        code_size: {type: Number, required: true}
    }],
    badges: [{ type: Schema.Types.ObjectId, ref: 'Badge', required: false}]
});


var Assignment = mongoose.model('Assignment', assignmentSchema);
var Assignmentgroup = mongoose.model('Assignmentgroup', assignmentgroupSchema);
var Test = mongoose.model('Test', testSchema);
var User = mongoose.model('User', userSchema);
var Draft = mongoose.model('Draft', draftSchema);
var JoinRequests = mongoose.model('JoinRequests', joinRequests);
var CourseMembers = mongoose.model('CourseMembers', courseMembers);
var Course = mongoose.model('Course', courseSchema);
var Badge = mongoose.model('Badge', badgeSchema);
var Features = mongoose.model('Features', featuresSchema);
var InviteCodes = mongoose.model('InviteCodes', inviteCodes);
var models = {Assignment: Assignment, Assignmentgroup: Assignmentgroup, Test: Test, User: User, Draft: Draft,
        JoinRequests: JoinRequests, InviteCodes: InviteCodes, CourseMembers: CourseMembers, Course: Course, Badge: Badge, Features: Features};

module.exports = models;
