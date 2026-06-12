import {
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Sticker,
  StickerService,
  SubmitStickerInput,
} from '../../services/sticker.service';
import { TiltDirective } from '../../directives/tilt.directive';
import { decodeMask, gridSizeFromMask, overlapsTooMuch } from './overlap';

interface Camera {
  x: number; // world coord at viewport center
  y: number;
  scale: number; // pixels per world unit
}

const MIN_SCALE = 0.15;
const MAX_SCALE = 3.0;
const ZOOM_STEP = 0.2;            // exp() coefficient per unit of zoom "direction" (a button click = 1 unit)
const WHEEL_ZOOM_DIVISOR = 280;   // bigger = slower wheel / trackpad zoom; converts deltaY into a fractional direction
const ROTATE_PER_WHEEL = 5; // degrees per wheel notch when placing

@Component({
  selector: 'app-sticker-wall',
  standalone: true,
  imports: [CommonModule, FormsModule, TiltDirective],
  styleUrls: ['./sticker-effects.scss'],
  template: `
  <div class="relative w-full h-[calc(100vh-4rem)] overflow-hidden bg-base-200 select-none touch-none overscroll-none"
       [class.cursor-grab]="!placing() && !panning()"
       [class.cursor-grabbing]="panning() && !placing()"
       [class.cursor-crosshair]="placing()"
       #host
       (pointerdown)="onPointerDown($event)"
       (pointermove)="onPointerMove($event)"
       (pointerup)="onPointerUp($event)"
       (pointercancel)="onPointerUp($event)"
       (wheel)="onWheel($event)">

    <!-- World transform layer -->
    <div class="absolute left-1/2 top-1/2 will-change-transform"
         [style.transform]="worldTransform()">

      <!-- Origin crosshair (helps the user orient when the wall is empty) -->
      <div class="absolute pointer-events-none opacity-30"
           [style.left.px]="-12" [style.top.px]="-1"
           [style.width.px]="24" [style.height.px]="2"
           style="background:currentColor"></div>
      <div class="absolute pointer-events-none opacity-30"
           [style.left.px]="-1" [style.top.px]="-12"
           [style.width.px]="2" [style.height.px]="24"
           style="background:currentColor"></div>

      @for (s of renderable(); track s.id) {
        <div
          class="absolute cursor-pointer pointer-events-auto drop-shadow-md rounded-sm focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          [class.opacity-60]="s.status === 'pending'"
          [style.left.px]="s.x"
          [style.top.px]="s.y"
          [style.width.px]="s.width"
          [style.height.px]="s.height"
          [style.transform]="'rotate(' + s.rotation + 'deg)'"
          [style.transform-origin]="'center center'"
          tabindex="0"
          role="button"
          [attr.aria-label]="'Sticker by ' + s.username + (s.message ? ': ' + s.message : '')"
          (mousemove)="onStickerMove(s, $event)"
          (mouseleave)="onStickerLeave(s.id)"
          (focus)="hovered.set(s.id)"
          (blur)="onStickerLeave(s.id)"
          (keydown.enter)="onStickerActivate(s, $event)"
          (keydown.space)="onStickerActivate(s, $event)"
          (click)="onStickerClick(s, $event)">
          <img class="block w-full h-full" style="max-width:none;max-height:none" [src]="s.imageUrl!" />
          @if (s.effect) {
            <div class="sticker-effect-overlay"
                 [class]="'sticker-effect-overlay sticker-effect-' + s.effect"
                 [style.-webkit-mask-image]="'url(' + s.imageUrl + ')'"
                 [style.mask-image]="'url(' + s.imageUrl + ')'"></div>
          }
          @if (hovered() === s.id && s.username) {
            <div class="sticker-popup"
                 [style.--popup-transform]="popupTransform(s)"
                 [style.transform]="popupTransform(s)">
              <div class="rounded-md bg-secondary-900/95 dark:bg-secondary-800/95 text-white px-3 py-2 text-sm shadow-lg">
                <p class="font-medium">
                  Placed by {{ s.username }}@if (s.createdAt) { <span class="opacity-70"> · {{ s.createdAt | date:'mediumDate' }}</span> }
                </p>
                @if (s.message) {
                  <p class="text-xs opacity-80 mt-0.5">{{ s.message }}</p>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Pending-but-image-stripped stickers (other users' unmoderated): just a placeholder box -->
      @for (s of pendingPlaceholders(); track s.id) {
        <div
          class="absolute rounded-md bg-base-content/5 border border-dashed border-base-content/20"
          [style.left.px]="s.x"
          [style.top.px]="s.y"
          [style.width.px]="s.width"
          [style.height.px]="s.height"
          [style.transform]="'rotate(' + s.rotation + 'deg)'"></div>
      }

      <!-- Placement preview — glows red (following the sticker's shape) when
           the current spot would overlap another sticker too much. -->
      @if (placing(); as p) {
        <img
          class="absolute opacity-70 pointer-events-none"
          [src]="p.previewUrl"
          [style.left.px]="p.x"
          [style.top.px]="p.y"
          [style.width.px]="p.width"
          [style.height.px]="p.height"
          [style.transform]="'rotate(' + p.rotation + 'deg)'"
          [style.transform-origin]="'center center'"
          [style.filter]="placementInvalid() ? 'drop-shadow(0 0 3px rgb(239 68 68)) drop-shadow(0 0 4px rgb(239 68 68))' : null"
          style="max-width:none;max-height:none" />
      }
    </div>

    <!-- First-load spinner -->
    @if (loading()) {
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none" aria-live="polite">
        <div class="flex flex-col items-center gap-3 text-base-content/60">
          <div class="w-8 h-8 border-4 border-base-content/20 border-t-primary-600 rounded-full animate-spin"></div>
          <span class="text-sm">Loading the wall…</span>
        </div>
      </div>
    }

    <!-- Empty state — settled wall with no stickers yet. -->
    @if (showEmptyState()) {
      <div class="absolute inset-0 flex items-center justify-center px-6">
        <div class="text-center max-w-xs">
          <div class="text-5xl mb-3">🪧</div>
          <h2 class="text-lg font-semibold text-base-content">No stickers yet</h2>
          <p class="mt-1 text-sm text-base-content/60">Be the first to leave your mark on the wall.</p>
          <button class="btn btn-sm btn-primary mt-4" (click)="openUpload()">Create a Sticker</button>
        </div>
      </div>
    }

    <!-- Toolbar — wraps on small screens; labels collapse to icons on phones. -->
    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-1 sm:gap-2 items-center bg-base-100/90 backdrop-blur-sm rounded-full px-2 sm:px-3 py-1.5 sm:py-2 shadow-lg max-w-[calc(100vw-2rem)]">
      <button class="btn btn-sm btn-ghost min-h-0 h-8 px-2" (click)="zoom(-1)" [disabled]="!canZoomOut()" aria-label="Zoom out">−</button>
      <span class="hidden sm:inline text-xs w-12 text-center tabular-nums">{{ (camera().scale * 100).toFixed(0) }}%</span>
      <button class="btn btn-sm btn-ghost min-h-0 h-8 px-2" (click)="zoom(1)" [disabled]="!canZoomIn()" aria-label="Zoom in">+</button>
      <button class="btn btn-sm btn-ghost min-h-0 h-8 px-2" (click)="resetCamera()" title="Reset camera">
        <span class="hidden sm:inline">Reset</span><span class="sm:hidden">⊙</span>
      </button>
      <button class="btn btn-sm btn-ghost min-h-0 h-8 px-2" (click)="fitAll()" [disabled]="renderable().length === 0" title="Fit all stickers">
        <span class="hidden sm:inline">Fit all</span><span class="sm:hidden">⤧</span>
      </button>
      <button class="btn btn-sm btn-ghost min-h-0 h-8 px-2" (click)="refreshViewport()" aria-label="Refresh">↻</button>
      <button class="btn btn-sm btn-primary min-h-0 h-8 px-2 sm:px-3" (click)="openUpload()">
        <span class="hidden sm:inline">Create a Sticker</span><span class="sm:hidden">+ Sticker</span>
      </button>
    </div>

    <!-- Status bar (top-left) — camera coords hidden on phones (useless and crowds the bar). -->
    <div class="absolute top-2 left-2 sm:top-4 sm:left-4 bg-base-100/90 backdrop-blur-sm rounded-md px-2 sm:px-3 py-1 text-xs shadow flex gap-3 items-center">
      <span>{{ renderable().length }} sticker{{ renderable().length === 1 ? '' : 's' }}</span>
      <span class="hidden sm:inline opacity-50">camera ({{ camera().x | number:'1.0-0' }}, {{ camera().y | number:'1.0-0' }})</span>
    </div>

    <!-- Minimap (top-right) — smaller on phones; hidden on the very narrowest screens. -->
    @if (minimapVisible()) {
      <div class="absolute top-2 right-2 sm:top-4 sm:right-4 w-20 h-20 sm:w-32 sm:h-32 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-base-100/90 backdrop-blur-sm shadow-md overflow-hidden touch-none"
           [class.cursor-grab]="!minimapDragging"
           [class.cursor-grabbing]="minimapDragging"
           role="button"
           aria-label="Minimap — click or drag to navigate the wall"
           (pointerdown)="onMinimapPointerDown($event)"
           (pointermove)="onMinimapPointerMove($event)"
           (pointerup)="onMinimapPointerUp($event)"
           (pointercancel)="onMinimapPointerUp($event)">
        <svg class="pointer-events-none" [attr.viewBox]="'0 0 ' + minimapSize + ' ' + minimapSize"
             class="w-full h-full text-secondary-700 dark:text-secondary-200">
          <!-- Origin crosshair -->
          <line [attr.x1]="minimapOrigin().x" [attr.y1]="minimapOrigin().y - 3"
                [attr.x2]="minimapOrigin().x" [attr.y2]="minimapOrigin().y + 3"
                stroke="currentColor" stroke-opacity="0.3" stroke-width="1" />
          <line [attr.x1]="minimapOrigin().x - 3" [attr.y1]="minimapOrigin().y"
                [attr.x2]="minimapOrigin().x + 3" [attr.y2]="minimapOrigin().y"
                stroke="currentColor" stroke-opacity="0.3" stroke-width="1" />

          <!-- Sticker thumbnails (approved + own pending with image) -->
          @for (m of minimapStickers(); track m.id) {
            @if (m.imageUrl) {
              <image [attr.href]="m.imageUrl"
                     [attr.x]="m.x" [attr.y]="m.y"
                     [attr.width]="m.w" [attr.height]="m.h"
                     [attr.transform]="'rotate(' + m.rotation + ' ' + m.cx + ' ' + m.cy + ')'"
                     preserveAspectRatio="xMidYMid meet" />
            } @else {
              <rect [attr.x]="m.x" [attr.y]="m.y"
                    [attr.width]="m.w" [attr.height]="m.h"
                    [attr.transform]="'rotate(' + m.rotation + ' ' + m.cx + ' ' + m.cy + ')'"
                    fill="currentColor" fill-opacity="0.2" />
            }
          }

          <!-- Viewport rectangle (always centered) -->
          @if (minimapViewport(); as v) {
            <rect [attr.x]="v.x" [attr.y]="v.y" [attr.width]="v.w" [attr.height]="v.h"
                  fill="currentColor" fill-opacity="0.05"
                  stroke="currentColor" stroke-opacity="0.5" stroke-width="1" />
          }

          <!-- Off-screen origin arrow -->
          @if (minimapArrow(); as a) {
            <g [attr.transform]="'translate(' + a.cx + ',' + a.cy + ') rotate(' + a.angle + ')'">
              <polygon points="4,0 -4,-4 -4,4" fill="currentColor" fill-opacity="0.7" />
            </g>
          }
        </svg>
      </div>
    }

    <!-- Rotation dial (touch / mobile during placement) -->
    @if (placing(); as p) {
      @if (showRotationDial()) {
        <div class="absolute z-40 rounded-full border border-secondary-300 dark:border-secondary-700 bg-base-100/95 dark:bg-secondary-800/95 shadow-md select-none touch-none flex items-center justify-center"
             [style.top.px]="dialPosition().top"
             [style.left.px]="dialPosition().left"
             [style.width.px]="dialSize"
             [style.height.px]="dialSize"
             (pointerdown)="onDialPointerDown($event)"
             (pointermove)="onDialPointerMove($event)"
             (pointerup)="onDialPointerUp($event)"
             (pointercancel)="onDialPointerUp($event)">
          <span class="text-xs tabular-nums text-secondary-700 dark:text-secondary-200">
            {{ dialDisplayAngle(p.rotation) }}°
          </span>
          <svg class="absolute inset-0 pointer-events-none"
               [attr.viewBox]="'0 0 ' + dialSize + ' ' + dialSize">
            <circle [attr.cx]="dialDot(p.rotation).x" [attr.cy]="dialDot(p.rotation).y"
                    r="3" class="fill-secondary-800 dark:fill-secondary-100" />
          </svg>
        </div>
      }
    }

    @if (error()) {
      <div class="absolute top-4 right-4 alert alert-error shadow-lg max-w-sm">
        <span>{{ error() }}</span>
        <button class="btn btn-xs btn-ghost" (click)="error.set(null)">×</button>
      </div>
    }
  </div>

  <!-- Notch upload card — drops down from the top of the canvas, then
       progresses through stages (upload → details → processing → place
       → submitting). The pill silhouette comes from the .sticker-notch
       SCSS class (rounded bottom corners only). -->
  @if (notchOpen()) {
    <div class="sticker-notch bg-white dark:bg-secondary-900 w-[min(420px,92vw)]">
      @switch (notchStage()) {
        @case ('upload') {
          <div class="sticker-notch-stage p-5 space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold text-secondary-900 dark:text-white">New sticker</h3>
              <button class="text-secondary-500 hover:text-secondary-900 dark:hover:text-white text-lg leading-none"
                      (click)="closeUpload()" aria-label="Close">×</button>
            </div>
            <p class="text-xs text-secondary-600 dark:text-secondary-400">
              Pick an image — the server removes the background and adds an outline.
            </p>
            <input type="file" accept="image/png,image/jpeg,image/webp"
                   class="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white text-sm file:mr-3 file:px-3 file:py-1 file:rounded-md file:border-0 file:bg-primary-600 file:text-white hover:file:bg-primary-700 file:cursor-pointer"
                   (change)="onFileSelected($event)" />
          </div>
        }
        @case ('details') {
          <div class="sticker-notch-stage p-5 space-y-3">
            <div class="flex items-center gap-3">
              <button class="text-secondary-500 hover:text-secondary-900 dark:hover:text-white"
                      (click)="goBackToUpload()" aria-label="Back">←</button>
              <h3 class="text-base font-semibold text-secondary-900 dark:text-white flex-1 truncate">{{ formFile?.name }}</h3>
              <button class="text-secondary-500 hover:text-secondary-900 dark:hover:text-white text-lg leading-none"
                      (click)="closeUpload()" aria-label="Close">×</button>
            </div>
            <div>
              <label class="block text-secondary-700 dark:text-secondary-300 text-xs font-semibold mb-1">Your name *</label>
              <input type="text" placeholder="Max 30 characters" maxlength="30"
                     class="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white text-sm placeholder-secondary-400 dark:placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                     [(ngModel)]="formUsername" />
            </div>
            <div>
              <label class="block text-secondary-700 dark:text-secondary-300 text-xs font-semibold mb-1">Email</label>
              <input type="email" placeholder="Optional — we'll let you know when it's approved" maxlength="254"
                     class="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white text-sm placeholder-secondary-400 dark:placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                     [(ngModel)]="formEmail" />
            </div>
            <div>
              <label class="block text-secondary-700 dark:text-secondary-300 text-xs font-semibold mb-1">Message</label>
              <textarea placeholder="Optional, max 200 characters" rows="2" maxlength="200"
                        class="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white text-sm placeholder-secondary-400 dark:placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        [(ngModel)]="formMessage"></textarea>
            </div>
            <div>
              <label class="block text-secondary-700 dark:text-secondary-300 text-xs font-semibold mb-1">Effect</label>
              <select class="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      [(ngModel)]="formEffect">
                <option [ngValue]="''">No effect</option>
                <option value="rainbow">Rainbow</option>
                <option value="shimmer">Shimmer</option>
                <option value="holo">Holographic</option>
                <option value="glitter">Glitter</option>
              </select>
            </div>
            <button class="w-full px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    [disabled]="!formFile || !formUsername.trim()"
                    (click)="beginPlacement()">Process &amp; place →</button>
          </div>
        }
        @case ('processing') {
          <div class="sticker-notch-stage p-5 flex items-center gap-4">
            <div class="w-8 h-8 border-4 border-primary-200 dark:border-secondary-700 border-t-primary-600 rounded-full animate-spin"></div>
            <div class="flex-1">
              <p class="text-sm font-semibold text-secondary-900 dark:text-white">Processing sticker…</p>
              <p class="text-xs text-secondary-600 dark:text-secondary-400">Removing background &amp; outlining.</p>
            </div>
          </div>
        }
        @case ('place') {
          <div class="sticker-notch-stage p-4 flex items-center gap-3">
            <div class="text-2xl">{{ placementInvalid() ? '🚫' : '📍' }}</div>
            <div class="flex-1 text-sm">
              @if (placementInvalid()) {
                <p class="font-semibold text-red-600 dark:text-red-400">Overlaps another sticker</p>
                <p class="text-xs text-secondary-600 dark:text-secondary-400">Move to a clearer spot to place it here.</p>
              } @else {
                <p class="font-semibold text-secondary-900 dark:text-white">Click anywhere to place</p>
                <p class="text-xs text-secondary-600 dark:text-secondary-400">
                  @if (showRotationDial()) { Use the dial to rotate. } @else { Scroll to rotate. } Esc to cancel.
                </p>
              }
            </div>
            <button class="text-xs text-secondary-500 hover:text-secondary-900 dark:hover:text-white"
                    (click)="closeUpload()">Cancel</button>
          </div>
        }
        @case ('submitting') {
          <div class="sticker-notch-stage p-5 flex items-center gap-4">
            <div class="w-8 h-8 border-4 border-primary-200 dark:border-secondary-700 border-t-primary-600 rounded-full animate-spin"></div>
            <div class="flex-1">
              <p class="text-sm font-semibold text-secondary-900 dark:text-white">Submitting…</p>
              <p class="text-xs text-secondary-600 dark:text-secondary-400">Saving your sticker.</p>
            </div>
          </div>
        }
      }
    </div>
  }

  <!-- Inspector -->
  @if (inspect(); as s) {
    <div class="fixed inset-0 z-50 flex items-center justify-center p-6"
         (click)="closeInspector()">
      <div class="absolute inset-0 bg-black/70 backdrop-blur-md sticker-inspector-backdrop"></div>

      <div class="relative z-10 flex flex-col items-center gap-4 max-w-md w-full"
           role="dialog"
           aria-modal="true"
           [attr.aria-label]="'Sticker by ' + s.username"
           tabindex="-1"
           data-inspector-panel
           [class.sticker-inspector-morph]="inspectMorphStyle() !== null"
           [class.sticker-inspector-enter]="inspectMorphStyle() === null"
           [style]="inspectMorphStyle() || {}"
           (keydown)="onInspectorKeydown($event)"
           (click)="$event.stopPropagation()">
        <!-- Tilted card with holo gloss + glare -->
        <div class="sticker-inspector-card bg-white dark:bg-secondary-900 rounded-2xl shadow-2xl p-6 w-full"
             appTilt="14" [glare]="false">
          <div class="flex justify-center">
            <div class="sticker-inspector-image-wrap"
                 [style.max-width.px]="320">
              <img [src]="s.imageUrl"
                   class="block max-w-full max-h-80 object-contain"
                   alt="Sticker" />
              @if (s.effect) {
                <div [class]="'sticker-effect-overlay sticker-effect-' + s.effect"
                     [style.-webkit-mask-image]="'url(' + s.imageUrl + ')'"
                     [style.mask-image]="'url(' + s.imageUrl + ')'"></div>
              }
              <div class="sticker-inspector-gloss"
                   [style.-webkit-mask-image]="'url(' + s.imageUrl + ')'"
                   [style.mask-image]="'url(' + s.imageUrl + ')'"></div>
              <div class="sticker-inspector-glare"
                   [style.-webkit-mask-image]="'url(' + s.imageUrl + ')'"
                   [style.mask-image]="'url(' + s.imageUrl + ')'"></div>
            </div>
          </div>
          <div class="mt-5 text-center">
            <h3 class="text-2xl font-bold text-secondary-900 dark:text-white">{{ s.username }}</h3>
            @if (s.message) {
              <p class="mt-2 text-secondary-600 dark:text-secondary-300">{{ s.message }}</p>
            }
            @if (s.createdAt) {
              <p class="mt-3 text-xs uppercase tracking-wider text-secondary-500 dark:text-secondary-500">
                {{ s.createdAt | date:'longDate' }}
              </p>
            }
          </div>
        </div>

        <!-- Hint + actions (outside the tilted surface) -->
        <p class="text-xs text-white/60">
          @if (isTouch()) { Touch & drag to tilt } @else { Move the cursor to tilt }
        </p>
        <div class="flex items-center gap-2">
          <button class="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm backdrop-blur-sm"
                  (click)="copyShareLink()">{{ linkCopied() ? 'Link copied!' : 'Copy link' }}</button>
          <button class="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm backdrop-blur-sm"
                  (click)="closeInspector()">Close</button>
        </div>
      </div>
    </div>
  }
  `,
})
export class StickerWallComponent implements OnInit, OnDestroy {
  private readonly stickerService = inject(StickerService);
  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');

  readonly stickers = this.stickerService.stickers;
  // Stickers that have an image URL — approved or own-pending submissions.
  readonly renderable = computed(() =>
    this.stickers().filter((s) => !!s.imageUrl)
  );
  // Pending submissions from other users (image stripped by the server).
  readonly pendingPlaceholders = computed(() =>
    this.stickers().filter((s) => s.status === 'pending' && !s.imageUrl)
  );

  readonly camera = signal<Camera>({ x: 0, y: 0, scale: 1 });
  readonly canZoomIn = computed(() => this.camera().scale < MAX_SCALE - 1e-4);
  readonly canZoomOut = computed(() => this.camera().scale > MIN_SCALE + 1e-4);
  readonly worldTransform = computed(() => {
    const { x, y, scale } = this.camera();
    return `translate(-50%, -50%) scale(${scale}) translate(${-x}px, ${-y}px)`;
  });

  // True until the first viewport load resolves — drives the initial spinner.
  readonly loading = signal(true);
  // A settled, genuinely empty wall: invite the visitor to be the first.
  readonly showEmptyState = computed(() => !this.loading() && this.renderable().length === 0);

  readonly inspect = signal<Sticker | null>(null);
  readonly inspectOrigin = signal<DOMRect | null>(null);
  readonly linkCopied = signal(false);
  private static readonly CAMERA_STORAGE_KEY = 'stickerWall.camera';
  readonly error = signal<string | null>(null);
  readonly hovered = signal<number | null>(null);

  /** Inline style for the morph-from-origin animation. Builds CSS variables
   * mapping the inspector's centred final position back to the clicked
   * sticker's on-screen rect. */
  readonly inspectMorphStyle = computed<Record<string, string> | null>(() => {
    const rect = this.inspectOrigin();
    if (!rect) return null;
    // Inspector card is ~ centred at viewport mid; estimate target rect.
    const targetW = Math.min(window.innerWidth, 480);
    const targetCx = window.innerWidth / 2;
    const targetCy = window.innerHeight / 2;
    const fromCx = rect.left + rect.width / 2;
    const fromCy = rect.top + rect.height / 2;
    const fromScale = Math.max(0.05, Math.min(1, rect.width / targetW));
    return {
      '--from-x': `${fromCx - targetCx}px`,
      '--from-y': `${fromCy - targetCy}px`,
      '--from-scale': `${fromScale}`,
    };
  });

  /** Notch upload-card state machine. `closed` = no card visible. */
  readonly notchStage = signal<'closed' | 'upload' | 'details' | 'processing' | 'place' | 'submitting'>('closed');
  readonly notchOpen = computed(() => this.notchStage() !== 'closed');
  /** Convenience for the legacy "uploading or submitting" overlay state. */
  readonly busy = computed(() =>
    this.notchStage() === 'processing' || this.notchStage() === 'submitting'
  );
  formFile: File | null = null;
  formUsername = '';
  formEmail = '';
  formMessage = '';
  formEffect = '';

  readonly placing = signal<{
    file: File;
    previewUrl: string;
    alphaMask: string | null;
    naturalWidth: number;
    naturalHeight: number;
    width: number;
    height: number;
    x: number;
    y: number;
    rotation: number;
  } | null>(null);

  /** Decoded alpha mask of the in-flight placement preview (cached per url). */
  private placingMask: { url: string; bytes: Uint8Array | null } | null = null;
  private placingMaskBytes(): Uint8Array | null {
    const p = this.placing();
    if (!p) return null;
    if (!p.alphaMask) return null;
    if (this.placingMask?.url !== p.previewUrl) {
      this.placingMask = { url: p.previewUrl, bytes: decodeMask(p.alphaMask) };
    }
    return this.placingMask.bytes;
  }

  /**
   * Live placement validity: true when the preview would overlap any rendered
   * sticker beyond the allowed ratio (checked symmetrically so a large sticker
   * can't bury a small one). Recomputes as the preview moves/rotates.
   */
  readonly placementInvalid = computed<boolean>(() => {
    const p = this.placing();
    if (!p) return false;
    const aMask = this.placingMaskBytes();
    for (const s of this.renderable()) {
      const bMask = this.getMaskBytes(s);
      if (overlapsTooMuch(
        p.x, p.y, p.width, p.height, p.rotation, aMask,
        s.x, s.y, s.width, s.height, s.rotation, bMask
      )) {
        return true;
      }
    }
    return false;
  });

  private dragging: { kind: 'pan'; lastX: number; lastY: number } | null = null;

  // Drives the grab/grabbing cursor on the wall. A signal (not just `dragging`)
  // so the cursor flips the instant a pan starts, before the next pointermove.
  readonly panning = signal(false);

  // Where the most recent pointer went down, in client coords. Used to tell a
  // sticker *click* apart from a *pan that happened to start on a sticker*.
  private pointerDownClient: { x: number; y: number } | null = null;
  private static readonly CLICK_MOVE_THRESHOLD = 6; // px of travel that turns a click into a drag

  // The element focused before the inspector opened, restored when it closes.
  private lastFocused: HTMLElement | null = null;

  constructor() {
    // Inspector focus management: move focus into the dialog when it opens,
    // restore it to the trigger when it closes. Guarded for SSR (no rAF/DOM).
    effect(() => {
      const open = this.inspect() !== null;
      if (typeof window === 'undefined') return;
      if (open) {
        requestAnimationFrame(() => {
          const panel = this.host()?.nativeElement.ownerDocument
            .querySelector('[data-inspector-panel]') as HTMLElement | null;
          panel?.focus();
        });
      } else if (this.lastFocused) {
        this.lastFocused.focus?.();
        this.lastFocused = null;
      }
    });
  }

  // Multi-touch tracking for pinch-zoom. We hold the live client coords of
  // every active pointer; pinching kicks in once there are >= 2.
  private pointers = new Map<number, { x: number; y: number }>();
  private pinch: {
    startDist: number;
    startScale: number;
    worldAnchorX: number;
    worldAnchorY: number;
  } | null = null;
  private viewportTimer: number | null = null;
  private refreshDebounce: number | null = null;
  private static readonly REFRESH_DEBOUNCE_MS = 250;
  private static readonly REFRESH_POLL_MS = 15000;

  // Edge-pan state — only active during placement.
  private edgePanRaf: number | null = null;
  private lastCursor: { x: number; y: number } | null = null;
  private static readonly EDGE_PAN_MARGIN = 60;     // px from edge that triggers pan
  private static readonly EDGE_PAN_MIN_SPEED = 2;   // px/frame at the inner edge of the margin
  private static readonly EDGE_PAN_MAX_SPEED = 25;  // px/frame at the very edge

  ngOnInit(): void {
    const saved = this.restoreCamera();
    if (saved) this.camera.set(saved);
    queueMicrotask(() => this.refreshViewport());
    queueMicrotask(() => this.openDeepLinkTarget());
    this.viewportTimer = window.setInterval(() => {
      if (!document.hidden) this.refreshViewport();
    }, StickerWallComponent.REFRESH_POLL_MS);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('focus', this.handleFocus);
    document.addEventListener('visibilitychange', this.handleFocus);
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.isTouch.set(window.matchMedia('(hover: none)').matches);
    }
  }

  ngOnDestroy(): void {
    if (this.viewportTimer != null) clearInterval(this.viewportTimer);
    if (this.refreshDebounce != null) clearTimeout(this.refreshDebounce);
    this.stopEdgePanLoop();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('focus', this.handleFocus);
    document.removeEventListener('visibilitychange', this.handleFocus);
    const p = this.placing();
    // previewUrl is a data: URL after the server-side preview, so nothing
    // to revoke; this branch is kept for the brief window before preview
    // resolves, where it would be a blob: URL.
    if (p && p.previewUrl.startsWith('blob:')) URL.revokeObjectURL(p.previewUrl);
  }

  private handleFocus = () => {
    if (!document.hidden) this.refreshViewport();
  };

  private static readonly KEY_PAN_STEP = 90; // screen px moved per arrow-key press

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (this.busy()) return; // don't cancel mid-flight network calls
      if (this.placing()) {
        this.cancelPlacement();
        this.notchStage.set('closed');
        e.preventDefault();
      } else if (this.inspect()) {
        this.closeInspector();
      } else if (this.notchOpen()) {
        this.closeUpload();
      }
      return;
    }

    // Keyboard pan/zoom. Stay out of the way of typing and of any mode that
    // owns the keyboard (placement, the upload notch, the inspector dialog).
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) {
      return;
    }
    if (this.placing() || this.notchOpen() || this.inspect()) return;

    const step = StickerWallComponent.KEY_PAN_STEP;
    const cam = this.camera();
    switch (e.key) {
      case 'ArrowUp':    this.camera.set({ ...cam, y: cam.y - step / cam.scale }); break;
      case 'ArrowDown':  this.camera.set({ ...cam, y: cam.y + step / cam.scale }); break;
      case 'ArrowLeft':  this.camera.set({ ...cam, x: cam.x - step / cam.scale }); break;
      case 'ArrowRight': this.camera.set({ ...cam, x: cam.x + step / cam.scale }); break;
      case '+': case '=': this.zoom(1); break;
      case '-': case '_': this.zoom(-1); break;
      case '0': this.resetCamera(); return; // resetCamera already refreshes
      default: return;
    }
    e.preventDefault();
    this.scheduleRefresh();
  };

  // ----- camera / panning -----

  zoom(direction: number, anchorClientX?: number, anchorClientY?: number): void {
    const cam = this.camera();
    const factor = Math.exp(direction * ZOOM_STEP);
    let newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, cam.scale * factor));
    if (newScale === cam.scale) return;
    // Anchor zoom around cursor when supplied, else around center.
    if (anchorClientX != null && anchorClientY != null) {
      const rect = this.host().nativeElement.getBoundingClientRect();
      const cx = anchorClientX - rect.left - rect.width / 2;
      const cy = anchorClientY - rect.top - rect.height / 2;
      const worldAnchorX = cam.x + cx / cam.scale;
      const worldAnchorY = cam.y + cy / cam.scale;
      const newX = worldAnchorX - cx / newScale;
      const newY = worldAnchorY - cy / newScale;
      this.camera.set({ x: newX, y: newY, scale: newScale });
    } else {
      this.camera.set({ ...cam, scale: newScale });
    }
    this.scheduleRefresh();
  }

  resetCamera(): void {
    this.camera.set({ x: 0, y: 0, scale: 1 });
    this.refreshViewport();
  }

  /** Initialize pinch state when a 2nd finger touches down. The world point
   * under the initial 2-finger midpoint is the "anchor" — we'll keep it
   * pinned under the moving midpoint as the user pinches. */
  private startPinch(): void {
    const ps = Array.from(this.pointers.values());
    if (ps.length < 2) return;
    const [a, b] = ps;
    const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const world = this.clientToWorld(mx, my);
    this.pinch = {
      startDist: dist,
      startScale: this.camera().scale,
      worldAnchorX: world.x,
      worldAnchorY: world.y,
    };
  }

  /** Update camera scale + position so the anchor world point stays under
   * the current 2-finger midpoint. */
  private updatePinch(): void {
    if (!this.pinch) return;
    const ps = Array.from(this.pointers.values());
    if (ps.length < 2) { this.pinch = null; return; }
    const [a, b] = ps;
    const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;

    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE,
      this.pinch.startScale * (dist / this.pinch.startDist)));
    const host = this.host()?.nativeElement;
    if (!host) return;
    const rect = host.getBoundingClientRect();
    // newCam = anchor - (midpoint - hostCenter) / newScale
    const cx = mx - rect.left - rect.width / 2;
    const cy = my - rect.top - rect.height / 2;
    this.camera.set({
      x: this.pinch.worldAnchorX - cx / newScale,
      y: this.pinch.worldAnchorY - cy / newScale,
      scale: newScale,
    });
  }

  /** Pan + zoom so every renderable sticker fits inside the viewport. */
  fitAll(): void {
    const list = this.renderable();
    if (list.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const s of list) {
      if (s.x < minX) minX = s.x;
      if (s.y < minY) minY = s.y;
      if (s.x + s.width > maxX) maxX = s.x + s.width;
      if (s.y + s.height > maxY) maxY = s.y + s.height;
    }
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const rect = this.host().nativeElement.getBoundingClientRect();
    const padding = 80;
    const targetScale = Math.min(
      MAX_SCALE,
      Math.max(MIN_SCALE,
        Math.min(
          (rect.width - 2 * padding) / Math.max(1, maxX - minX),
          (rect.height - 2 * padding) / Math.max(1, maxY - minY),
          1
        )
      )
    );
    this.camera.set({ x: cx, y: cy, scale: targetScale });
    this.refreshViewport();
  }

  /** Pan to a specific sticker by id at the current zoom. */
  focusSticker(id: number): void {
    const s = this.stickers().find((row) => row.id === id);
    if (!s) return;
    this.camera.set({
      x: s.x + s.width / 2,
      y: s.y + s.height / 2,
      scale: this.camera().scale,
    });
    this.refreshViewport();
  }

  onPointerDown(e: PointerEvent): void {
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    this.pointerDownClient = { x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture?.(e.pointerId);
    if (this.placing()) return;

    if (this.pointers.size >= 2) {
      // Second finger down — kick off pinch and abandon any existing pan.
      this.dragging = null;
      this.panning.set(false);
      this.startPinch();
    } else {
      this.dragging = { kind: 'pan', lastX: e.clientX, lastY: e.clientY };
      this.panning.set(true);
    }
  }

  onPointerMove(e: PointerEvent): void {
    if (this.pointers.has(e.pointerId)) {
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    const placing = this.placing();
    if (placing) {
      this.lastCursor = { x: e.clientX, y: e.clientY };
      const world = this.clientToWorld(e.clientX, e.clientY);
      this.placing.set({
        ...placing,
        x: world.x - placing.width / 2,
        y: world.y - placing.height / 2,
      });
      this.ensureEdgePanLoop();
      return;
    }

    if (this.pinch) {
      this.updatePinch();
      return;
    }
    if (!this.dragging) return;
    const dx = e.clientX - this.dragging.lastX;
    const dy = e.clientY - this.dragging.lastY;
    this.dragging.lastX = e.clientX;
    this.dragging.lastY = e.clientY;
    const cam = this.camera();
    this.camera.set({ x: cam.x - dx / cam.scale, y: cam.y - dy / cam.scale, scale: cam.scale });
  }

  onPointerUp(e: PointerEvent): void {
    this.pointers.delete(e.pointerId);
    if (this.busy()) return;
    if (this.placing()) {
      // Don't confirm if multiple fingers were down (pinch / accidental).
      if (this.pointers.size > 0 || this.pinch) return;
      this.confirmPlacement();
      return;
    }
    if (this.pinch) {
      // End pinch when fewer than 2 fingers remain.
      if (this.pointers.size < 2) this.pinch = null;
      this.scheduleRefresh();
      return;
    }
    this.dragging = null;
    this.panning.set(false);
    this.scheduleRefresh();
  }

  onWheel(e: WheelEvent): void {
    e.preventDefault();
    const placing = this.placing();
    if (placing) {
      const direction = e.deltaY > 0 ? 1 : -1;
      const next = (placing.rotation + direction * ROTATE_PER_WHEEL) % 360;
      this.placing.set({ ...placing, rotation: next < 0 ? next + 360 : next });
      return;
    }
    // Scale the zoom by how much the wheel/trackpad actually moved, so a gentle
    // scroll nudges and a hard scroll still won't lurch. Clamped to a single
    // button-click's worth of zoom per event.
    const direction = Math.max(-1, Math.min(1, -e.deltaY / WHEEL_ZOOM_DIVISOR));
    this.zoom(direction, e.clientX, e.clientY);
  }

  private clientToWorld(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.host().nativeElement.getBoundingClientRect();
    const cx = clientX - rect.left - rect.width / 2;
    const cy = clientY - rect.top - rect.height / 2;
    const cam = this.camera();
    return { x: cam.x + cx / cam.scale, y: cam.y + cy / cam.scale };
  }

  // ----- viewport loading -----

  private scheduleRefresh(): void {
    if (this.refreshDebounce != null) clearTimeout(this.refreshDebounce);
    this.refreshDebounce = window.setTimeout(
      () => this.refreshViewport(),
      StickerWallComponent.REFRESH_DEBOUNCE_MS
    );
  }

  /** Read a previously-saved camera from localStorage, validated + clamped. */
  private restoreCamera(): Camera | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(StickerWallComponent.CAMERA_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (typeof parsed?.x !== 'number' || typeof parsed?.y !== 'number' || typeof parsed?.scale !== 'number') {
        return null;
      }
      return {
        x: parsed.x,
        y: parsed.y,
        scale: Math.max(MIN_SCALE, Math.min(MAX_SCALE, parsed.scale)),
      };
    } catch {
      return null;
    }
  }

  /** Persist the current camera so a reload returns to the same spot. */
  private persistCamera(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(StickerWallComponent.CAMERA_STORAGE_KEY, JSON.stringify(this.camera()));
    } catch {
      // Storage full / unavailable (private mode) — non-fatal.
    }
  }

  refreshViewport(): void {
    this.persistCamera();
    const el = this.host()?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cam = this.camera();
    const halfW = rect.width / 2 / cam.scale;
    const halfH = rect.height / 2 / cam.scale;
    const margin = 200;
    this.stickerService
      .loadViewport({
        minX: cam.x - halfW - margin,
        minY: cam.y - halfH - margin,
        maxX: cam.x + halfW + margin,
        maxY: cam.y + halfH + margin,
      })
      .subscribe({
        next: () => this.loading.set(false),
        error: () => this.loading.set(false),
      });
  }

  // ----- upload + placement -----

  openUpload(): void {
    this.notchStage.set('upload');
    this.formFile = null;
  }

  closeUpload(): void {
    this.notchStage.set('closed');
    this.formFile = null;
    this.cancelPlacement();
  }

  /** Stage navigation: upload → details (after a file is chosen). */
  onFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.formFile = input.files && input.files.length > 0 ? input.files[0] : null;
    if (this.formFile) this.notchStage.set('details');
  }

  /** Stage navigation: details → upload (re-pick file). */
  goBackToUpload(): void {
    this.notchStage.set('upload');
    this.formFile = null;
  }

  async beginPlacement(): Promise<void> {
    if (!this.formFile || !this.formUsername.trim()) return;
    const file = this.formFile;

    // Run the server-side preview so the placement preview shows the
    // cleaned-up sticker (background removed, outline added) instead of
    // the raw upload. The notch advances through processing → place.
    this.notchStage.set('processing');
    this.stickerService.preview(file).subscribe({
      next: (res) => {
        const target = 240;
        const scale = target / Math.max(res.width, res.height);
        const width = res.width * scale;
        const height = res.height * scale;
        const cam = this.camera();
        this.placing.set({
          file,
          previewUrl: res.imageDataUrl,
          alphaMask: res.alphaMask,
          naturalWidth: res.width,
          naturalHeight: res.height,
          width,
          height,
          x: cam.x - width / 2,
          y: cam.y - height / 2,
          rotation: 0,
        });
        this.notchStage.set('place');
      },
      error: (err) => {
        const msg = err?.error?.message || err?.statusText || 'Could not preview sticker';
        this.error.set(msg);
        this.notchStage.set('details');
      },
    });
  }

  cancelPlacement(): void {
    const p = this.placing();
    // previewUrl is a data: URL after the server-side preview, so nothing
    // to revoke; this branch is kept for the brief window before preview
    // resolves, where it would be a blob: URL.
    if (p && p.previewUrl.startsWith('blob:')) URL.revokeObjectURL(p.previewUrl);
    this.placing.set(null);
    this.stopEdgePanLoop();
  }

  private confirmPlacement(): void {
    const p = this.placing();
    if (!p) return;
    // Client-side guard mirroring the server check — don't even submit a spot
    // that overlaps too much; keep the preview up so the user can nudge it.
    if (this.placementInvalid()) {
      this.error.set('That spot overlaps another sticker too much — move it to a clearer area.');
      return;
    }
    const submission: SubmitStickerInput = {
      image: p.file,
      username: this.formUsername.trim(),
      email: this.formEmail.trim() || null,
      message: this.formMessage.trim() || null,
      effect: this.formEffect || null,
      x: p.x,
      y: p.y,
      rotation: p.rotation,
      width: p.width,
    };
    this.notchStage.set('submitting');
    this.stopEdgePanLoop();
    this.stickerService.submit(submission).subscribe({
      next: (created) => {
        if (p.previewUrl.startsWith('blob:')) URL.revokeObjectURL(p.previewUrl);
        this.placing.set(null);
        this.formEmail = '';
        this.formMessage = '';
        this.formEffect = '';
        this.formFile = null;
        this.stickerService.stickers.update((rows) => [...rows, created]);
        this.notchStage.set('closed');
      },
      error: (err) => {
        const msg = err?.error?.message || err?.statusText || 'Submission failed';
        this.error.set(msg);
        // Drop back to the place stage so the user can try again or cancel.
        this.notchStage.set('place');
      },
    });
  }

  private readImageDims(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({ width: 512, height: 512 });
      img.src = url;
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.refreshViewport();
  }

  // ----- hover popup + alpha-mask hit testing -----

  /**
   * Decoded alpha-mask cache. Each sticker's mask is 32 bytes (16x16 bits)
   * decoded once from base64 and reused for every hover/click hit-test.
   */
  private maskCache = new Map<number, Uint8Array>();

  private getMaskBytes(s: Sticker): Uint8Array | null {
    if (!s.alphaMask) return null;
    let cached = this.maskCache.get(s.id);
    if (cached) return cached;
    const out = decodeMask(s.alphaMask);
    this.maskCache.set(s.id, out);
    return out;
  }

  /**
   * Returns true iff the screen-space point (clientX, clientY) maps to an
   * opaque cell of the sticker's 16x16 alpha mask.
   *
   * The sticker is rendered as a rotated rectangle in world space; the
   * rectangle's bounding box in screen space catches pointer events even
   * over transparent corners. Hit testing un-rotates the world-space point
   * into the sticker's local frame, quantises to a grid cell (resolution
   * inferred from the mask), and samples the bit. Stickers without an alpha
   * mask fall through to the full bounding box.
   */
  private isPointOnSticker(s: Sticker, clientX: number, clientY: number): boolean {
    const bytes = this.getMaskBytes(s);
    if (!bytes) return true;
    const gs = gridSizeFromMask(bytes);

    const world = this.clientToWorld(clientX, clientY);
    const cx = s.x + s.width / 2;
    const cy = s.y + s.height / 2;
    const dx = world.x - cx;
    const dy = world.y - cy;

    // Un-rotate by -rotation around the sticker centre.
    const rad = -s.rotation * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const lx = dx * cos - dy * sin + s.width / 2;
    const ly = dx * sin + dy * cos + s.height / 2;
    if (lx < 0 || lx >= s.width || ly < 0 || ly >= s.height) return false;

    const gx = Math.min(gs - 1, Math.max(0, Math.floor((lx / s.width) * gs)));
    const gy = Math.min(gs - 1, Math.max(0, Math.floor((ly / s.height) * gs)));
    const bit = gy * gs + gx;
    return ((bytes[bit >> 3] >> (bit & 7)) & 1) !== 0;
  }

  onStickerMove(s: Sticker, e: MouseEvent): void {
    if (this.isPointOnSticker(s, e.clientX, e.clientY)) {
      if (this.hovered() !== s.id) this.hovered.set(s.id);
    } else if (this.hovered() === s.id) {
      this.hovered.set(null);
    }
  }

  onStickerClick(s: Sticker, e: MouseEvent): void {
    e.stopPropagation();
    // If the pointer travelled meaningfully between down and up, this was a pan
    // that started on the sticker — not a click. Don't open the inspector.
    const down = this.pointerDownClient;
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > StickerWallComponent.CLICK_MOVE_THRESHOLD) {
      return;
    }
    if (!this.isPointOnSticker(s, e.clientX, e.clientY)) return;
    this.openInspector(s, e.currentTarget as HTMLElement);
  }

  /** Keyboard activation (Enter / Space) of a focused sticker. */
  onStickerActivate(s: Sticker, e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    this.openInspector(s, e.currentTarget as HTMLElement);
  }

  /** Open the inspector for a sticker, capturing the trigger element's rect
   * for the morph animation and remembering focus for restoration on close.
   * A null trigger (e.g. a deep-link open) falls back to the plain pop-in. */
  private openInspector(s: Sticker, trigger: HTMLElement | null): void {
    this.lastFocused = trigger
      ? (trigger.ownerDocument.activeElement as HTMLElement | null)
      : null;
    this.inspectOrigin.set(trigger ? trigger.getBoundingClientRect() : null);
    this.inspect.set(s);
    this.linkCopied.set(false);
    this.syncDeepLink(s.id);
  }

  /** Close the inspector and drop the ?sticker= deep-link param. */
  closeInspector(): void {
    this.inspect.set(null);
    this.inspectOrigin.set(null);
    this.syncDeepLink(null);
  }

  /** Reflect the open sticker in the URL query string (no navigation) so the
   * page is shareable / refresh-stable. */
  private syncDeepLink(id: number | null): void {
    if (typeof window === 'undefined' || !window.history?.replaceState) return;
    const url = new URL(window.location.href);
    if (id == null) url.searchParams.delete('sticker');
    else url.searchParams.set('sticker', String(id));
    window.history.replaceState(window.history.state, '', url);
  }

  /** Copy the current (deep-linked) URL to the clipboard. */
  copyShareLink(): void {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    navigator.clipboard.writeText(window.location.href).then(
      () => {
        this.linkCopied.set(true);
        window.setTimeout(() => this.linkCopied.set(false), 2000);
      },
      () => {}
    );
  }

  /** On load, if the URL carries ?sticker=<id>, fetch it, centre it, and open
   * the inspector. Silently ignores unknown / unapproved ids. */
  private openDeepLinkTarget(): void {
    if (typeof window === 'undefined') return;
    const raw = new URL(window.location.href).searchParams.get('sticker');
    const id = raw ? Number(raw) : NaN;
    if (!Number.isFinite(id)) return;

    const existing = this.stickers().find((s) => s.id === id && s.imageUrl);
    if (existing) {
      this.focusSticker(existing.id);
      this.openInspector(existing, null);
      return;
    }
    this.stickerService.getById(id).subscribe({
      next: (s) => {
        this.stickerService.stickers.update((rows) =>
          rows.some((r) => r.id === s.id) ? rows : [...rows, s]
        );
        this.focusSticker(s.id);
        this.openInspector(s, null);
      },
      error: () => {},
    });
  }

  onStickerLeave(id: number): void {
    if (this.hovered() === id) this.hovered.set(null);
  }

  /** Trap Tab focus within the open inspector dialog. */
  onInspectorKeydown(e: KeyboardEvent): void {
    if (e.key !== 'Tab') return;
    const panel = e.currentTarget as HTMLElement;
    const focusables = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute('disabled'));
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = panel.ownerDocument.activeElement;
    if (e.shiftKey && (active === first || active === panel)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /**
   * Build the popup's transform: counter-rotate to keep text upright on
   * rotated stickers, and counter-scale by the camera zoom so the popup
   * stays the same on-screen size regardless of zoom level.
   * `translate(-50%, -8px)` first centres the popup horizontally and lifts
   * it 8 px above the sticker. `transform-origin: 50% 100%` keeps the
   * popup's bottom-centre pinned to the sticker's top-centre.
   */
  // ----- edge-pan during placement -----

  /**
   * Start the edge-pan RAF loop if it isn't already running. The loop
   * inspects the last-known cursor position each frame and pans the
   * camera proportionally to the cursor's proximity to a viewport edge.
   * Speeds are in screen pixels/frame so they feel consistent regardless
   * of zoom; we divide by `camera.scale` when applying to world coords.
   */
  private ensureEdgePanLoop(): void {
    if (this.edgePanRaf != null) return;
    const tick = () => {
      this.edgePanRaf = null;
      if (!this.placing() || !this.lastCursor) return;
      const host = this.host()?.nativeElement;
      if (!host) return;
      const rect = host.getBoundingClientRect();
      const margin = StickerWallComponent.EDGE_PAN_MARGIN;

      const distLeft = this.lastCursor.x - rect.left;
      const distRight = rect.right - this.lastCursor.x;
      const distTop = this.lastCursor.y - rect.top;
      const distBottom = rect.bottom - this.lastCursor.y;

      let dx = 0, dy = 0;
      if (distLeft < margin) dx -= this.edgePanSpeed(margin - distLeft, margin);
      if (distRight < margin) dx += this.edgePanSpeed(margin - distRight, margin);
      if (distTop < margin) dy -= this.edgePanSpeed(margin - distTop, margin);
      if (distBottom < margin) dy += this.edgePanSpeed(margin - distBottom, margin);

      if (dx !== 0 || dy !== 0) {
        const cam = this.camera();
        const wdx = dx / cam.scale;
        const wdy = dy / cam.scale;
        this.camera.set({ x: cam.x + wdx, y: cam.y + wdy, scale: cam.scale });
        // Re-sync the placement preview's world position to the (now
        // shifted) cursor, otherwise the sticker drifts away from the cursor
        // as the camera pans.
        const placing = this.placing();
        if (placing && this.lastCursor) {
          const world = this.clientToWorld(this.lastCursor.x, this.lastCursor.y);
          this.placing.set({
            ...placing,
            x: world.x - placing.width / 2,
            y: world.y - placing.height / 2,
          });
        }
        this.scheduleRefresh();
      }

      // Keep ticking while we're still placing — even with no cursor motion.
      if (this.placing()) {
        this.edgePanRaf = requestAnimationFrame(tick);
      }
    };
    this.edgePanRaf = requestAnimationFrame(tick);
  }

  /**
   * Map a "depth into the edge margin" (0..margin) to a per-frame
   * pixel speed (MIN..MAX). Linear ramp; clamped at the ends.
   */
  private edgePanSpeed(depth: number, margin: number): number {
    const t = Math.max(0, Math.min(1, depth / margin));
    return StickerWallComponent.EDGE_PAN_MIN_SPEED +
           t * (StickerWallComponent.EDGE_PAN_MAX_SPEED - StickerWallComponent.EDGE_PAN_MIN_SPEED);
  }

  private stopEdgePanLoop(): void {
    if (this.edgePanRaf != null) {
      cancelAnimationFrame(this.edgePanRaf);
      this.edgePanRaf = null;
    }
    this.lastCursor = null;
  }

  popupTransform(s: Sticker): string {
    const scale = 1 / Math.max(0.0001, this.camera().scale);
    const rot = -s.rotation;
    return `translate(-50%, -8px) rotate(${rot}deg) scale(${scale})`;
  }

  // ----- rotation dial (mobile / touch) -----

  readonly dialSize = 60;
  private static readonly DIAL_GAP = 12;
  private static readonly DIAL_EDGE_PAD = 8;
  private static readonly DIAL_DOT_RADIUS_RATIO = 0.75;

  readonly isTouch = signal(false);
  // Dial drag state — tracked via raw fields (not signals) since they
  // change on every pointermove and don't drive any reactive UI.
  private dialDrag: {
    startAngle: number;
    startRotation: number;
    centerX: number;
    centerY: number;
  } | null = null;

  /** Touch-primary (no hover) device → show the rotation dial. */
  readonly showRotationDial = computed(() => this.isTouch() && this.placing() != null);

  /** Display angle 0..359 for the dial centre label. */
  dialDisplayAngle(rotation: number): number {
    return Math.round(((rotation % 360) + 360) % 360);
  }

  /** Position of the indicator dot on the dial face. */
  dialDot(rotation: number): { x: number; y: number } {
    const r = this.dialSize / 2;
    const rad = (rotation - 90) * (Math.PI / 180);
    const dist = r * StickerWallComponent.DIAL_DOT_RADIUS_RATIO;
    return { x: r + dist * Math.cos(rad), y: r + dist * Math.sin(rad) };
  }

  /**
   * Pick a screen-space top-left for the dial. Tries to place the dial in
   * the side of the placement preview with the most remaining room (below,
   * above, right, left), then clamps to the host bounds.
   */
  readonly dialPosition = computed<{ top: number; left: number }>(() => {
    const p = this.placing();
    const host = this.host()?.nativeElement;
    if (!p || !host) return { top: 0, left: 0 };
    const rect = host.getBoundingClientRect();

    // Sticker rect in screen-relative coordinates (relative to host).
    const cam = this.camera();
    const sx = rect.width / 2 + (p.x - cam.x) * cam.scale;
    const sy = rect.height / 2 + (p.y - cam.y) * cam.scale;
    const sw = p.width * cam.scale;
    const sh = p.height * cam.scale;
    const cx = sx + sw / 2;
    const cy = sy + sh / 2;

    const D = this.dialSize;
    const G = StickerWallComponent.DIAL_GAP;
    const PAD = StickerWallComponent.DIAL_EDGE_PAD;

    const candidates = [
      { top: sy + sh + G,        left: cx - D / 2,        score: rect.height - (sy + sh + G + D) }, // below
      { top: sy - G - D,         left: cx - D / 2,        score: sy - G - D },                       // above
      { top: cy - D / 2,         left: sx + sw + G,       score: rect.width - (sx + sw + G + D) },   // right
      { top: cy - D / 2,         left: sx - G - D,        score: sx - G - D },                       // left
    ];
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];
    return {
      top: Math.max(PAD, Math.min(best.top, rect.height - D - PAD)),
      left: Math.max(PAD, Math.min(best.left, rect.width - D - PAD)),
    };
  });

  onDialPointerDown(e: PointerEvent): void {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    this.dialDrag = {
      startAngle,
      startRotation: this.placing()?.rotation ?? 0,
      centerX,
      centerY,
    };
  }

  onDialPointerMove(e: PointerEvent): void {
    if (!this.dialDrag) return;
    e.stopPropagation();
    const { centerX, centerY, startAngle, startRotation } = this.dialDrag;
    const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    const next = startRotation + (currentAngle - startAngle);
    const placing = this.placing();
    if (placing) this.placing.set({ ...placing, rotation: next });
  }

  onDialPointerUp(e: PointerEvent): void {
    if (!this.dialDrag) return;
    e.stopPropagation();
    this.dialDrag = null;
  }

  // ----- minimap -----

  readonly minimapSize = 120;
  private static readonly MINIMAP_PADDING = 8;
  private static readonly MINIMAP_ARROW_MARGIN = 10;
  private static readonly MINIMAP_MIN_VIEWPORT_FRACTION = 0.67;

  readonly minimapVisible = computed(() => this.renderable().length > 0);

  // ----- minimap navigation -----

  /** True while a minimap drag is in progress (drives the grab cursor). */
  minimapDragging = false;
  // Last pointer position in minimap coords during a drag, for delta panning.
  private minimapDragLast: { x: number; y: number } | null = null;

  /** Convert a pointer event over the minimap into minimap-space coords. */
  private minimapClientToCoords(e: PointerEvent): { x: number; y: number } {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * this.minimapSize,
      y: ((e.clientY - rect.top) / rect.height) * this.minimapSize,
    };
  }

  onMinimapPointerDown(e: PointerEvent): void {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    this.minimapDragging = true;
    const p = this.minimapClientToCoords(e);
    this.minimapDragLast = p;
    // Click-to-jump: centre the clicked world point in the viewport.
    const ms = this.minimapScale();
    const half = this.minimapSize / 2;
    const cam = this.camera();
    this.camera.set({ x: cam.x + (p.x - half) / ms, y: cam.y + (p.y - half) / ms, scale: cam.scale });
  }

  onMinimapPointerMove(e: PointerEvent): void {
    if (!this.minimapDragging || !this.minimapDragLast) return;
    e.stopPropagation();
    const p = this.minimapClientToCoords(e);
    const ms = this.minimapScale();
    const cam = this.camera();
    // Pan the camera by the drag delta, converted from minimap px to world units.
    this.camera.set({
      x: cam.x + (p.x - this.minimapDragLast.x) / ms,
      y: cam.y + (p.y - this.minimapDragLast.y) / ms,
      scale: cam.scale,
    });
    this.minimapDragLast = p;
  }

  onMinimapPointerUp(e: PointerEvent): void {
    if (!this.minimapDragging) return;
    e.stopPropagation();
    this.minimapDragging = false;
    this.minimapDragLast = null;
    this.scheduleRefresh();
  }

  /** mapScale = minimap pixels per world unit. */
  private readonly minimapScale = computed<number>(() => {
    const stickers = this.renderable();
    const host = this.host()?.nativeElement;
    const cam = this.camera();
    const inner = this.minimapSize - StickerWallComponent.MINIMAP_PADDING * 2;

    let maxExtent = 100;
    if (host) {
      const rect = host.getBoundingClientRect();
      const viewportWorld = Math.max(rect.width / cam.scale, rect.height / cam.scale);
      const minScale = (inner * StickerWallComponent.MINIMAP_MIN_VIEWPORT_FRACTION) / viewportWorld;
      maxExtent = Math.max(maxExtent, inner / (minScale * 2));
    }

    let extent = 200;
    for (const s of stickers) {
      extent = Math.max(extent, Math.abs(s.x) + s.width, Math.abs(s.y) + s.height);
    }
    if (host) {
      const rect = host.getBoundingClientRect();
      extent = Math.max(extent, rect.width / cam.scale / 2, rect.height / cam.scale / 2);
    }
    extent = Math.min(extent, maxExtent);
    return inner / (extent * 2);
  });

  /** Camera-centred mapping from world coords to minimap coords. */
  private mapToMinimap(wx: number, wy: number): { x: number; y: number } {
    const cam = this.camera();
    const half = this.minimapSize / 2;
    const ms = this.minimapScale();
    return { x: half + (wx - cam.x) * ms, y: half + (wy - cam.y) * ms };
  }

  readonly minimapOrigin = computed(() => this.mapToMinimap(0, 0));

  readonly minimapStickers = computed(() => {
    const ms = this.minimapScale();
    return this.renderable().map((s) => {
      const pos = this.mapToMinimap(s.x, s.y);
      const w = Math.max(s.width * ms, 2);
      const h = Math.max(s.height * ms, 2);
      return {
        id: s.id,
        imageUrl: s.imageUrl,
        x: pos.x, y: pos.y, w, h,
        cx: pos.x + w / 2, cy: pos.y + h / 2,
        rotation: s.rotation,
      };
    });
  });

  readonly minimapViewport = computed(() => {
    const host = this.host()?.nativeElement;
    if (!host) return null;
    const rect = host.getBoundingClientRect();
    const cam = this.camera();
    const ms = this.minimapScale();
    const half = this.minimapSize / 2;
    const w = (rect.width / cam.scale) * ms;
    const h = (rect.height / cam.scale) * ms;
    return { x: half - w / 2, y: half - h / 2, w, h };
  });

  readonly minimapArrow = computed<{ cx: number; cy: number; angle: number } | null>(() => {
    const o = this.minimapOrigin();
    const size = this.minimapSize;
    if (o.x >= 0 && o.x <= size && o.y >= 0 && o.y <= size) return null;
    const M = StickerWallComponent.MINIMAP_ARROW_MARGIN;
    const cx = Math.max(M, Math.min(size - M, o.x));
    const cy = Math.max(M, Math.min(size - M, o.y));
    const angle = (Math.atan2(o.y - cy, o.x - cx) * 180) / Math.PI;
    return { cx, cy, angle };
  });
}
