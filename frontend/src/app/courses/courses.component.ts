import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import {CourseService} from '../services/course.service';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { HeadService } from '../services/head.service';

@Component({
  selector: 'app-courses',
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.css'],
  animations: [
    trigger('content', [
      state('inactive', style({marginLeft: '0%', width: '100%'})),
      state('active', style({marginLeft: '15%', width: '85%'})),
      transition('inactive => active', animate('300ms')),
      transition('active => inactive', animate('300ms'))
    ])
  ]
})
export class CoursesComponent implements OnInit {
  courseCode: string;
  assignments: string[];
  exercises: string[];
  sidebarState; // state of sidebar
  progress: any;
  currentCourse: any;

  constructor(private courseService: CourseService, private route: ActivatedRoute, private headService: HeadService) {
    this.headService.stateChange.subscribe(sidebarState => { this.sidebarState = sidebarState; });
    this.route.params.subscribe( params => this.currentCourse = this.courseService.GetCourse(params['course']));
  }

  ngOnInit() {
    this.sidebarState = this.headService.getCurrentState();
    this.assignments = ['Assignment 1', 'Assignment 2', 'Assignment 3', 'Assignment 4', 'Assignment 5'];
    this.exercises = ['Exercise 1', 'Exercise 2', 'Exercise 3', 'Exercise 4', 'Exercise 5'];
  }
}
