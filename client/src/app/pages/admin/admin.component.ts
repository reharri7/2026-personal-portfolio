import { Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { BlogService, BlogPost } from '../../services/blog.service';
import { environment } from '../../../environments/environment';

interface Contact {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white dark:bg-secondary-900 min-h-screen">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 class="text-4xl font-bold mb-8 text-secondary-900 dark:text-white">Admin Panel</h1>

        <!-- Tabs -->
        <div class="flex gap-4 mb-8 border-b border-secondary-200 dark:border-secondary-700">
          <button
            (click)="activeTab.set('blog')"
            [class]="activeTab() === 'blog'
              ? 'px-4 py-2 border-b-2 border-primary-500 text-primary-600 dark:text-primary-400 font-semibold'
              : 'px-4 py-2 text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white'"
          >
            Blog Posts
          </button>
          <button
            (click)="activeTab.set('contacts')"
            [class]="activeTab() === 'contacts'
              ? 'px-4 py-2 border-b-2 border-primary-500 text-primary-600 dark:text-primary-400 font-semibold'
              : 'px-4 py-2 text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white'"
          >
            Contact Requests
            @if(unreadCount() > 0) {
              <span class="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{{ unreadCount() }}</span>
            }
          </button>
        </div>

        <!-- Blog Tab -->
        @if(activeTab() === 'blog') {

        <div class="grid lg:grid-cols-3 gap-12">
          <div class="lg:col-span-2">
            <div class="card mb-8">
              <h2 class="text-2xl font-bold mb-6 text-secondary-900 dark:text-white">
                {{ editingPost ? 'Edit Post' : 'Create New Post' }}
              </h2>

              <form (ngSubmit)="savePost()" class="space-y-4">
                <div>
                  <label class="block text-secondary-700 dark:text-secondary-300 font-semibold mb-2">Title *</label>
                  <input
                    [(ngModel)]="postForm.title"
                    name="title"
                    type="text"
                    required
                    (input)="updateSlug()"
                    class="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Post Title"
                  />
                </div>

                <div>
                  <label class="block text-secondary-700 dark:text-secondary-300 font-semibold mb-2">Slug</label>
                  <input
                    [(ngModel)]="postForm.slug"
                    name="slug"
                    type="text"
                    class="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="post-slug"
                  />
                </div>

                <div>
                  <label class="block text-secondary-700 dark:text-secondary-300 font-semibold mb-2">Excerpt *</label>
                  <textarea
                    [(ngModel)]="postForm.excerpt"
                    name="excerpt"
                    required
                    rows="3"
                    class="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Brief summary of the post..."
                  ></textarea>
                </div>

                <div>
                  <label class="block text-secondary-700 dark:text-secondary-300 font-semibold mb-2">Content *</label>
                  <textarea
                    [(ngModel)]="postForm.content"
                    name="content"
                    required
                    rows="10"
                    class="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Full post content..."
                  ></textarea>
                </div>

                <div>
                  <label class="block text-secondary-700 dark:text-secondary-300 font-semibold mb-2">Tags (comma-separated)</label>
                  <input
                    [(ngModel)]="tagsInput"
                    name="tags"
                    type="text"
                    class="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>

                <div>
                  <label class="block text-secondary-700 dark:text-secondary-300 font-semibold mb-2">Publish Date</label>
                  <input
                    [(ngModel)]="postForm.date"
                    name="date"
                    type="date"
                    class="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div class="flex items-center gap-4">
                  <label class="flex items-center">
                    <input
                      [(ngModel)]="postForm.published"
                      name="published"
                      type="checkbox"
                      class="w-4 h-4 text-primary-600 dark:text-primary-500"
                    />
                    <span class="ml-2 text-secondary-700 dark:text-secondary-300">Published</span>
                  </label>
                </div>

                <div class="flex gap-3 pt-4">
                  <button type="submit" class="btn btn-primary">{{ editingPost ? 'Update Post' : 'Create Post' }}</button>
                  <button type="button" (click)="resetForm()" class="btn btn-secondary">Cancel</button>
                </div>
              </form>
            </div>
          </div>

          <div class="lg:col-span-1">
            <div class="card">
              <h2 class="text-2xl font-bold mb-6 text-secondary-900 dark:text-white">Posts</h2>
              <div class="space-y-3 max-h-96 overflow-y-auto">
                <div *ngFor="let post of allPosts" class="p-3 border border-secondary-200 dark:border-secondary-700 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors">
                  <h3 class="font-semibold text-secondary-900 dark:text-white truncate">{{ post.title }}</h3>
                  <p class="text-xs text-secondary-500 dark:text-secondary-400">{{ post.date }}</p>
                  <p class="text-xs mt-1" [ngClass]="post.published ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'">
                    {{ post.published ? 'Published' : 'Draft' }}
                  </p>
                  <div class="flex gap-2 mt-2">
                    <button
                      (click)="editPost(post)"
                      class="btn btn-sm btn-primary"
                    >
                      Edit
                    </button>
                    <button
                      (click)="deletePost(post.id)"
                      class="btn btn-sm btn-error"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                @if (allPosts.length === 0) {
                  <div class="text-center py-8">
                    <p class="text-secondary-500 dark:text-secondary-400">No posts yet</p>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
        }

        <!-- Contacts Tab -->
        @if(activeTab() === 'contacts') {
          <div class="space-y-6">
            <div class="flex gap-4 mb-4">
              <button
                (click)="contactFilter.set('all')"
                [class]="contactFilter() === 'all'
                  ? 'px-4 py-2 bg-primary-600 text-white rounded-lg'
                  : 'px-4 py-2 bg-secondary-200 dark:bg-secondary-700 text-secondary-900 dark:text-white rounded-lg hover:bg-secondary-300 dark:hover:bg-secondary-600'"
              >
                All ({{ contacts().length }})
              </button>
              <button
                (click)="contactFilter.set('unread')"
                [class]="contactFilter() === 'unread'
                  ? 'px-4 py-2 bg-primary-600 text-white rounded-lg'
                  : 'px-4 py-2 bg-secondary-200 dark:bg-secondary-700 text-secondary-900 dark:text-white rounded-lg hover:bg-secondary-300 dark:hover:bg-secondary-600'"
              >
                Unread ({{ unreadCount() }})
              </button>
              <button
                (click)="contactFilter.set('read')"
                [class]="contactFilter() === 'read'
                  ? 'px-4 py-2 bg-primary-600 text-white rounded-lg'
                  : 'px-4 py-2 bg-secondary-200 dark:bg-secondary-700 text-secondary-900 dark:text-white rounded-lg hover:bg-secondary-300 dark:hover:bg-secondary-600'"
              >
                Read ({{ readCount() }})
              </button>
            </div>

            @if(filteredContacts().length === 0) {
              <div class="card text-center py-12">
                <p class="text-secondary-500 dark:text-secondary-400">No contact requests</p>
              </div>
            }

            @for(contact of filteredContacts(); track contact.id) {
              <div class="card" [class.border-l-4]="!contact.isRead" [class.border-primary-500]="!contact.isRead">
                <div class="flex justify-between items-start mb-4">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <h3 class="text-xl font-bold text-secondary-900 dark:text-white">{{ contact.subject }}</h3>
                      @if(!contact.isRead) {
                        <span class="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs font-semibold rounded">NEW</span>
                      }
                    </div>
                    <p class="text-secondary-600 dark:text-secondary-400 text-sm">
                      From: <strong>{{ contact.name }}</strong> ({{ contact.email }})
                    </p>
                    <p class="text-secondary-500 dark:text-secondary-500 text-xs mt-1">
                      {{ formatDate(contact.createdAt) }}
                    </p>
                  </div>
                  <div class="flex gap-2">
                    @if(contact.isRead) {
                      <button
                        (click)="markAsUnread(contact.id)"
                        class="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded"
                      >
                        Mark Unread
                      </button>
                    } @else {
                      <button
                        (click)="markAsRead(contact.id)"
                        class="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded"
                      >
                        Mark Read
                      </button>
                    }
                    <button
                      (click)="deleteContact(contact.id)"
                      class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div class="bg-secondary-50 dark:bg-secondary-800 p-4 rounded-lg">
                  <p class="text-secondary-700 dark:text-secondary-300 whitespace-pre-wrap">{{ contact.message }}</p>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class AdminComponent implements OnInit {
  editingPost: BlogPost | null = null;
  allPosts: BlogPost[] = [];
  tagsInput = '';

  activeTab = signal<'blog' | 'contacts'>('blog');
  contacts = signal<Contact[]>([]);
  contactFilter = signal<'all' | 'unread' | 'read'>('all');

  postForm = {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    published: true
  };

  constructor(private blogService: BlogService, private http: HttpClient) {
    effect(() => {
      this.contactFilter();
      this.updateFilteredContacts();
    });
  }

  ngOnInit(): void {
    this.loadPosts();
    this.loadContacts();
  }

  filteredContacts = signal<Contact[]>([]);
  unreadCount = signal(0);
  readCount = signal(0);

  private updateFilteredContacts(): void {
    const allContacts = this.contacts();
    const filter = this.contactFilter();

    if (filter === 'unread') {
      this.filteredContacts.set(allContacts.filter(c => !c.isRead));
    } else if (filter === 'read') {
      this.filteredContacts.set(allContacts.filter(c => c.isRead));
    } else {
      this.filteredContacts.set(allContacts);
    }

    this.unreadCount.set(allContacts.filter(c => !c.isRead).length);
    this.readCount.set(allContacts.filter(c => c.isRead).length);
  }

  private loadContacts(): void {
    this.http.get<Contact[]>(`${environment.apiUrl}/contact`).subscribe({
      next: (contacts) => {
        this.contacts.set(contacts);
        this.updateFilteredContacts();
      },
      error: (error) => console.error('Error loading contacts:', error)
    });
  }

  markAsRead(id: number): void {
    this.http.patch(`${environment.apiUrl}/contact/${id}/read`, {}).subscribe({
      next: () => this.loadContacts(),
      error: (error) => console.error('Error marking contact as read:', error)
    });
  }

  markAsUnread(id: number): void {
    this.http.patch(`${environment.apiUrl}/contact/${id}/unread`, {}).subscribe({
      next: () => this.loadContacts(),
      error: (error) => console.error('Error marking contact as unread:', error)
    });
  }

  deleteContact(id: number): void {
    if (confirm('Are you sure you want to delete this contact request?')) {
      this.http.delete(`${environment.apiUrl}/contact/${id}`).subscribe({
        next: () => this.loadContacts(),
        error: (error) => console.error('Error deleting contact:', error)
      });
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private loadPosts(): void {
    this.allPosts = this.blogService.getAllPosts();
  }

  updateSlug(): void {
    if (!this.editingPost) {
      this.postForm.slug = this.blogService.generateSlug(this.postForm.title);
    }
  }

  savePost(): void {
    if (!this.postForm.title || !this.postForm.excerpt || !this.postForm.content) {
      alert('Please fill in all required fields');
      return;
    }

    const tags = this.tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    if (this.editingPost) {
      this.blogService.updatePost(this.editingPost.id, {
        ...this.postForm,
        tags
      });
    } else {
      this.blogService.addPost({
        ...this.postForm,
        tags
      });
    }

    this.resetForm();
    this.loadPosts();
  }

  editPost(post: BlogPost): void {
    this.editingPost = post;
    this.postForm = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      date: post.date,
      published: post.published
    };
    this.tagsInput = post.tags.join(', ');
  }

  deletePost(id: string): void {
    if (confirm('Are you sure you want to delete this post?')) {
      this.blogService.deletePost(id);
      this.loadPosts();
    }
  }

  resetForm(): void {
    this.editingPost = null;
    this.postForm = {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      date: new Date().toISOString().split('T')[0],
      published: true
    };
    this.tagsInput = '';
  }
}
