import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-page3',
  imports: [],
  template: `<p>page3 works!</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Page3 {}
