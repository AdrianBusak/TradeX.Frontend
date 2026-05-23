import { AsyncPipe, NgClass, NgFor } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  imports: [AsyncPipe, NgClass, NgFor],
  templateUrl: './toast-host.component.html',
  styleUrl: './toast-host.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastHostComponent {
  protected readonly toastService = inject(ToastService);
  protected readonly messages$ = this.toastService.messages$;

  dismiss(id: number): void {
    this.toastService.dismiss(id);
  }
}
