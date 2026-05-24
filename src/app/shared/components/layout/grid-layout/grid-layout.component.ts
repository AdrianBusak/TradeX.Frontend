import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-grid-layout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grid-layout.component.html',
  styleUrls: ['./grid-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridLayoutComponent {}
