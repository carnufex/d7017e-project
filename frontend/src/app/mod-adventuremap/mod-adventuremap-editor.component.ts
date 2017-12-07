import { ModAdventuremapComponent } from './mod-adventuremap.component';
import { Component, OnInit, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-mod-adventuremap-editor',
  templateUrl: './mod-adventuremap-editor.component.html',
  styleUrls: ['../gameelement/gameelement.component.css']
})

export class ModAdventuremapEditorComponent extends ModAdventuremapComponent implements OnInit, AfterViewInit {
  // private toEdit: any;

  ngOnInit() {
    this.width = 2 * this.baseWidth;
    this.height = 2 * this.baseHeight;
    this.sensitivity = this.radius = 8;

    // Make sure to get those assignments loaded right away
    this.loadAssignments();

    // Setup the viewport to reload once the image has loaded
    this.img.onload = () => {
      this.drawMap();
    };
    this.img.src = '/assets/images/ck4.gif';

  }

  drawPoint(ctx: CanvasRenderingContext2D, current: any, index: number) {
    // Draw the points in a manner relevant to the subclass

    // Fill the point
    ctx.beginPath();
    const local = this.scaleToLocal(current.coords);
    ctx.arc(local.x, local.y, this.radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = 'red';

    ctx.fill();

    // Stroke the border
    if (this.selectedAssignment !== undefined && this.selectedAssignment.assignment !== undefined &&
      this.selectedAssignment.assignment._id === current.assignment._id) {
      ctx.lineWidth = this.borderThickness;
      ctx.strokeStyle = '#5f5';
    } else {
      ctx.lineWidth = this.borderThickness;
      ctx.strokeStyle = 'black';
    }

    ctx.stroke();
  }

  updateGroup(groupIndex: number) {
    // Send a request to update the state of the group with new coords, etc.
    // TODO: bunch together multiple requests?
    this.assignmentGroups[groupIndex].assignments = this.assignments;
    const group = this.assignmentGroups[groupIndex];

    if (group !== undefined) {
      return this.backendService.putAssignmentGroup(this.courseCode, group._id, group);
    } else {
      console.error('failed to update positions, undefined group');
    }
  }

  handleClick() {
    // Handle the event that the user clicks the map

    return (ev: any) => {
      // Hittest the nodes
      const rect: any = (this as any).canvas.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;

      const toSelect = this.assignments.find( (el) => {
        const local = this.scaleToLocal(el.coords);
        const dx = x - local.x;
        const dy = y - local.y;
        return (Math.sqrt(dx * dx + dy * dy) < this.sensitivity);
      });

      // Determine what to do
      if (toSelect !== undefined) {
        this.selectedAssignment = toSelect;
      } else if (this.selectedAssignment !== undefined) {
        const baseCoords = this.scaleToBase({x: x, y: y});
        this.selectedAssignment.coords.x = baseCoords.x;
        this.selectedAssignment.coords.y = baseCoords.y;
        this.updateGroup(this.groupIndex);
      } else {
        console.warn('Warning: undefined elements.');
      }

      this.drawMap();
    };
  }
}