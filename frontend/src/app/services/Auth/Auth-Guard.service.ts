import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthService } from './Auth.service';
import {CourseService} from '../course.service';
import {UserService} from '../user.service';

@Injectable()
export class AuthGuardService implements CanActivate {
  constructor(public auth: AuthService, public router: Router, private courseService: CourseService,
              private userService: UserService) {}

  canActivate() {
    return new Promise(resolve => {
      if (!this.auth.isAuthenticated()) {
        this.router.navigate(['/']);
        resolve(false);
      } else if (!this.courseService.updated || !this.userService.updated) {
        this.courseService.updated = true;
        this.userService.updated = true;
        activateHelper(this.courseService, this.userService)
          .then(response => {
            resolve(true);
          })
          .catch(err => resolve(false));
      } else {
        resolve(true);
      }
    });
  }
}

function activateHelper(courseService, userService) {
  const promiseArray = [];
  promiseArray.push(courseService.GetAllCoursesForUser());
  promiseArray.push(userService.getMe());
  return Promise.all(promiseArray);
}
