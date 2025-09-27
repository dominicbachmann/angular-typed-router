import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-child-with-intermediate',
  imports: [],
  template: `<p>child-with-intermediate works!</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChildWithIntermediate {}
