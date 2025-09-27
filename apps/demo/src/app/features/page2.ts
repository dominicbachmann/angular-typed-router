import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-page2',
  imports: [],
  template: `<p>page2 works!</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Page2 {}
