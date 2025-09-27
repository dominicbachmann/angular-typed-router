import { Directive, Input } from '@angular/core';
import { RouterLink, UrlTree } from '@angular/router';
import { Commands, Path } from './typed-routes';

@Directive({
  selector: '[routerLink]'
})
export class TypedRouterLink extends RouterLink {
  @Input()
  override set routerLink(commandsOrUrlTree: Commands | Path | UrlTree | null | undefined) {
    super.routerLink = commandsOrUrlTree;
  }
}
