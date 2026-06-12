import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { NewsletterService, Subscriber } from '../../services/newsletter.service';

/**
 * Admin newsletter tab: shows the live Resend subscriber list and a composer that sends
 * a broadcast to the audience. Mirrors the blog editor's Quill setup.
 */
@Component({
  selector: 'app-admin-newsletter-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, QuillModule],
  template: `
    <div class="space-y-8">
      <!-- Compose -->
      <section>
        <h2 class="text-lg font-bold mb-4 text-secondary-900 dark:text-white">Compose newsletter</h2>
        <form (ngSubmit)="send()" class="space-y-4">
          <div>
            <label class="block text-secondary-700 dark:text-secondary-300 font-semibold mb-2">Subject *</label>
            <input
              [(ngModel)]="subject"
              name="subject"
              type="text"
              required
              class="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="What's new"
            />
          </div>
          <div>
            <label class="block text-secondary-700 dark:text-secondary-300 font-semibold mb-2">Body *</label>
            @if (isBrowser) {
              <quill-editor
                [(ngModel)]="body"
                name="body"
                [modules]="quillModules"
                [styles]="{ 'min-height': '240px' }"
                placeholder="Write your newsletter…"
                theme="snow"
              ></quill-editor>
            } @else {
              <textarea [(ngModel)]="body" name="body" rows="8"
                class="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white"></textarea>
            }
          </div>
          <div class="flex items-center gap-3">
            <button type="submit" [disabled]="sending() || !subject || !body" class="btn btn-primary disabled:opacity-50">
              {{ sending() ? 'Sending…' : 'Send to ' + activeCount() + ' subscribers' }}
            </button>
            @if (message()) {
              <span [class]="messageOk() ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                {{ message() }}
              </span>
            }
          </div>
        </form>
      </section>

      <!-- Subscribers -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-secondary-900 dark:text-white">
            Subscribers <span class="text-secondary-500">({{ subscribers().length }})</span>
          </h2>
          <button (click)="loadSubscribers()" class="btn btn-outline" [disabled]="loading()">Refresh</button>
        </div>
        @if (loading()) {
          <p class="text-secondary-500">Loading…</p>
        } @else if (subscribers().length === 0) {
          <p class="text-secondary-500">No subscribers yet.</p>
        } @else {
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="text-secondary-500 border-b border-secondary-200 dark:border-secondary-700">
                <th class="py-2">Email</th>
                <th class="py-2">Subscribed</th>
                <th class="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              @for (s of subscribers(); track s.email) {
                <tr class="border-b border-secondary-100 dark:border-secondary-800">
                  <td class="py-2 text-secondary-900 dark:text-white">{{ s.email }}</td>
                  <td class="py-2 text-secondary-600 dark:text-secondary-400">{{ s.createdAt | date:'mediumDate' }}</td>
                  <td class="py-2">
                    @if (s.unsubscribed) {
                      <span class="text-red-600 dark:text-red-400">Unsubscribed</span>
                    } @else {
                      <span class="text-green-600 dark:text-green-400">Active</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>
    </div>
  `,
  styles: []
})
export class AdminNewsletterTabComponent implements OnInit {
  private readonly newsletter = inject(NewsletterService);
  readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  subject = '';
  body = '';
  sending = signal(false);
  message = signal('');
  messageOk = signal(false);

  subscribers = signal<Subscriber[]>([]);
  loading = signal(false);

  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ header: [1, 2, 3, false] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean']
    ]
  };

  activeCount(): number {
    return this.subscribers().filter(s => !s.unsubscribed).length;
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadSubscribers();
    }
  }

  loadSubscribers(): void {
    this.loading.set(true);
    this.newsletter.getSubscribers().subscribe({
      next: (subs) => {
        this.subscribers.set(subs);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  send(): void {
    if (!this.subject || !this.body || this.sending()) {
      return;
    }
    this.sending.set(true);
    this.message.set('');
    this.newsletter.sendNewsletter(this.subject, this.body).subscribe({
      next: () => {
        this.sending.set(false);
        this.messageOk.set(true);
        this.message.set('Newsletter sent!');
        this.subject = '';
        this.body = '';
      },
      error: () => {
        this.sending.set(false);
        this.messageOk.set(false);
        this.message.set('Failed to send. Please try again.');
      }
    });
  }
}
