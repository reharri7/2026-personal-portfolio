import { Component, signal, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgxCaptchaModule } from 'ngx-captcha';
import { environment } from '../../../environments/environment';

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
  captcha: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxCaptchaModule],
  template: `
    <div class="bg-white dark:bg-secondary-900">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div class="grid md:grid-cols-3 gap-12">
          <div class="md:col-span-2">
            <h1 class="text-4xl font-bold mb-6 text-secondary-900 dark:text-white">Get In Touch</h1>
            <p class="text-lg text-secondary-600 dark:text-secondary-400 mb-8">
              Have a project in mind or want to collaborate? I'd love to hear from you. Fill out the form below and I'll get back to you as soon as possible.
            </p>

            <form (ngSubmit)="submitForm()" class="space-y-6">
              <div>
                <label class="block text-secondary-700 dark:text-secondary-300 font-semibold mb-2">Name</label>
                <input
                  [(ngModel)]="form.name"
                  name="name"
                  type="text"
                  required
                  class="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Your Name"
                />
              </div>

              <div>
                <label class="block text-secondary-700 dark:text-secondary-300 font-semibold mb-2">Email</label>
                <input
                  [(ngModel)]="form.email"
                  name="email"
                  type="email"
                  required
                  class="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label class="block text-secondary-700 dark:text-secondary-300 font-semibold mb-2">Subject</label>
                <input
                  [(ngModel)]="form.subject"
                  name="subject"
                  type="text"
                  required
                  class="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="What's this about?"
                />
              </div>

              <div>
                <label class="block text-secondary-700 dark:text-secondary-300 font-semibold mb-2">Message</label>
                <textarea
                  [(ngModel)]="form.message"
                  name="message"
                  required
                  rows="6"
                  class="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Your message..."
                ></textarea>
              </div>

              @if(isBrowser()) {
                <div>
                  <label class="block text-secondary-700 dark:text-secondary-300 font-semibold mb-2">Verify you're human</label>
                  <ngx-recaptcha2
                    #captchaElem
                    [siteKey]="siteKey"
                    [(ngModel)]="form.captcha"
                    name="captcha"
                    (success)="handleCaptchaSuccess($event)"
                    (error)="handleCaptchaError($event)"
                    [theme]="'light'"
                  >
                  </ngx-recaptcha2>
                </div>
              }

              <button type="submit" [disabled]="!form.captcha" class="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed">Send Message</button>
            </form>

            @if(showMessage()) {
              <div class="mt-6 p-4 rounded-lg" [ngClass]="isSuccess()
                ? 'bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800'">
                <p [ngClass]="isSuccess()
                  ? 'text-green-700 dark:text-green-200'
                  : 'text-red-700 dark:text-red-200'">
                  {{ messageText() }}
                </p>
              </div>
            }
          </div>

          <div class="md:col-span-1">
            <div class="card sticky top-24">
              <h3 class="text-xl font-bold mb-6 text-secondary-900 dark:text-white">Contact Information</h3>
              <div class="space-y-6">
                <div>
                  <h4 class="font-semibold text-secondary-900 dark:text-white mb-2">Email</h4>
                  <a href="mailto:hello@example.com" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                    hello@example.com
                  </a>
                </div>

                <div>
                  <h4 class="font-semibold text-secondary-900 dark:text-white mb-2">Location</h4>
                  <p class="text-secondary-600 dark:text-secondary-400">
                    San Francisco, CA<br>
                    United States
                  </p>
                </div>

                <div>
                  <h4 class="font-semibold text-secondary-900 dark:text-white mb-3">Follow Me</h4>
                  <div class="flex gap-3">
                    <a href="#" class="text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">GitHub</a>
                    <a href="#" class="text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">LinkedIn</a>
                    <a href="#" class="text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Twitter</a>
                  </div>
                </div>

                <div>
                  <h4 class="font-semibold text-secondary-900 dark:text-white mb-2">Response Time</h4>
                  <p class="text-secondary-600 dark:text-secondary-400 text-sm">
                    I typically respond within 24 hours
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ContactComponent {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  siteKey = environment.recaptchaSiteKey;
  isBrowser = signal(false);

  form: ContactForm = {
    name: '',
    email: '',
    subject: '',
    message: '',
    captcha: ''
  };

  showMessage = signal(false);
  isSuccess = signal(true);
  messageText = signal('');

  constructor() {
    this.isBrowser.set(isPlatformBrowser(this.platformId));
  }

  handleCaptchaSuccess(captchaResponse: string): void {
    this.form.captcha = captchaResponse;
  }

  handleCaptchaError(error: any): void {
    console.error('Captcha error:', error);
    this.showMessage.set(true);
    this.isSuccess.set(false);
    this.messageText.set('Captcha verification failed. Please try again.');
    setTimeout(() => this.showMessage.set(false), 5000);
  }

  submitForm(): void {
    if (!this.form.name || !this.form.email || !this.form.subject || !this.form.message) {
      this.showMessage.set(true);
      this.isSuccess.set(false);
      this.messageText.set('Please fill in all fields.');
      setTimeout(() => this.showMessage.set(false), 5000);
      return;
    }

    if (!this.form.captcha) {
      this.showMessage.set(true);
      this.isSuccess.set(false);
      this.messageText.set('Please complete the captcha verification.');
      setTimeout(() => this.showMessage.set(false), 5000);
      return;
    }

    this.http.post(`${environment.apiUrl}/contact`, this.form).subscribe({
      next: () => {
        this.showMessage.set(true);
        this.isSuccess.set(true);
        this.messageText.set('Thank you for your message! I\'ll get back to you soon.');
        this.resetForm();
        setTimeout(() => this.showMessage.set(false), 5000);
      },
      error: (error) => {
        console.error('Error submitting form:', error);
        this.showMessage.set(true);
        this.isSuccess.set(false);
        this.messageText.set('Something went wrong. Please try again.');
        setTimeout(() => this.showMessage.set(false), 5000);
      }
    });
  }

  private resetForm(): void {
    this.form = {
      name: '',
      email: '',
      subject: '',
      message: '',
      captcha: ''
    };
  }
}
