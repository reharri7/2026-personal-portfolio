import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BlogService, BlogPost } from '../../services/blog.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white dark:bg-secondary-900 min-h-screen">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 class="text-4xl font-bold mb-12 text-secondary-900 dark:text-white">Blog Admin</h1>

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
      </div>
    </div>
  `,
  styles: []
})
export class AdminComponent implements OnInit {
  editingPost: BlogPost | null = null;
  allPosts: BlogPost[] = [];
  tagsInput = '';

  postForm = {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    published: true
  };

  constructor(private blogService: BlogService) {}

  ngOnInit(): void {
    this.loadPosts();
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
