import {
  Component,
  ElementRef,
  computed,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sticker } from '../../services/sticker.service';
import { decodeMask, overlapsTooMuch } from '../sticker-wall/overlap';

interface Cam { x: number; y: number; scale: number; }

const MIN_SCALE = 0.05;
const MAX_SCALE = 3;

/**
 * Embedded admin sticker wall. Renders every sticker in place (pending ones
 * highlighted), lets the admin pan/zoom, select a sticker, drag it to a new
 * spot or rotate it, and approve / reject / delete — all visually, in context.
 */
@Component({
  selector: 'app-admin-sticker-wall',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div #host
       class="relative w-full h-[70vh] rounded-xl overflow-hidden border border-secondary-200 dark:border-secondary-700 bg-secondary-100 dark:bg-secondary-800 select-none touch-none"
       [class.cursor-grabbing]="mode() === 'pan'"
       [class.cursor-grab]="mode() !== 'pan'"
       (pointerdown)="onBackgroundPointerDown($event)"
       (pointermove)="onPointerMove($event)"
       (pointerup)="onPointerUp($event)"
       (pointercancel)="onPointerUp($event)"
       (wheel)="onWheel($event)">

    <div class="absolute left-1/2 top-1/2 will-change-transform" [style.transform]="worldTransform()">
      <!-- Origin crosshair -->
      <div class="absolute pointer-events-none opacity-20" [style.left.px]="-10" [style.top.px]="-1"
           [style.width.px]="20" [style.height.px]="2" style="background:currentColor"></div>
      <div class="absolute pointer-events-none opacity-20" [style.left.px]="-1" [style.top.px]="-10"
           [style.width.px]="2" [style.height.px]="20" style="background:currentColor"></div>

      @for (s of view(); track s.id) {
        @if (s.imageUrl) {
          <img
            class="absolute cursor-pointer rounded-[1px] select-none"
            [class.ring-2]="s.id === selectedId() || s.status === 'pending'"
            [class.ring-primary-500]="s.id === selectedId()"
            [class.ring-offset-2]="s.id === selectedId()"
            [class.ring-yellow-400]="s.status === 'pending' && s.id !== selectedId()"
            [class.opacity-90]="s.status === 'pending' && s.id !== selectedId()"
            [src]="s.imageUrl"
            [style.left.px]="s.x" [style.top.px]="s.y"
            [style.width.px]="s.width" [style.height.px]="s.height"
            [style.transform]="'rotate(' + s.rotation + 'deg)'"
            [style.transform-origin]="'center center'"
            [style.filter]="s.id === selectedId() && invalid() ? 'drop-shadow(0 0 3px rgb(239 68 68)) drop-shadow(0 0 4px rgb(239 68 68))' : null"
            style="max-width:none;max-height:none"
            draggable="false"
            (dragstart)="$event.preventDefault()"
            (pointerdown)="onStickerPointerDown(s, $event)" />
        }
      }
    </div>

    @if (!stickers().length) {
      <div class="absolute inset-0 flex items-center justify-center text-secondary-500 text-sm pointer-events-none">
        No stickers yet.
      </div>
    }

    <!-- Toolbar -->
    <div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/90 dark:bg-secondary-900/90 backdrop-blur-sm rounded-full px-2 py-1 shadow"
         (pointerdown)="$event.stopPropagation()">
      <button class="w-7 h-7 rounded-full hover:bg-secondary-200 dark:hover:bg-secondary-700 text-lg leading-none" (click)="zoom(-1)" aria-label="Zoom out">−</button>
      <span class="text-xs tabular-nums w-10 text-center">{{ (camera().scale * 100).toFixed(0) }}%</span>
      <button class="w-7 h-7 rounded-full hover:bg-secondary-200 dark:hover:bg-secondary-700 text-lg leading-none" (click)="zoom(1)" aria-label="Zoom in">+</button>
      <button class="px-2 h-7 rounded-full hover:bg-secondary-200 dark:hover:bg-secondary-700 text-xs" (click)="fitAll()">Fit all</button>
    </div>

    <!-- Selection panel -->
    @if (selected(); as sel) {
      <div class="absolute top-3 right-3 w-60 bg-white dark:bg-secondary-900 rounded-lg shadow-xl border border-secondary-200 dark:border-secondary-700 p-3 text-sm"
           (pointerdown)="$event.stopPropagation()">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="font-semibold text-secondary-900 dark:text-white truncate">{{ sel.username }}</p>
            <span class="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded"
                  [class.bg-yellow-200]="sel.status === 'pending'" [class.text-yellow-900]="sel.status === 'pending'"
                  [class.bg-green-200]="sel.status === 'approved'" [class.text-green-900]="sel.status === 'approved'">{{ sel.status }}</span>
          </div>
          <button class="text-secondary-400 hover:text-secondary-700 dark:hover:text-white text-lg leading-none" (click)="deselect()" aria-label="Deselect">×</button>
        </div>

        @if (sel.message) {
          <p class="text-xs text-secondary-500 mt-1 line-clamp-2">{{ sel.message }}</p>
        }

        <p class="text-[11px] text-secondary-500 mt-2 tabular-nums">
          ({{ sel.x | number:'1.0-0' }}, {{ sel.y | number:'1.0-0' }})
          @if (invalid()) { <span class="text-red-500">· overlaps</span> }
        </p>

        <label class="flex items-center gap-2 mt-2 text-xs text-secondary-600 dark:text-secondary-300">
          Rotate
          <input type="range" min="0" max="359" step="1" class="flex-1"
                 [value]="sel.rotation" (input)="setRotation(+$any($event.target).value)" />
          <span class="tabular-nums w-8 text-right">{{ sel.rotation | number:'1.0-0' }}°</span>
        </label>

        @if (dirty()) {
          <div class="flex gap-2 mt-2">
            <button class="flex-1 px-2 py-1 rounded bg-primary-600 hover:bg-primary-700 text-white text-xs" (click)="savePosition()">Save position</button>
            <button class="px-2 py-1 rounded bg-secondary-200 dark:bg-secondary-700 text-xs" (click)="revert()">Revert</button>
          </div>
        }

        <div class="flex gap-2 mt-2 pt-2 border-t border-secondary-200 dark:border-secondary-700">
          @if (sel.status === 'pending') {
            <button class="flex-1 px-2 py-1 rounded bg-green-500 hover:bg-green-600 text-white text-xs" (click)="approve.emit(sel.id); deselect()">Approve</button>
            <button class="flex-1 px-2 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white text-xs" (click)="reject.emit(sel.id); deselect()">Reject</button>
          }
          <button class="flex-1 px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs" (click)="remove.emit(sel.id); deselect()">Delete</button>
        </div>

        <p class="text-[10px] text-secondary-400 mt-2">Drag the sticker to move it.</p>
      </div>
    }
  </div>
  `,
})
export class AdminStickerWallComponent {
  readonly stickers = input.required<Sticker[]>();

  readonly move = output<{ id: number; x: number; y: number; rotation: number }>();
  readonly approve = output<number>();
  readonly reject = output<number>();
  readonly remove = output<number>();

  private readonly host = viewChild<ElementRef<HTMLElement>>('host');

  readonly camera = signal<Cam>({ x: 0, y: 0, scale: 0.5 });
  readonly worldTransform = computed(() => {
    const { x, y, scale } = this.camera();
    return `translate(-50%, -50%) scale(${scale}) translate(${-x}px, ${-y}px)`;
  });

  readonly selectedId = signal<number | null>(null);
  /** Local position override for the selected sticker while it's being edited. */
  readonly draft = signal<{ id: number; x: number; y: number; rotation: number } | null>(null);

  readonly mode = signal<'pan' | 'drag' | null>(null);
  private lastX = 0;
  private lastY = 0;
  private moved = false;
  private maskCache = new Map<string, Uint8Array | null>();
  private fitted = false;

  constructor() {
    // Fit the view to the stickers once both the host is rendered and the
    // (async-loaded) sticker data has arrived — whichever happens last.
    effect(() => {
      const hasStickers = this.stickers().length > 0;
      const hostReady = !!this.host();
      if (hasStickers && hostReady && !this.fitted) {
        this.fitted = true;
        this.fitAll();
      }
    });
  }

  /** Stickers merged with any in-progress draft position. */
  readonly view = computed<Sticker[]>(() => {
    const d = this.draft();
    if (!d) return this.stickers();
    return this.stickers().map((s) =>
      s.id === d.id ? { ...s, x: d.x, y: d.y, rotation: d.rotation } : s
    );
  });

  readonly selected = computed(() => {
    const id = this.selectedId();
    return id == null ? null : this.view().find((s) => s.id === id) ?? null;
  });

  readonly dirty = computed<boolean>(() => {
    const d = this.draft();
    if (!d) return false;
    const orig = this.stickers().find((s) => s.id === d.id);
    if (!orig) return false;
    return orig.x !== d.x || orig.y !== d.y || orig.rotation !== d.rotation;
  });

  readonly invalid = computed<boolean>(() => {
    const sel = this.selected();
    if (!sel) return false;
    const aMask = this.mask(sel.alphaMask);
    for (const s of this.view()) {
      if (s.id === sel.id || !s.imageUrl) continue;
      if (overlapsTooMuch(
        sel.x, sel.y, sel.width, sel.height, sel.rotation, aMask,
        s.x, s.y, s.width, s.height, s.rotation, this.mask(s.alphaMask)
      )) {
        return true;
      }
    }
    return false;
  });

  private mask(b64: string | null): Uint8Array | null {
    if (!b64) return null;
    if (!this.maskCache.has(b64)) this.maskCache.set(b64, decodeMask(b64));
    return this.maskCache.get(b64) ?? null;
  }

  // ----- selection -----

  private select(s: Sticker): void {
    if (this.selectedId() === s.id) return;
    this.selectedId.set(s.id);
    this.draft.set({ id: s.id, x: s.x, y: s.y, rotation: s.rotation });
  }

  deselect(): void {
    this.selectedId.set(null);
    this.draft.set(null);
  }

  setRotation(deg: number): void {
    const d = this.draft();
    if (d) this.draft.set({ ...d, rotation: deg });
  }

  revert(): void {
    const id = this.selectedId();
    const orig = id == null ? null : this.stickers().find((s) => s.id === id);
    if (orig) this.draft.set({ id: orig.id, x: orig.x, y: orig.y, rotation: orig.rotation });
  }

  savePosition(): void {
    const d = this.draft();
    if (d) this.move.emit({ id: d.id, x: Math.round(d.x), y: Math.round(d.y), rotation: d.rotation });
  }

  // ----- camera -----

  zoom(dir: number): void {
    const cam = this.camera();
    const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, cam.scale * Math.exp(dir * 0.2)));
    this.camera.set({ ...cam, scale });
  }

  onWheel(e: WheelEvent): void {
    e.preventDefault();
    const cam = this.camera();
    const dir = Math.max(-1, Math.min(1, -e.deltaY / 280));
    const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, cam.scale * Math.exp(dir * 0.2)));
    this.camera.set({ ...cam, scale });
  }

  fitAll(): void {
    const list = this.stickers().filter((s) => s.imageUrl);
    const host = this.host()?.nativeElement;
    if (!host) return;
    const rect = host.getBoundingClientRect();
    if (!list.length) {
      this.camera.set({ x: 0, y: 0, scale: 0.5 });
      return;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const s of list) {
      minX = Math.min(minX, s.x);
      minY = Math.min(minY, s.y);
      maxX = Math.max(maxX, s.x + s.width);
      maxY = Math.max(maxY, s.y + s.height);
    }
    const padding = 60;
    const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.min(
      (rect.width - 2 * padding) / Math.max(1, maxX - minX),
      (rect.height - 2 * padding) / Math.max(1, maxY - minY),
      1.5
    )));
    this.camera.set({ x: (minX + maxX) / 2, y: (minY + maxY) / 2, scale });
  }

  // ----- pointer -----

  onBackgroundPointerDown(e: PointerEvent): void {
    this.mode.set('pan');
    this.moved = false;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.host()?.nativeElement.setPointerCapture?.(e.pointerId);
  }

  onStickerPointerDown(s: Sticker, e: PointerEvent): void {
    e.stopPropagation();
    this.select(s);
    this.mode.set('drag');
    this.moved = false;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.host()?.nativeElement.setPointerCapture?.(e.pointerId);
  }

  onPointerMove(e: PointerEvent): void {
    const mode = this.mode();
    if (!mode) return;
    const scale = this.camera().scale;
    const dx = (e.clientX - this.lastX) / scale;
    const dy = (e.clientY - this.lastY) / scale;
    if (Math.abs(e.clientX - this.lastX) > 2 || Math.abs(e.clientY - this.lastY) > 2) this.moved = true;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    if (mode === 'pan') {
      const cam = this.camera();
      this.camera.set({ x: cam.x - dx, y: cam.y - dy, scale: cam.scale });
    } else {
      const d = this.draft();
      if (d) this.draft.set({ ...d, x: d.x + dx, y: d.y + dy });
    }
  }

  onPointerUp(e: PointerEvent): void {
    const mode = this.mode();
    this.mode.set(null);
    this.host()?.nativeElement.releasePointerCapture?.(e.pointerId);
    // A click on empty background (no drag) clears the selection.
    if (mode === 'pan' && !this.moved) this.deselect();
  }
}
