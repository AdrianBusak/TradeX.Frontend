import { Injectable, inject } from '@angular/core';
import { TranslateService, InterpolationParameters } from '@ngx-translate/core';
import { BehaviorSubject, take } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly translate = inject(TranslateService);
  private readonly messagesSubject = new BehaviorSubject<ToastMessage[]>([]);
  private nextId = 0;

  readonly messages$ = this.messagesSubject.asObservable();

  success(messageKey: string, interpolateParams?: InterpolationParameters, duration = 3000): void {
    this.show(messageKey, 'success', interpolateParams, duration);
  }

  error(messageKey: string, interpolateParams?: InterpolationParameters, duration = 4500): void {
    this.show(messageKey, 'error', interpolateParams, duration);
  }

  warning(messageKey: string, interpolateParams?: InterpolationParameters, duration = 4000): void {
    this.show(messageKey, 'warning', interpolateParams, duration);
  }

  info(messageKey: string, interpolateParams?: InterpolationParameters, duration = 3000): void {
    this.show(messageKey, 'info', interpolateParams, duration);
  }

  dismiss(id: number): void {
    this.messagesSubject.next(this.messagesSubject.value.filter(message => message.id !== id));
  }

  private show(
    messageKey: string,
    type: ToastType,
    interpolateParams?: InterpolationParameters,
    duration = 3000
  ): void {
    this.translate.get(messageKey, interpolateParams).pipe(take(1)).subscribe(translatedMessage => {
      const id = this.nextId++;
      const message = typeof translatedMessage === 'string' ? translatedMessage : messageKey;

      this.messagesSubject.next([
        ...this.messagesSubject.value,
        { id, type, message }
      ]);

      if (duration > 0) {
        window.setTimeout(() => this.dismiss(id), duration);
      }
    });
  }
}
