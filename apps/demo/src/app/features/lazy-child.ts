import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-lazy-child',
  imports: [],
  template: `<p>lazy-child works!</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LazyChild {}
