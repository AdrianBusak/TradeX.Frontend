import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { GridAction } from '../data-grid/data-grid.component';

@Component({
  selector: 'app-grid-row-actions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIcon, MatTooltipModule, TranslatePipe],
  templateUrl: './grid-row-actions.component.html',
  styleUrl: './grid-row-actions.component.scss',
})
export class GridRowActionsComponent {
  readonly actions = input.required<GridAction[]>();
  readonly actionClick = output<GridAction>();

  getIcon(action: GridAction): string {
    switch (action) {
      case 'view':        return 'visibility';
      case 'delete':      return 'delete';
      case 'deactivate':  return 'toggle_off';
      case 'hard-delete': return 'delete_forever';
      case 'restore':     return 'restore';
      case 'duplicate':   return 'content_copy';
      case 'archive':     return 'archive';
      default:            return 'edit';
    }
  }

  getLabel(action: GridAction): string {
    const key = action === 'hard-delete' ? 'HARD_DELETE' : action.toUpperCase();
    return `COMMON.ACTIONS.${key}`;
  }

  isDanger(action: GridAction): boolean {
    return action === 'delete' || action === 'hard-delete';
  }

  isSuccess(action: GridAction): boolean {
    return action === 'restore';
  }

  isWarning(action: GridAction): boolean {
    return action === 'deactivate';
  }
}
