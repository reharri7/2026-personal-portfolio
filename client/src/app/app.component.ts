import { Component, OnInit, PLATFORM_ID, afterNextRender, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { ThemeService } from './services/theme.service';
import { GsapService } from './services/gsap.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    <main class="min-h-screen">
      <router-outlet></router-outlet>
    </main>
    <app-footer></app-footer>
  `,
  styles: []
})
export class AppComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly gsapService = inject(GsapService);

  constructor(private themeService: ThemeService) {
    if (isPlatformBrowser(this.platformId)) {
      afterNextRender(() => this.wireScrollTriggerRefresh());
    }
  }

  ngOnInit(): void {
    // Theme is initialized in ThemeService
  }

  private async wireScrollTriggerRefresh() {
    const { ScrollTrigger } = await this.gsapService.loadGsap();
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        // Defer so the new route's DOM is rendered before re-measuring
        setTimeout(() => ScrollTrigger.refresh(), 50);
      });
  }
}
