import { Component, inject } from '@angular/core';
import { RouterLinkActive, RouterOutlet } from '@angular/router';
import { TypedRouter, TypedRouterLink } from 'angular-typed-router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TypedRouterLink, RouterLinkActive],
  styles: `
    .active {
      color: green;
    }
  `,
  template: `
    <nav>
      <ul>
        <li>
          <a routerLink="/">Home</a>
        </li>
        <li>
          <a routerLink="/page1">Page 1</a>
        </li>
        <li>
          <a routerLink="/page2">Page 2</a>
          <ul>
            <li>
              config
              <a routerLink="/page2/child">Child</a>
            </li>
          </ul>
        </li>
        <li>
          <a routerLink="/page3" routerLinkActive="active">Page 3</a>
          <ul>
            <li>
              <a routerLink="/page3/lazy-child">Lazy Child</a>
            </li>
          </ul>
        </li>
        <li>
          <span>Intermediate</span>
          <ul>
            <li>
              <a routerLink="/intermediate/child">Child</a>
            </li>
          </ul>
        </li>
        <li>
          <a routerLink="/with-param/home/else">With Param</a>
        </li>
      </ul>
    </nav>
    <router-outlet />
  `,
})
export class App {
  private readonly router = inject(TypedRouter);

  navigate() {
    this.router.navigateByUrl('/page1');
    this.router.navigate(['/', 'page1']);
    this.router.createUrlTree(['/', 'intermediate', 'child']);
    this.router.navigateByUrl('/page3/lazy-child');
    this.router.navigate(['/', 'intermediate', 'child']);
    this.router.navigate(['/']);
    this.router.navigate(['/', 'with-param', 'home', 'else']);
    this.router.navigateByUrl('/with-param/settings/something');
  }
}
