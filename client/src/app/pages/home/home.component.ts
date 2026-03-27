import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';
import {BlogService, BlogPost} from '../../services/blog.service';
import { TiltDirective } from '../../directives/tilt.directive';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, TiltDirective],
  template: `
    <div>
      <section
          class="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-secondary-900 dark:via-secondary-900 dark:to-secondary-800 py-20 md:py-32">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid md:grid-cols-2 gap-12 items-center perspective-1000">
            <div class="z-10">
              <h1 class="text-5xl md:text-6xl font-bold mb-6 text-secondary-900 dark:text-white text-3d">
                Full Stack <span class="text-gradient">Engineer</span>
              </h1>
              <p class="text-xl text-secondary-600 dark:text-secondary-400 mb-8">
                Building scalable applications with modern technologies. Passionate about clean code, user experience,
                and continuous learning.
              </p>
              <div class="flex gap-4">
                <a routerLink="/contact" class="btn btn-primary">Get In Touch</a>
                <a routerLink="/about" class="btn btn-outline">Learn More</a>
              </div>
            </div>
            <div class="relative preserve-3d" appTilt="10">
              <div class="w-80 h-80 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl rotate-45 shadow-xl"></div>
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="w-64 h-64 bg-white dark:bg-secondary-800 rounded-2xl -rotate-45 shadow-2xl opacity-95"></div>
              </div>
              <div class="shine-overlay"></div>
            </div>
          </div>
        </div>
      </section>

      <section class="py-20 bg-white dark:bg-secondary-900">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 class="section-title text-center">Skills & Technologies</h2>
          <div class="grid md:grid-cols-3 gap-8">
            <div class="card-3d text-center" appTilt>
              <div class="text-4xl mb-4">🎨</div>
              <h3 class="text-xl font-bold mb-2">Frontend</h3>
              <p class="text-secondary-600 dark:text-secondary-400">Angular, React, Vue.js, TypeScript, Tailwind CSS,
                HTML5, CSS3</p>
            </div>
            <div class="card-3d text-center" appTilt>
              <div class="text-4xl mb-4">⚙️</div>
              <h3 class="text-xl font-bold mb-2">Backend</h3>
              <p class="text-secondary-600 dark:text-secondary-400">Node.js, Python, Express, Django, PostgreSQL,
                MongoDB, REST APIs</p>
            </div>
            <div class="card-3d text-center" appTilt>
              <div class="text-4xl mb-4">🚀</div>
              <h3 class="text-xl font-bold mb-2">DevOps</h3>
              <p class="text-secondary-600 dark:text-secondary-400">Docker, Kubernetes, CI/CD, AWS, GitHub Actions,
                Git</p>
            </div>
          </div>
        </div>
      </section>

      <section class="py-20 bg-secondary-50 dark:bg-secondary-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 class="section-title text-center">Featured Projects</h2>
          <div class="grid md:grid-cols-2 gap-8">
            <div class="card-3d overflow-hidden has-shine" appTilt>
              <div class="h-48 bg-gradient-to-br from-primary-400 to-primary-600 mb-4"></div>
              <h3 class="text-2xl font-bold mb-2">E-Commerce Platform</h3>
              <p class="text-secondary-600 dark:text-secondary-400 mb-4">
                Full-stack application built with Angular and Node.js featuring product catalog, shopping cart, and
                payment integration.
              </p>
              <div class="flex gap-2 flex-wrap mb-4">
                <span
                    class="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 rounded-full text-sm">Angular</span>
                <span
                    class="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 rounded-full text-sm">Node.js</span>
                <span
                    class="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 rounded-full text-sm">PostgreSQL</span>
              </div>
              <div class="shine-overlay"></div>
            </div>

            <div class="card-3d overflow-hidden has-shine" appTilt>
              <div class="h-48 bg-gradient-to-br from-secondary-400 to-secondary-600 mb-4"></div>
              <h3 class="text-2xl font-bold mb-2">Social Media Dashboard</h3>
              <p class="text-secondary-600 dark:text-secondary-400 mb-4">
                Real-time analytics dashboard for managing multiple social media accounts with interactive charts and
                reports.
              </p>
              <div class="flex gap-2 flex-wrap mb-4">
                <span
                    class="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 rounded-full text-sm">React</span>
                <span
                    class="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 rounded-full text-sm">Python</span>
                <span
                    class="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 rounded-full text-sm">MongoDB</span>
              </div>
              <div class="shine-overlay"></div>
            </div>
          </div>
        </div>
      </section>

      <section class="py-20 bg-white dark:bg-secondary-900">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 class="section-title text-center">Latest Blog Posts</h2>
          <div class="grid md:grid-cols-2 gap-8">
            @for (post of recentPosts; track $index) {
              <div class="card-3d hover:shadow-lg transition-shadow has-shine" appTilt>
                <div class="flex justify-between items-start mb-2">
                  <h3 class="text-xl font-bold flex-1">{{ post.title }}</h3>
                  <span class="text-sm text-secondary-500 dark:text-secondary-400 whitespace-nowrap ml-2">
                  {{ formatDate(post.date) }}
                </span>
                </div>
                <p class="text-secondary-600 dark:text-secondary-400 mb-4">{{ post.excerpt }}</p>
                <div class="flex gap-2 flex-wrap mb-4">
                <span *ngFor="let tag of post.tags"
                      class="px-2 py-1 bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 rounded text-xs">
                  {{ tag }}
                </span>
                </div>
                <a [routerLink]="['/blog', post.slug]"
                   class="text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-300">
                  Read More →
                </a>
                <div class="shine-overlay"></div>
              </div>
            }
          </div>
          <div class="text-center mt-12">
            <a routerLink="/blog" class="btn btn-primary">View All Posts</a>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: []
})
export class HomeComponent implements OnInit {
  recentPosts: BlogPost[] = [];

  constructor(private blogService: BlogService) {
  }

  ngOnInit(): void {
    this.recentPosts = this.blogService.getPublishedPosts().slice(0, 2);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'});
  }
}
