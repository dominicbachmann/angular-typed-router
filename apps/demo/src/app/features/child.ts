import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-child',
  imports: [],
  template: `<p>child works!</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Child {}
