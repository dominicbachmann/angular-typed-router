import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-with-param',
  imports: [],
  template: `<p>with-param works!</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WithParam {}
