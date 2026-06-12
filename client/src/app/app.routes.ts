import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent)
  },
  {
    path: 'blog',
    loadComponent: () => import('./pages/blog/blog-list/blog-list.component').then(m => m.BlogListComponent)
  },
  {
    path: 'blog/:slug',
    loadComponent: () => import('./pages/blog/blog-detail/blog-detail.component').then(m => m.BlogDetailComponent)
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent)
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent)
  },
  {
    path: 'newsletter/confirm',
    loadComponent: () => import('./pages/newsletter/newsletter-confirm.component').then(m => m.NewsletterConfirmComponent)
  },
  {
    path: 'fun/sticker-wall',
    loadComponent: () => import('./pages/sticker-wall/sticker-wall.component').then(m => m.StickerWallComponent)
  },
  {
    path: 'fun/rherdle',
    loadComponent: () => import('./pages/rherdle/rherdle.component').then(m => m.RherdlePageComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/auth/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/auth/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
