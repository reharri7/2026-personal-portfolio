import { Component, OnInit, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { QuillModule } from 'ngx-quill';
import { map } from 'rxjs';
import { BlogService, BlogPost } from '../../services/blog.service';
import { environment } from '../../../environments/environment';

type ToastKind = 'info' | 'success' | 'error';

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
  imports: [CommonModule, FormsModule, QuillModule],
  template: `
    <div class="bg-white dark:bg-secondary-900 min-h-screen">
      @if (toast(); as t) {
        <div class="fixed top-20 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-white flex items-center gap-2 max-w-sm"
             [class.bg-blue-600]="t.kind === 'info'"
             [class.bg-green-600]="t.kind === 'success'"
             [class.bg-red-600]="t.kind === 'error'">
          @if (t.kind === 'info') {
            <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          } @else if (t.kind === 'success') {
            <span aria-hidden="true">✓</span>
          } @else {
            <span aria-hidden="true">✕</span>
          }
          <span>{{ t.message }}</span>
        </div>
      }
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
                    class="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white placeholder-secondary-400 dark:placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Post Title"
                  />
                </div>

                <div>
                  <label class="block text-secondary-700 dark:text-secondary-300 font-semibold mb-2">Slug</label>
                  <input
                    [(ngModel)]="postForm.slug"
                    name="slug"
                    type="text"
                    class="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white placeholder-secondary-400 dark:placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                    class="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white placeholder-secondary-400 dark:placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Brief summary of the post..."
                  ></textarea>
                </div>

                <div>
                  <label class="block text-secondary-700 dark:text-secondary-300 font-semibold mb-2">Cover Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    (change)="onCoverImageSelected($event)"
                    class="block w-full text-sm text-secondary-700 dark:text-secondary-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-600 file:text-white hover:file:bg-primary-700"
                  />
                  @if (postForm.coverImageUrl) {
                    <div class="mt-2 flex items-center gap-3">
                      <img [src]="postForm.coverImageUrl" alt="Cover preview" class="h-24 rounded border border-secondary-200 dark:border-secondary-700" />
                      <button type="button" (click)="postForm.coverImageUrl = ''" class="text-sm text-red-600 hover:underline">Remove</button>
                    </div>
                  }
                  @if (coverUploadState() === 'uploading') {
                    <p class="text-sm text-secondary-600 dark:text-secondary-300 mt-2 flex items-center gap-2">
                      <span class="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                      Uploading cover image...
                    </p>
                  } @else if (coverUploadState() === 'success') {
                    <p class="text-sm text-green-600 dark:text-green-400 mt-2">✓ Uploaded</p>
                  } @else if (coverUploadState() === 'error') {
                    <p class="text-sm text-red-600 dark:text-red-400 mt-2">✕ {{ coverUploadError() }} — try again.</p>
                  }
                </div>

                <div>
                  <label class="block text-secondary-700 dark:text-secondary-300 font-semibold mb-2">Content *</label>
                  @if (isBrowser) {
                    <quill-editor
                      [(ngModel)]="postForm.content"
                      name="content"
                      [modules]="quillModules"
                      [styles]="{ 'min-height': '300px' }"
                      placeholder="Write your post content..."
                      theme="snow"
                      (onEditorCreated)="onEditorCreated($event)"
                    ></quill-editor>
                  } @else {
                    <textarea
                      [(ngModel)]="postForm.content"
                      name="content"
                      rows="10"
                      class="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white placeholder-secondary-400 dark:placeholder-secondary-500"
                      placeholder="Write your post content..."
                    ></textarea>
                  }
                </div>

                <div>
                  <label class="block text-secondary-700 dark:text-secondary-300 font-semibold mb-2">Tags (comma-separated)</label>
                  <input
                    [(ngModel)]="tagsInput"
                    name="tags"
                    type="text"
                    class="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white placeholder-secondary-400 dark:placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
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

                @if (formError()) {
                  <p class="text-sm text-red-600 dark:text-red-400">{{ formError() }}</p>
                }

                <div class="flex gap-3 pt-4">
                  <button type="submit" class="btn btn-primary" [disabled]="saving()">
                    @if (saving()) {
                      <span class="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-2 align-middle"></span>
                      Saving...
                    } @else {
                      {{ editingPost ? 'Update Post' : 'Create Post' }}
                    }
                  </button>
                  <button type="button" (click)="resetForm()" class="btn btn-secondary" [disabled]="saving()">Cancel</button>
                </div>
              </form>
            </div>
          </div>

          <div class="lg:col-span-1">
            <div class="card">
              <h2 class="text-2xl font-bold mb-6 text-secondary-900 dark:text-white">Posts</h2>
              <div class="space-y-3 max-h-96 overflow-y-auto">
                @if (postsLoading()) {
                  @for (_ of [1,2,3]; track $index) {
                    <div class="p-3 border border-secondary-200 dark:border-secondary-700 rounded-lg animate-pulse">
                      <div class="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-3/4 mb-2"></div>
                      <div class="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-1/3 mb-2"></div>
                      <div class="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-1/4"></div>
                    </div>
                  }
                } @else {
                  @for (post of allPosts(); track post.id) {
                    <div class="p-3 border border-secondary-200 dark:border-secondary-700 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
                         [class.opacity-50]="deletingId() === post.id">
                      <h3 class="font-semibold text-secondary-900 dark:text-white truncate">{{ post.title }}</h3>
                      <p class="text-xs text-secondary-500 dark:text-secondary-400">{{ post.date }}</p>
                      <p class="text-xs mt-1"
                         [class.text-green-600]="post.published"
                         [class.dark:text-green-400]="post.published"
                         [class.text-yellow-600]="!post.published"
                         [class.dark:text-yellow-400]="!post.published">
                        {{ post.published ? 'Published' : 'Draft' }}
                      </p>
                      <div class="flex gap-2 mt-2">
                        <button
                          (click)="editPost(post)"
                          [disabled]="deletingId() === post.id"
                          class="btn btn-sm btn-primary"
                        >
                          Edit
                        </button>
                        <button
                          (click)="deletePost(post.id)"
                          [disabled]="deletingId() === post.id"
                          class="btn btn-sm btn-error"
                        >
                          {{ deletingId() === post.id ? 'Deleting...' : 'Delete' }}
                        </button>
                      </div>
                    </div>
                  } @empty {
                    <div class="text-center py-8">
                      <p class="text-secondary-500 dark:text-secondary-400">No posts yet</p>
                    </div>
                  }
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
  allPosts = signal<BlogPost[]>([]);
  postsLoading = signal(true);
  tagsInput = '';

  activeTab = signal<'blog' | 'contacts'>('blog');
  contacts = signal<Contact[]>([]);
  contactFilter = signal<'all' | 'unread' | 'read'>('all');

  private readonly platformId = inject(PLATFORM_ID);
  readonly isBrowser = isPlatformBrowser(this.platformId);

  private quillEditor: any = null;
  coverUploadState = signal<'idle' | 'uploading' | 'success' | 'error'>('idle');
  coverUploadError = signal('');
  saving = signal(false);
  deletingId = signal<number | null>(null);
  formError = signal('');

  toast = signal<{ kind: ToastKind; message: string } | null>(null);
  private toastTimer: any = null;

  private showToast(kind: ToastKind, message: string, ms = 3000): void {
    this.toast.set({ kind, message });
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
    if (kind !== 'info') {
      this.toastTimer = setTimeout(() => this.toast.set(null), ms);
    }
  }

  private clearToast(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
    this.toast.set(null);
  }

  private extractError(err: any): string {
    return err?.error?.error ?? err?.error?.message ?? err?.message ?? 'Unknown error';
  }

  quillModules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote', 'code-block'],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: () => this.quillImageHandler()
      }
    }
  };

  postForm = {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImageUrl: '',
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
    this.http.get<Contact[]>(`${environment.apiUrl}/admin/contact`).subscribe({
      next: (contacts) => {
        this.contacts.set(contacts);
        this.updateFilteredContacts();
      },
      error: (error) => {
        console.error('Error loading contacts:', error);
        this.showToast('error', `Failed to load contacts: ${this.extractError(error)}`);
      }
    });
  }

  markAsRead(id: number): void {
    this.http.patch(`${environment.apiUrl}/admin/contact/${id}/read`, {}).subscribe({
      next: () => {
        this.loadContacts();
        this.showToast('success', 'Marked as read');
      },
      error: (error) => {
        console.error('Error marking contact as read:', error);
        this.showToast('error', `Failed to mark read: ${this.extractError(error)}`);
      }
    });
  }

  markAsUnread(id: number): void {
    this.http.patch(`${environment.apiUrl}/admin/contact/${id}/unread`, {}).subscribe({
      next: () => {
        this.loadContacts();
        this.showToast('success', 'Marked as unread');
      },
      error: (error) => {
        console.error('Error marking contact as unread:', error);
        this.showToast('error', `Failed to mark unread: ${this.extractError(error)}`);
      }
    });
  }

  deleteContact(id: number): void {
    if (confirm('Are you sure you want to delete this contact request?')) {
      this.http.delete(`${environment.apiUrl}/admin/contact/${id}`).subscribe({
        next: () => {
          this.loadContacts();
          this.showToast('success', 'Contact deleted');
        },
        error: (error) => {
          console.error('Error deleting contact:', error);
          this.showToast('error', `Failed to delete: ${this.extractError(error)}`);
        }
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
    this.postsLoading.set(true);
    this.blogService.getAllPosts().subscribe({
      next: (posts) => {
        this.allPosts.set(posts);
        this.postsLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading posts:', error);
        this.postsLoading.set(false);
        this.showToast('error', `Failed to load posts: ${this.extractError(error)}`);
      }
    });
  }

  updateSlug(): void {
    if (!this.editingPost) {
      this.postForm.slug = this.blogService.generateSlug(this.postForm.title);
    }
  }

  savePost(): void {
    if (!this.postForm.title || !this.postForm.excerpt || !this.postForm.content) {
      this.formError.set('Please fill in all required fields (title, excerpt, content).');
      this.showToast('error', 'Missing required fields');
      return;
    }
    this.formError.set('');

    const tags = this.tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const postData = {
      ...this.postForm,
      tags
    };

    const isUpdate = !!this.editingPost;
    this.saving.set(true);
    this.showToast('info', isUpdate ? 'Updating post...' : 'Creating post...');

    const request$ = isUpdate
      ? this.blogService.updatePost(this.editingPost!.id, postData)
      : this.blogService.addPost(postData);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.resetForm();
        this.loadPosts();
        this.showToast('success', isUpdate ? 'Post updated' : 'Post created');
      },
      error: (error) => {
        console.error('Error saving post:', error);
        this.saving.set(false);
        this.showToast('error', `Failed to save post: ${this.extractError(error)}`);
      }
    });
  }

  editPost(post: BlogPost): void {
    this.editingPost = post;
    this.formError.set('');
    this.postForm = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImageUrl: post.coverImageUrl ?? '',
      date: post.date,
      published: post.published
    };
    this.tagsInput = post.tags.join(', ');
  }

  deletePost(id: number): void {
    if (!confirm('Are you sure you want to delete this post?')) return;
    this.deletingId.set(id);
    this.showToast('info', 'Deleting post...');
    this.blogService.deletePost(id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.loadPosts();
        this.showToast('success', 'Post deleted');
      },
      error: (error) => {
        console.error('Error deleting post:', error);
        this.deletingId.set(null);
        this.showToast('error', `Failed to delete post: ${this.extractError(error)}`);
      }
    });
  }

  resetForm(): void {
    this.editingPost = null;
    this.formError.set('');
    this.coverUploadState.set('idle');
    this.coverUploadError.set('');
    this.postForm = {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      coverImageUrl: '',
      date: new Date().toISOString().split('T')[0],
      published: true
    };
    this.tagsInput = '';
  }

  onEditorCreated(editor: any): void {
    this.quillEditor = editor;
  }

  onCoverImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.coverUploadState.set('uploading');
    this.coverUploadError.set('');
    this.showToast('info', 'Uploading cover image...');
    this.uploadImage(file).subscribe({
      next: (url) => {
        this.postForm.coverImageUrl = url;
        this.coverUploadState.set('success');
        input.value = '';
        this.showToast('success', 'Cover image uploaded');
        setTimeout(() => {
          if (this.coverUploadState() === 'success') this.coverUploadState.set('idle');
        }, 2000);
      },
      error: (err) => {
        console.error('Cover upload failed:', err);
        const msg = this.extractError(err);
        this.coverUploadState.set('error');
        this.coverUploadError.set(msg);
        input.value = '';
        this.showToast('error', `Cover upload failed: ${msg}`);
      }
    });
  }

  private quillImageHandler(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file || !this.quillEditor) return;
      const range = this.quillEditor.getSelection(true);
      const placeholder = '⏳ uploading image…';
      const placeholderIndex = range.index;
      this.quillEditor.insertText(placeholderIndex, placeholder, { italic: true }, 'user');
      this.quillEditor.setSelection(placeholderIndex + placeholder.length, 0, 'user');
      this.showToast('info', 'Uploading image...');
      this.uploadImage(file).subscribe({
        next: (url) => {
          this.quillEditor.deleteText(placeholderIndex, placeholder.length, 'user');
          this.quillEditor.insertEmbed(placeholderIndex, 'image', url, 'user');
          this.quillEditor.setSelection(placeholderIndex + 1, 0, 'user');
          this.showToast('success', 'Image uploaded');
        },
        error: (err) => {
          console.error('Image upload failed:', err);
          this.quillEditor.deleteText(placeholderIndex, placeholder.length, 'user');
          this.showToast('error', `Image upload failed: ${this.extractError(err)}`);
        }
      });
    };
    input.click();
  }

  private uploadImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(
      `${environment.apiUrl}/admin/uploads/image`,
      formData
    ).pipe(map(res => res.url));
  }
}
