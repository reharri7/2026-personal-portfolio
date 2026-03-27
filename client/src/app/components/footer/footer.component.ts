import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="bg-secondary-900 dark:bg-secondary-950 text-white mt-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 class="text-xl font-bold mb-4">Portfolio</h3>
            <p class="text-secondary-400">A full stack engineer's portfolio showcasing projects and expertise.</p>
          </div>
          <div>
            <h3 class="text-xl font-bold mb-4">Quick Links</h3>
            <ul class="space-y-2">
              <li><a href="/" class="text-secondary-400 hover:text-white transition-colors">Home</a></li>
              <li><a href="/about" class="text-secondary-400 hover:text-white transition-colors">About</a></li>
              <li><a href="/blog" class="text-secondary-400 hover:text-white transition-colors">Blog</a></li>
              <li><a href="/contact" class="text-secondary-400 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h3 class="text-xl font-bold mb-4">Follow</h3>
            <div class="flex gap-4">
              <a href="#" class="text-secondary-400 hover:text-white transition-colors">GitHub</a>
              <a href="#" class="text-secondary-400 hover:text-white transition-colors">LinkedIn</a>
              <a href="#" class="text-secondary-400 hover:text-white transition-colors">Twitter</a>
            </div>
          </div>
        </div>
        <div class="border-t border-secondary-800 pt-8">
          <p class="text-center text-secondary-400">&copy; 2024 Full Stack Portfolio. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `,
  styles: []
})
export class FooterComponent {}
