import { Injectable } from '@angular/core';
import {
  NavigationBehaviorOptions,
  NavigationExtras,
  Router,
  UrlCreationOptions,
  UrlTree,
} from '@angular/router';
import { Commands, Path } from './typed-routes';

@Injectable({
  providedIn: 'root',
})
export class TypedRouter extends Router {
  override navigate(
    commands: Commands,
    extras?: NavigationExtras
  ): Promise<boolean> {
    return super.navigate(commands, extras);
  }

  override navigateByUrl(
    url: Path,
    extras?: NavigationBehaviorOptions
  ): Promise<boolean> {
    return super.navigateByUrl(url, extras);
  }

  override createUrlTree(
    commands: Commands,
    navigationExtras?: UrlCreationOptions
  ): UrlTree {
    return super.createUrlTree(commands, navigationExtras);
  }
}
