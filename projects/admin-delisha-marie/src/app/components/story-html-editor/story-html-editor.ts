import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  model,
  signal,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormValueControl } from '@angular/forms/signals';
import { RecipeService } from '../../services/recipe.service';
import { FigureDialogComponent, FigureDialogData } from '../figure-dialog/figure-dialog';

export interface FontOption {
  label: string;
  family: string;
  description?: string;
}

export type StoryTextAlign = 'left' | 'center' | 'right' | 'justify';

@Component({
  selector: 'app-story-html-editor',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatDialogModule, MatMenuModule, MatTooltipModule],
  template: `
    <div class="flex flex-col gap-2 w-full border border-[var(--mat-sys-outline)] rounded-2xl">
      <div class="flex items-center justify-between p-3">
        <span class="text-xs font-semibold uppercase tracking-wider text-white-400">
          Live Story Editor (delisha-marie style)
          @if (required()) {
            <span class="text-white-500 font-bold ml-0.5" aria-hidden="true">*</span>
          }
        </span>
        @if (isHtmlMode()) {
          <span class="text-xs text-purple-400 font-mono flex items-center gap-1.5 font-semibold">
            <span class="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
            Raw HTML Mode Active
          </span>
        } @else {
          <span class="text-xs text-white-500 italic">Visually rich text & class management</span>
        }
      </div>

      <!-- Hidden File Input for Real Image Upload -->
      <input
        #imageFileInput
        type="file"
        accept="image/*"
        class="hidden"
        (change)="onFileSelected($event)" />

      <!-- Formatting Toolbar -->
      <div class="flex flex-wrap items-center gap-1.5 p-2 bg-slate-900 shadow-lg select-none">
        <div
          class="flex flex-wrap items-center gap-1.5 flex-1"
          [class.opacity-40]="isHtmlMode()"
          [class.pointer-events-none]="isHtmlMode()">
          <!-- 1. Text Type / Heading Dropdown -->
          @if (isButtonVisible('type')) {
            <button
              type="button"
              mat-button
              [matMenuTriggerFor]="typeMenu"
              class="!h-9 !px-2.5 !rounded-xl !bg-slate-800/90 hover:!bg-slate-750 !border !border-slate-700/80 !text-slate-200 !text-xs !font-medium flex items-center gap-1.5 transition-all min-w-[125px] justify-between"
              matTooltip="Paragraph & Heading Styles">
              <span class="truncate font-medium">{{ currentTypeLabel() }}</span>
              <mat-icon class="!w-4 !h-4 !text-[18px] text-slate-400">arrow_drop_down</mat-icon>
            </button>

            <mat-menu #typeMenu="matMenu" class="story-dropdown-menu">
              <button mat-menu-item (click)="applyType('p')" class="!text-xs">
                <span class="font-normal text-sm">Normal text</span>
                <span class="text-[11px] text-slate-400 ml-auto">&lt;p&gt;</span>
              </button>
              <button
                mat-menu-item
                (click)="applyType('h1-title')"
                class="!text-xs border-t border-slate-700/50">
                <span class="font-bold text-base text-purple-300">Title</span>
                <span class="text-[11px] text-slate-400 ml-auto">h1.title</span>
              </button>
              <button mat-menu-item (click)="applyType('subtitle')" class="!text-xs">
                <span class="italic text-slate-300 text-xs">Subtitle</span>
                <span class="text-[11px] text-slate-400 ml-auto">p.subtitle</span>
              </button>
              <button
                mat-menu-item
                (click)="applyType('h1')"
                class="!text-xs border-t border-slate-700/50">
                <span class="font-bold text-sm text-white">Heading 1</span>
                <span class="text-[11px] text-slate-400 ml-auto">&lt;h1&gt;</span>
              </button>
              <button mat-menu-item (click)="applyType('h2')" class="!text-xs">
                <span class="font-bold text-sm text-slate-100">Heading 2</span>
                <span class="text-[11px] text-slate-400 ml-auto">&lt;h2&gt;</span>
              </button>
              <button mat-menu-item (click)="applyType('h3')" class="!text-xs">
                <span class="font-semibold text-xs text-slate-200">Heading 3</span>
                <span class="text-[11px] text-slate-400 ml-auto">&lt;h3&gt;</span>
              </button>
              <button
                mat-menu-item
                (click)="applyType('blockquote')"
                class="!text-xs border-t border-slate-700/50">
                <mat-icon class="!w-4 !h-4 !text-[18px] text-purple-300">format_quote</mat-icon>
                <span class="italic text-purple-300">Quote Block</span>
              </button>
              <button mat-menu-item (click)="applyType('recipe-tip')" class="!text-xs">
                <mat-icon class="!w-4 !h-4 !text-[18px] text-amber-300">lightbulb</mat-icon>
                <span class="font-medium text-amber-300">Recipe Tip Callout</span>
              </button>
            </mat-menu>
          }

          <div class="w-px h-6 bg-slate-700/80 mx-0.5"></div>

          <!-- 2. Font Family Dropdown -->
          @if (isButtonVisible('fontFamily')) {
            <button
              type="button"
              mat-button
              [matMenuTriggerFor]="fontMenu"
              class="!h-9 !px-2.5 !rounded-xl !bg-slate-800/90 hover:!bg-slate-750 !border !border-slate-700/80 !text-slate-200 !text-xs !font-medium flex items-center gap-1.5 transition-all min-w-[130px] justify-between"
              matTooltip="Font Family">
              <span class="truncate font-medium">{{ currentFontLabel() }}</span>
              <mat-icon class="!w-4 !h-4 !text-[18px] text-slate-400">arrow_drop_down</mat-icon>
            </button>

            <mat-menu #fontMenu="matMenu" class="story-dropdown-menu">
              @for (font of fontFamilies; track font.family) {
                <button
                  mat-menu-item
                  (click)="applyFontFamily(font.family, font.label)"
                  class="!text-xs flex items-center justify-between">
                  <span [style.font-family]="font.family" class="text-sm">{{ font.label }}</span>
                  @if (font.description) {
                    <span class="text-[10px] text-slate-400 ml-3">{{ font.description }}</span>
                  }
                </button>
              }
            </mat-menu>
          }

          <!-- 3. Font Size Stepper & Dropdown -->
          @if (isButtonVisible('fontSize')) {
            <div
              class="flex items-center rounded-xl bg-slate-800/90 border border-slate-700/80 overflow-hidden h-9">
              <button
                type="button"
                mat-icon-button
                class="!w-7 !h-full !rounded-none text-slate-300 hover:text-white"
                (click)="changeFontSize(-2)"
                matTooltip="Decrease font size (-2px)">
                <mat-icon class="!w-4 !h-4 !text-[16px]">remove</mat-icon>
              </button>

              <button
                type="button"
                mat-button
                [matMenuTriggerFor]="sizeMenu"
                class="!h-full !px-2 !rounded-none !text-xs !font-semibold !text-slate-200 hover:!bg-slate-700/80 border-x border-slate-700/60 min-w-[36px] justify-center"
                matTooltip="Font size">
                <span>{{ currentFontSize() }}</span>
              </button>

              <mat-menu #sizeMenu="matMenu" class="story-dropdown-menu min-w-[70px]">
                @for (size of fontSizes; track size) {
                  <button
                    mat-menu-item
                    (click)="applyFontSize(size)"
                    class="!text-xs !text-center"
                    [class.text-purple-300]="currentFontSize() === size">
                    {{ size }}
                  </button>
                }
              </mat-menu>

              <button
                type="button"
                mat-icon-button
                class="!w-7 !h-full !rounded-none text-slate-300 hover:text-white"
                (click)="changeFontSize(2)"
                matTooltip="Increase font size (+2px)">
                <mat-icon class="!w-4 !h-4 !text-[16px]">add</mat-icon>
              </button>
            </div>
          }

          <div class="w-px h-6 bg-slate-700/80 mx-0.5"></div>

          <!-- 4. Inline Formatting (B, I, U, S, Highlight, Code) -->
          @if (isButtonVisible('bold')) {
            <button
              type="button"
              mat-icon-button
              class="!w-8 !h-8 text-slate-300 hover:text-white"
              (click)="execCmd('bold')"
              matTooltip="Bold (Ctrl+B)">
              <mat-icon class="!w-4 !h-4 !text-[18px]">format_bold</mat-icon>
            </button>
          }
          @if (isButtonVisible('italic')) {
            <button
              type="button"
              mat-icon-button
              class="!w-8 !h-8 text-slate-300 hover:text-white"
              (click)="execCmd('italic')"
              matTooltip="Italic (Ctrl+I)">
              <mat-icon class="!w-4 !h-4 !text-[18px]">format_italic</mat-icon>
            </button>
          }
          @if (isButtonVisible('underline')) {
            <button
              type="button"
              mat-icon-button
              class="!w-8 !h-8 text-slate-300 hover:text-white"
              (click)="execCmd('underline')"
              matTooltip="Underline (Ctrl+U)">
              <mat-icon class="!w-4 !h-4 !text-[18px]">format_underlined</mat-icon>
            </button>
          }
          @if (isButtonVisible('strikeThrough')) {
            <button
              type="button"
              mat-icon-button
              class="!w-8 !h-8 text-slate-300 hover:text-white"
              (click)="execCmd('strikeThrough')"
              matTooltip="Strikethrough">
              <mat-icon class="!w-4 !h-4 !text-[18px]">strikethrough_s</mat-icon>
            </button>
          }
          @if (isButtonVisible('highlight')) {
            <button
              type="button"
              mat-icon-button
              class="!w-8 !h-8 text-amber-300/90 hover:text-amber-200"
              (click)="execCmd('highlight')"
              matTooltip="Highlight text">
              <mat-icon class="!w-4 !h-4 !text-[18px]">border_color</mat-icon>
            </button>
          }
          @if (isButtonVisible('code')) {
            <button
              type="button"
              mat-icon-button
              class="!w-8 !h-8 text-slate-300 hover:text-white"
              (click)="execCmd('code')"
              matTooltip="Inline code">
              <mat-icon class="!w-4 !h-4 !text-[18px]">code</mat-icon>
            </button>
          }

          <div class="w-px h-6 bg-slate-700/80 mx-0.5"></div>

          <!-- 5. Alignments Dropdown -->
          @if (isButtonVisible('align')) {
            <button
              type="button"
              mat-button
              [matMenuTriggerFor]="alignMenu"
              class="!h-9 !px-2 !rounded-xl !bg-slate-800/90 hover:!bg-slate-750 !border !border-slate-700/80 !text-slate-200 flex items-center gap-1 transition-all"
              matTooltip="Text Alignment">
              <mat-icon class="!w-4 !h-4 !text-[18px]">
                @switch (currentAlign()) {
                  @case ('center') {
                    format_align_center
                  }
                  @case ('right') {
                    format_align_right
                  }
                  @case ('justify') {
                    format_align_justify
                  }
                  @default {
                    format_align_left
                  }
                }
              </mat-icon>
              <mat-icon class="!w-3 !h-3 !text-[16px] text-slate-400">arrow_drop_down</mat-icon>
            </button>

            <mat-menu #alignMenu="matMenu" class="story-dropdown-menu">
              <button mat-menu-item (click)="applyAlignment('left')" class="!text-xs">
                <mat-icon class="!w-4 !h-4 !text-[18px]">format_align_left</mat-icon>
                <span>Align Left</span>
              </button>
              <button mat-menu-item (click)="applyAlignment('center')" class="!text-xs">
                <mat-icon class="!w-4 !h-4 !text-[18px]">format_align_center</mat-icon>
                <span>Align Center</span>
              </button>
              <button mat-menu-item (click)="applyAlignment('right')" class="!text-xs">
                <mat-icon class="!w-4 !h-4 !text-[18px]">format_align_right</mat-icon>
                <span>Align Right</span>
              </button>
              <button mat-menu-item (click)="applyAlignment('justify')" class="!text-xs">
                <mat-icon class="!w-4 !h-4 !text-[18px]">format_align_justify</mat-icon>
                <span>Justify</span>
              </button>
            </mat-menu>
          }

          <!-- 6. Bullet List with Variants Menu -->
          @if (isButtonVisible('bulletList')) {
            <div
              class="flex items-center rounded-xl bg-slate-800/90 border border-slate-700/80 overflow-hidden h-9">
              <button
                type="button"
                mat-icon-button
                class="!w-8 !h-full !rounded-none text-slate-300 hover:text-white"
                (click)="execCmd('insertUnorderedList')"
                matTooltip="Bulleted List">
                <mat-icon class="!w-4 !h-4 !text-[18px]">format_list_bulleted</mat-icon>
              </button>
              <button
                type="button"
                mat-icon-button
                [matMenuTriggerFor]="bulletMenu"
                class="!w-4 !h-full !rounded-none !p-0 border-l border-slate-700/60 text-slate-400 hover:text-white"
                matTooltip="Bullet styles">
                <mat-icon class="!w-3 !h-3 !text-[16px]">arrow_drop_down</mat-icon>
              </button>
            </div>

            <mat-menu #bulletMenu="matMenu" class="story-dropdown-menu">
              <button mat-menu-item (click)="applyBulletList('disc')" class="!text-xs">
                <span class="text-base leading-none text-purple-400 mr-2">•</span>
                <span>Disc (Default filled)</span>
              </button>
              <button mat-menu-item (click)="applyBulletList('circle')" class="!text-xs">
                <span class="text-base leading-none text-purple-400 mr-2">○</span>
                <span>Circle (Hollow)</span>
              </button>
              <button mat-menu-item (click)="applyBulletList('square')" class="!text-xs">
                <span class="text-base leading-none text-purple-400 mr-2">■</span>
                <span>Square (Filled)</span>
              </button>
            </mat-menu>
          }

          <!-- 7. Numbered List with Variants Menu -->
          @if (isButtonVisible('numberedList')) {
            <div
              class="flex items-center rounded-xl bg-slate-800/90 border border-slate-700/80 overflow-hidden h-9">
              <button
                type="button"
                mat-icon-button
                class="!w-8 !h-full !rounded-none text-slate-300 hover:text-white"
                (click)="execCmd('insertOrderedList')"
                matTooltip="Numbered List">
                <mat-icon class="!w-4 !h-4 !text-[18px]">format_list_numbered</mat-icon>
              </button>
              <button
                type="button"
                mat-icon-button
                [matMenuTriggerFor]="numberMenu"
                class="!w-4 !h-full !rounded-none !p-0 border-l border-slate-700/60 text-slate-400 hover:text-white"
                matTooltip="Numbering styles">
                <mat-icon class="!w-3 !h-3 !text-[16px]">arrow_drop_down</mat-icon>
              </button>
            </div>

            <mat-menu #numberMenu="matMenu" class="story-dropdown-menu">
              <button mat-menu-item (click)="applyNumberedList('decimal')" class="!text-xs">
                <span class="font-mono text-purple-400 text-xs font-bold mr-2">1. 2. 3.</span>
                <span>Numbers (Decimal)</span>
              </button>
              <button mat-menu-item (click)="applyNumberedList('lower-alpha')" class="!text-xs">
                <span class="font-mono text-purple-400 text-xs font-bold mr-2">a. b. c.</span>
                <span>Lowercase Letters</span>
              </button>
              <button mat-menu-item (click)="applyNumberedList('upper-alpha')" class="!text-xs">
                <span class="font-mono text-purple-400 text-xs font-bold mr-2">A. B. C.</span>
                <span>Uppercase Letters</span>
              </button>
              <button mat-menu-item (click)="applyNumberedList('lower-roman')" class="!text-xs">
                <span class="font-mono text-purple-400 text-xs font-bold mr-2">i. ii. iii.</span>
                <span>Roman Numerals</span>
              </button>
            </mat-menu>
          }

          <!-- 8. Increase & Decrease Indents -->
          @if (isButtonVisible('indent')) {
            <button
              type="button"
              mat-icon-button
              class="!w-8 !h-8 text-slate-300 hover:text-white"
              (click)="adjustIndent('decrease')"
              matTooltip="Decrease indent">
              <mat-icon class="!w-4 !h-4 !text-[18px]">format_indent_decrease</mat-icon>
            </button>
            <button
              type="button"
              mat-icon-button
              class="!w-8 !h-8 text-slate-300 hover:text-white"
              (click)="adjustIndent('increase')"
              matTooltip="Increase indent">
              <mat-icon class="!w-4 !h-4 !text-[18px]">format_indent_increase</mat-icon>
            </button>
          }

          <div class="w-px h-6 bg-slate-700/80 mx-0.5"></div>

          <!-- 9. CLASS COLLECTOR & ERASER (Option 1 & 2) -->
          @if (isButtonVisible('classes')) {
            <button
              type="button"
              mat-button
              [matMenuTriggerFor]="classMenu"
              (menuOpened)="onClassMenuOpened()"
              class="!h-9 !px-2.5 !rounded-xl !bg-indigo-950/70 hover:!bg-indigo-900/80 !border !border-indigo-500/50 !text-indigo-200 !text-xs !font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              matTooltip="Collect, view, apply, or erase CSS classes on selected element">
              <mat-icon class="!w-4 !h-4 !text-[18px] text-indigo-400">style</mat-icon>
              <span>Classes</span>
              <mat-icon class="!w-3 !h-3 !text-[16px] text-indigo-300">arrow_drop_down</mat-icon>
            </button>

            <mat-menu #classMenu="matMenu" class="story-class-inspector-menu !p-0">
              <div
                class="p-3 w-72 bg-slate-900 border border-slate-700 rounded-xl text-xs flex flex-col gap-2.5"
                tabindex="0"
                (keydown.enter)="$event.stopPropagation()"
                (click)="$event.stopPropagation()">
                <div class="flex items-center justify-between pb-1.5 border-b border-slate-700/80">
                  <span class="font-bold text-white flex items-center gap-1.5">
                    <mat-icon class="!w-4 !h-4 !text-[16px] text-indigo-400">style</mat-icon>
                    <span>CSS Class Inspector</span>
                  </span>
                  <span
                    class="font-mono text-[11px] text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded">
                    {{ inspectedElementTag() }}
                  </span>
                </div>

                <!-- Applied Classes on Selected Node -->
                <div>
                  <span class="text-[11px] text-slate-400 block mb-1"
                    >Applied to this element:</span
                  >
                  <div
                    class="flex flex-wrap gap-1 min-h-[28px] p-1.5 rounded-lg bg-slate-950/80 border border-slate-800">
                    @for (cls of inspectedClasses(); track cls) {
                      <span
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-900/70 text-indigo-200 border border-indigo-700/60 text-[11px] font-mono">
                        {{ cls }}
                        <button
                          type="button"
                          class="text-slate-400 hover:text-white cursor-pointer ml-0.5"
                          (click)="removeClassFromInspected(cls)"
                          title="Remove class">
                          ✕
                        </button>
                      </span>
                    } @empty {
                      <span class="text-slate-500 text-[11px] italic">No custom classes</span>
                    }
                  </div>
                </div>

                <!-- Add Custom Class Input -->
                <div class="flex items-center gap-1.5">
                  <input
                    #customClassInput
                    type="text"
                    placeholder="Type class name (e.g. drop-cap)"
                    class="w-full bg-slate-950 border border-slate-700 text-white text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-indigo-400"
                    (keydown.enter)="addClassFromInput(customClassInput)" />
                  <button
                    type="button"
                    (click)="addClassFromInput(customClassInput)"
                    class="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs whitespace-nowrap cursor-pointer">
                    Add
                  </button>
                </div>

                <!-- Quick Presets -->
                <div>
                  <span class="text-[11px] text-slate-400 block mb-1">Quick Presets:</span>
                  <div class="flex flex-wrap gap-1">
                    <button
                      type="button"
                      (click)="applyFirstLetterDropCap()"
                      class="px-2 py-0.5 bg-slate-800 hover:bg-purple-600 hover:text-white rounded text-[11px] text-slate-300 transition-colors cursor-pointer border border-slate-700">
                      + First-Letter Drop Cap
                    </button>
                    <button
                      type="button"
                      (click)="addClassToInspected('text-center')"
                      class="px-2 py-0.5 bg-slate-800 hover:bg-purple-600 hover:text-white rounded text-[11px] text-slate-300 transition-colors cursor-pointer border border-slate-700">
                      + text-center
                    </button>
                    <button
                      type="button"
                      (click)="addClassToInspected('lead')"
                      class="px-2 py-0.5 bg-slate-800 hover:bg-purple-600 hover:text-white rounded text-[11px] text-slate-300 transition-colors cursor-pointer border border-slate-700">
                      + lead
                    </button>
                  </div>
                </div>

                <!-- Previous / Story Classes Shelf (LocalStorage + Document Scanned) -->
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-[11px] text-slate-400">Previous / Story Classes:</span>
                    <span class="text-[10px] text-indigo-400 italic">Click to apply</span>
                  </div>
                  <div
                    class="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
                    @for (libCls of availableClassLibrary(); track libCls) {
                      <button
                        type="button"
                        (click)="addClassToInspected(libCls)"
                        [disabled]="inspectedClasses().includes(libCls)"
                        class="px-1.5 py-0.5 rounded text-[10px] font-mono border transition-colors cursor-pointer"
                        [class.bg-purple-950]="inspectedClasses().includes(libCls)"
                        [class.text-purple-300]="inspectedClasses().includes(libCls)"
                        [class.border-purple-800]="inspectedClasses().includes(libCls)"
                        [class.opacity-50]="inspectedClasses().includes(libCls)"
                        [class.bg-slate-850]="!inspectedClasses().includes(libCls)"
                        [class.hover:bg-indigo-600]="!inspectedClasses().includes(libCls)"
                        [class.text-slate-300]="!inspectedClasses().includes(libCls)"
                        [class.hover:text-white]="!inspectedClasses().includes(libCls)"
                        [class.border-slate-700]="!inspectedClasses().includes(libCls)">
                        + {{ libCls }}
                      </button>
                    }
                  </div>
                </div>

                <!-- Erase Classes Action -->
                <div class="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    (click)="eraseAllClassesFromInspected()"
                    class="text-rose-400 hover:text-rose-300 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer bg-transparent border-0 p-0">
                    <mat-icon class="!w-4 !h-4 !text-[16px]">delete_sweep</mat-icon>
                    <span>Erase All Classes</span>
                  </button>
                </div>
              </div>
            </mat-menu>
          }

          <div class="w-px h-6 bg-slate-700/80 mx-0.5"></div>

          <!-- 10. Links, Media, HR, Clear Formatting -->
          @if (isButtonVisible('link')) {
            <button
              type="button"
              mat-icon-button
              class="!w-8 !h-8 text-slate-300 hover:text-white"
              (click)="promptLink()"
              matTooltip="Insert Link">
              <mat-icon class="!w-4 !h-4 !text-[18px]">link</mat-icon>
            </button>
          }
          @if (isButtonVisible('image')) {
            <button
              type="button"
              mat-icon-button
              class="!w-8 !h-8 text-slate-300 hover:text-white"
              (click)="triggerImageUpload()"
              matTooltip="Upload & Insert Image">
              <mat-icon class="!w-4 !h-4 !text-[18px]">image</mat-icon>
            </button>
          }
          @if (isButtonVisible('figure')) {
            <button
              type="button"
              mat-icon-button
              class="!w-8 !h-8 text-slate-300 hover:text-white"
              (click)="openFigureDialog()"
              matTooltip="Configure Figure & Caption">
              <mat-icon class="!w-4 !h-4 !text-[18px]">subtitles</mat-icon>
            </button>
          }
          @if (isButtonVisible('horizontalRule')) {
            <button
              type="button"
              mat-icon-button
              class="!w-8 !h-8 text-slate-300 hover:text-white"
              (click)="execCmd('insertHorizontalRule')"
              matTooltip="Horizontal Divider">
              <mat-icon class="!w-4 !h-4 !text-[18px]">horizontal_rule</mat-icon>
            </button>
          }
          @if (isButtonVisible('clearFormat')) {
            <button
              type="button"
              mat-icon-button
              class="!w-8 !h-8 text-rose-300 hover:text-rose-200"
              (click)="execCmd('removeFormat')"
              matTooltip="Clear Formatting">
              <mat-icon class="!w-4 !h-4 !text-[18px]">format_clear</mat-icon>
            </button>
          }
        </div>

        <div class="w-px h-6 bg-slate-700/80 mx-0.5"></div>

        <!-- 15. HTML Source Code Button -->
        @if (isButtonVisible('html')) {
          <button
            type="button"
            mat-button
            data-testid="html-toggle-btn"
            matTooltip="Edit HTML Source Code"
            class="!h-8 !px-2.5 !rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border shadow-sm"
            [class]="
              isHtmlMode()
                ? '!bg-purple-600 hover:!bg-purple-500 !text-white !border-purple-400 ring-2 ring-purple-400/50'
                : '!bg-slate-800/90 hover:!bg-slate-750 !text-slate-300 hover:!text-white !border-slate-700/80'
            "
            (click)="toggleHtmlMode()">
            <mat-icon class="!w-4 !h-4 !text-[18px]">html</mat-icon>
            <span class="font-mono text-[11px] font-bold">{{
              isHtmlMode() ? 'Visual' : 'HTML'
            }}</span>
          </button>
        }
      </div>

      <!-- Editable Canvas (styled as story from delisha-marie) -->
      <div
        #editorCanvas
        [class.hidden]="isHtmlMode()"
        contenteditable="true"
        (input)="onInput()"
        (blur)="onInput()"
        (click)="onCanvasClick($event)"
        (keyup)="onCanvasClick($event)"
        class="story text-lg md:text-xl text-slate-200 leading-relaxed font-serif p-6 rounded-2xl bg-slate-900/60 min-h-[250px] max-h-[600px] overflow-y-auto focus:outline-none transition-all"></div>

      <!-- Raw HTML Source Code Textarea -->
      <textarea
        #htmlTextarea
        [class.hidden]="!isHtmlMode()"
        [value]="rawHtmlValue()"
        (input)="onHtmlSourceInput($event)"
        (blur)="onHtmlSourceInput($event)"
        placeholder="Type or paste HTML markup here..."
        rows="12"
        spellcheck="false"
        class="w-full p-6 rounded-2xl bg-slate-950 font-mono text-sm leading-relaxed text-emerald-300 border border-purple-500/60 min-h-[250px] max-h-[600px] overflow-y-auto focus:outline-none focus:ring-2 focus:ring-purple-500/80 transition-all resize-y selection:bg-purple-900 selection:text-white"></textarea>
    </div>
  `,
  styles: [
    `
      .story p {
        margin-bottom: 1.5rem;
      }
      .story p:last-child {
        margin-bottom: 0;
      }
      .story h1.story-title,
      .story h1 {
        font-size: 2.25rem;
        font-weight: 800;
        margin-top: 2rem;
        margin-bottom: 1rem;
        line-height: 1.25;
        color: #f8fafc;
      }
      .story .story-subtitle {
        font-size: 1.25rem;
        font-weight: 400;
        color: #94a3b8;
        font-style: italic;
        margin-top: -0.25rem;
        margin-bottom: 1.5rem;
      }
      .story .story-first-letter,
      .story .drop-cap {
        font-size: 3.5rem;
        line-height: 0.85;
        font-weight: 900;
        float: left;
        margin-right: 0.65rem;
        margin-top: 0.15rem;
        color: #c084fc;
        font-family: 'Playfair Display', Georgia, serif;
      }
      .story h2 {
        font-size: 1.75rem;
        font-weight: 700;
        margin-top: 2rem;
        margin-bottom: 1rem;
        color: #f8fafc;
      }
      .story h3 {
        font-size: 1.35rem;
        font-weight: 600;
        margin-top: 1.5rem;
        margin-bottom: 0.75rem;
        color: #f1f5f9;
      }
      .story h4 {
        font-size: 1.15rem;
        font-weight: 600;
        margin-top: 1.25rem;
        margin-bottom: 0.5rem;
        color: #e2e8f0;
      }
      .story blockquote {
        border-left: 4px solid #a855f7;
        padding-left: 1rem;
        font-style: italic;
        margin: 1.5rem 0;
        color: #cbd5e1;
      }
      .story .recipe-tip {
        background: rgba(168, 85, 247, 0.12);
        border-left: 4px solid #c084fc;
        border-radius: 0.75rem;
        padding: 1rem 1.25rem;
        margin: 1.5rem 0;
        color: #f1f5f9;
      }
      .story mark {
        background: rgba(250, 204, 21, 0.25);
        color: #fef08a;
        padding: 0.1rem 0.35rem;
        border-radius: 0.25rem;
      }
      .story code {
        background: rgba(30, 41, 59, 0.85);
        color: #e2e8f0;
        padding: 0.15rem 0.4rem;
        border-radius: 0.35rem;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 0.9em;
      }
      .story hr {
        border: 0;
        border-top: 1px solid rgba(148, 163, 184, 0.3);
        margin: 2rem 0;
      }
      .story ul {
        list-style-type: disc;
        padding-left: 1.5rem;
        margin-bottom: 1.5rem;
      }
      .story ol {
        list-style-type: decimal;
        padding-left: 1.5rem;
        margin-bottom: 1.5rem;
      }
      .story a {
        color: #c084fc;
        text-decoration: underline;
      }
      .story img {
        max-width: 100%;
        height: auto;
        border-radius: 1rem;
        margin: 1.5rem 0;
        cursor: pointer;
        transition:
          outline 0.2s ease,
          box-shadow 0.2s ease;
      }
      .story figure {
        margin: 1.5rem 0;
        cursor: pointer;
        transition:
          outline 0.2s ease,
          box-shadow 0.2s ease;
      }
      .story figure.recipe-gallery {
        display: grid;
        grid-template-columns: repeat(1, minmax(0, 1fr));
        gap: 1.5rem;
        margin: 2rem 0;
        align-items: start;
      }
      .story figure.recipe-gallery:has(.column-2),
      .story figure.recipe-gallery.column-2,
      .story figure.column-2 {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 1.25rem;
        align-items: start;
      }
      .story figure.recipe-gallery:has(.column-3),
      .story figure.recipe-gallery.column-3,
      .story figure.column-3 {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 1rem;
        align-items: start;
      }
      .story figure.recipe-step-image,
      .story figure.recipe-image {
        margin: 0.5rem 0;
      }
      .story figure.recipe-step-image img,
      .story figure.recipe-image img {
        width: 100%;
        height: auto;
        object-fit: cover;
        border-radius: 0.75rem;
      }
      .story img:hover,
      .story figure:hover {
        outline: 2px dashed #c084fc;
        outline-offset: 4px;
      }
      .story img.active-highlight,
      .story figure.active-highlight {
        outline: 3px solid #a855f7 !important;
        outline-offset: 6px !important;
        box-shadow: 0 0 25px rgba(168, 85, 247, 0.6) !important;
        border-radius: 1rem;
      }
      .story figcaption {
        font-size: 0.875rem;
        line-height: 1.25rem;
        color: #94a3b8;
        margin-top: 0.5rem;
        text-align: center;
        font-style: italic;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoryHtmlEditorComponent implements FormValueControl<string> {
  // FormValueControl value signal for [formField] binding
  readonly value = model<string>('');
  readonly required = input<boolean>(false);

  /**
   * Hide buttons via parent input:
   * <app-story-html-editor [hiddenButtons]="['code', 'figure', 'highlight']" />
   */
  readonly hiddenButtons = input<string[]>([]);

  /**
   * Hide buttons directly inside story-html-editor.ts without deleting any code!
   * Simply add button names to this array to turn them off:
   *
   * Available button names (case-insensitive & supports aliases):
   * 'type', 'fontFamily', 'fontSize', 'bold', 'italic', 'underline',
   * 'strikeThrough', 'highlight', 'code', 'align', 'bulletList',
   * 'numberedList', 'indent', 'classes', 'link', 'image', 'figure',
   * 'horizontalRule', 'clearFormat', 'html'
   */
  readonly disabledButtons = signal<string[]>([
    // Example: uncomment any button name below to turn it off without deleting code:
    // 'code',
    // 'highlight',
  ]);

  // Alias getter for backward compatibility / tests
  get content() {
    return this.value;
  }

  // Modern viewChild signals
  readonly editorCanvas = viewChild<ElementRef<HTMLDivElement>>('editorCanvas');
  readonly htmlTextarea = viewChild<ElementRef<HTMLTextAreaElement>>('htmlTextarea');
  readonly imageFileInput = viewChild<ElementRef<HTMLInputElement>>('imageFileInput');

  // HTML source mode state signals
  readonly isHtmlMode = signal<boolean>(false);
  readonly rawHtmlValue = signal<string>('');

  private readonly recipeService = inject(RecipeService, { optional: true });
  private readonly dialog = inject(MatDialog);

  private readonly baseUrl = 'https://ik.imagekit.io/delishamarie';
  private readonly LOCAL_STORAGE_KEY = 'dm_story_class_history';

  // Toolbar state signals
  readonly currentTypeLabel = signal<string>('Normal text');
  readonly currentFontLabel = signal<string>('Merriweather');
  readonly currentFontSize = signal<number>(18);
  readonly currentAlign = signal<StoryTextAlign>('left');

  // Class Inspector state signals
  readonly inspectedElementTag = signal<string>('<p>');
  readonly inspectedClasses = signal<string[]>([]);
  readonly classHistory = signal<string[]>([]);
  readonly scannedDocumentClasses = signal<string[]>([]);

  // Font family options
  readonly fontFamilies: FontOption[] = [
    {
      label: 'Merriweather',
      family: "'Merriweather', Georgia, serif",
      description: 'Serif (Default)',
    },
    {
      label: 'Playfair Display',
      family: "'Playfair Display', Georgia, serif",
      description: 'Elegant Serif',
    },
    { label: 'Inter', family: "'Inter', sans-serif", description: 'Modern Sans' },
    { label: 'Outfit', family: "'Outfit', sans-serif", description: 'Display' },
    { label: 'Roboto', family: "'Roboto', sans-serif", description: 'Clean Sans' },
    { label: 'Monospace', family: 'ui-monospace, monospace', description: 'Code' },
  ];

  // Font size presets
  readonly fontSizes: number[] = [12, 14, 16, 18, 20, 24, 28, 32, 36];

  // Combined library of available classes (localStorage history + document scanned)
  readonly availableClassLibrary = signal<string[]>([
    'story-first-letter',
    'drop-cap',
    'story-title',
    'story-subtitle',
    'recipe-tip',
    'text-center',
    'text-right',
    'lead',
    'font-serif',
    'tracking-wide',
    'shadow-sm',
  ]);

  isButtonVisible(name: string): boolean {
    const hidden = new Set<string>([
      ...this.hiddenButtons().map((b) => b.toLowerCase()),
      ...this.disabledButtons().map((b) => b.toLowerCase()),
    ]);
    const normalized = name.toLowerCase();
    if (hidden.has(normalized)) return false;

    // Aliases support so any naming convention works
    const aliases: Record<string, string[]> = {
      type: ['types', 'heading', 'headings'],
      fontfamily: ['fonts', 'font', 'font-family'],
      fontsize: ['sizes', 'size', 'font-size'],
      strikethrough: ['strike', 'strike-through'],
      horizontalrule: ['divider', 'hr', 'horizontal-rule', 'horizontal_rule'],
      clearformat: ['removeformat', 'clear', 'clear-format', 'remove-format'],
      classes: ['classinspector', 'classcollector', 'class-inspector', 'class-collector'],
      bulletlist: ['bullets', 'unorderedlist', 'bullet-list', 'bullet_list'],
      numberedlist: ['numbers', 'orderedlist', 'numbered-list', 'numbered_list'],
      align: ['alignment', 'textalign', 'text-align'],
      indent: ['indents', 'indentation'],
      html: ['source', 'codeview', 'sourcecode', 'htmlview', 'rawhtml', 'raw-html', 'html-source'],
    };

    for (const [key, aliasList] of Object.entries(aliases)) {
      if (normalized === key && aliasList.some((a) => hidden.has(a))) return false;
      if (aliasList.includes(normalized) && hidden.has(key)) return false;
    }

    return true;
  }

  constructor() {
    this.loadClassHistory();
  }

  // Sync model signal changes into DOM contenteditable when different
  private readonly _syncEffect = effect(() => {
    const rawValue = this.value();
    const canvasEl = this.editorCanvas()?.nativeElement;
    if (canvasEl) {
      const formatted = this.resolveImageSrc(rawValue || '');
      const currentClean = this.stripImageBaseUrl(canvasEl.innerHTML);
      if (currentClean !== rawValue && canvasEl.innerHTML !== formatted) {
        untracked(() => {
          canvasEl.innerHTML = formatted;
        });
      }
    }
    if (this.isHtmlMode()) {
      const currentText = this.rawHtmlValue();
      if (this.stripImageBaseUrl(currentText) !== rawValue) {
        untracked(() => {
          this.rawHtmlValue.set(this.formatHtmlForEditor(rawValue || ''));
        });
      }
    }
  });

  onCanvasClick(event: Event): void {
    const canvasEl = this.editorCanvas()?.nativeElement;
    if (!canvasEl) return;

    const highlighted = canvasEl.querySelectorAll('.active-highlight');
    highlighted.forEach((el) => el.classList.remove('active-highlight'));

    const target = event.target as HTMLElement;
    if (target && canvasEl.contains(target)) {
      const imgOrFigure = target.closest('img') || target.closest('figure');
      if (imgOrFigure) {
        imgOrFigure.classList.add('active-highlight');
      }
    }

    this.updateToolbarStateFromSelection(target);
  }

  private updateToolbarStateFromSelection(targetEl?: HTMLElement): void {
    const canvasEl = this.editorCanvas()?.nativeElement;
    if (!canvasEl) return;

    let block: HTMLElement | null = null;
    if (targetEl && canvasEl.contains(targetEl) && targetEl !== canvasEl) {
      block = this.findDirectBlockFromElement(canvasEl, targetEl);
    }
    if (!block) {
      const range = this.getActiveRangeInCanvas(canvasEl);
      block = this.findDirectBlockChild(canvasEl, range);
    }
    if (block) {
      const tag = block.tagName.toLowerCase();
      if (block.classList.contains('story-title')) {
        this.currentTypeLabel.set('Title');
      } else if (block.classList.contains('story-subtitle')) {
        this.currentTypeLabel.set('Subtitle');
      } else if (block.classList.contains('recipe-tip')) {
        this.currentTypeLabel.set('Recipe Tip');
      } else if (tag === 'h1') {
        this.currentTypeLabel.set('Heading 1');
      } else if (tag === 'h2') {
        this.currentTypeLabel.set('Heading 2');
      } else if (tag === 'h3') {
        this.currentTypeLabel.set('Heading 3');
      } else if (tag === 'blockquote') {
        this.currentTypeLabel.set('Quote');
      } else {
        this.currentTypeLabel.set('Normal text');
      }

      const align = block.style.textAlign as StoryTextAlign;
      this.currentAlign.set(align || 'left');
    }
  }

  // --- Typography & Formatting Commands ---

  applyType(type: string): void {
    const canvasEl = this.editorCanvas()?.nativeElement;
    if (!canvasEl) return;

    const range = this.getActiveRangeInCanvas(canvasEl);

    switch (type) {
      case 'h1-title':
        this.applyBlockTag(canvasEl, range, 'h1', 'story-title');
        this.currentTypeLabel.set('Title');
        break;
      case 'subtitle':
        this.applyBlockTag(canvasEl, range, 'p', 'story-subtitle');
        this.currentTypeLabel.set('Subtitle');
        break;
      case 'h1':
        this.applyBlockTag(canvasEl, range, 'h1');
        this.currentTypeLabel.set('Heading 1');
        break;
      case 'h2':
        this.applyBlockTag(canvasEl, range, 'h2');
        this.currentTypeLabel.set('Heading 2');
        break;
      case 'h3':
        this.applyBlockTag(canvasEl, range, 'h3');
        this.currentTypeLabel.set('Heading 3');
        break;
      case 'blockquote':
        this.applyBlockTag(canvasEl, range, 'blockquote');
        this.currentTypeLabel.set('Quote');
        break;
      case 'recipe-tip':
        this.applyBlockTag(canvasEl, range, 'div', 'recipe-tip');
        this.currentTypeLabel.set('Recipe Tip');
        break;
      default:
        this.applyBlockTag(canvasEl, range, 'p');
        this.currentTypeLabel.set('Normal text');
        break;
    }

    this.onInput();
  }

  applyFontFamily(fontFamily: string, label: string): void {
    this.currentFontLabel.set(label);
    const canvasEl = this.editorCanvas()?.nativeElement;
    if (!canvasEl) return;

    const range = this.getActiveRangeInCanvas(canvasEl);
    this.wrapRangeWithInline(range, 'span', { style: `font-family: ${fontFamily};` });
    this.onInput();
  }

  applyFontSize(sizePx: number): void {
    this.currentFontSize.set(sizePx);
    const canvasEl = this.editorCanvas()?.nativeElement;
    if (!canvasEl) return;

    const range = this.getActiveRangeInCanvas(canvasEl);
    this.wrapRangeWithInline(range, 'span', { style: `font-size: ${sizePx}px;` });
    this.onInput();
  }

  changeFontSize(delta: number): void {
    const nextSize = Math.max(10, Math.min(64, this.currentFontSize() + delta));
    this.applyFontSize(nextSize);
  }

  applyAlignment(align: StoryTextAlign): void {
    this.currentAlign.set(align);
    const canvasEl = this.editorCanvas()?.nativeElement;
    if (!canvasEl) return;

    const range = this.getActiveRangeInCanvas(canvasEl);
    const block = this.findDirectBlockChild(canvasEl, range);
    if (block) {
      if (align === 'left') {
        block.style.textAlign = '';
      } else {
        block.style.textAlign = align;
      }
      this.onInput();
    }
  }

  applyBulletList(styleType = 'disc'): void {
    const canvasEl = this.editorCanvas()?.nativeElement;
    if (!canvasEl) return;

    const range = this.getActiveRangeInCanvas(canvasEl);
    let ul = this.findAncestorTag(range, 'ul');
    if (!ul) {
      const directBlock = this.findDirectBlockChild(canvasEl, range);
      if (directBlock instanceof HTMLUListElement) {
        ul = directBlock;
      } else if (directBlock instanceof HTMLOListElement) {
        const newUl = document.createElement('ul');
        newUl.innerHTML = directBlock.innerHTML;
        directBlock.replaceWith(newUl);
        ul = newUl;
      }
    }
    ul ??= this.wrapBlockAsList(canvasEl, range, 'ul');
    if (ul) {
      ul.style.listStyleType = styleType;
    }
    this.onInput();
  }

  applyNumberedList(styleType = 'decimal'): void {
    const canvasEl = this.editorCanvas()?.nativeElement;
    if (!canvasEl) return;

    const range = this.getActiveRangeInCanvas(canvasEl);
    let ol = this.findAncestorTag(range, 'ol');
    if (!ol) {
      const directBlock = this.findDirectBlockChild(canvasEl, range);
      if (directBlock instanceof HTMLOListElement) {
        ol = directBlock;
      } else if (directBlock instanceof HTMLUListElement) {
        const newOl = document.createElement('ol');
        newOl.innerHTML = directBlock.innerHTML;
        directBlock.replaceWith(newOl);
        ol = newOl;
      }
    }
    ol ??= this.wrapBlockAsList(canvasEl, range, 'ol');
    if (ol) {
      ol.style.listStyleType = styleType;
    }
    this.onInput();
  }

  adjustIndent(direction: 'increase' | 'decrease'): void {
    const canvasEl = this.editorCanvas()?.nativeElement;
    if (!canvasEl) return;

    const range = this.getActiveRangeInCanvas(canvasEl);
    const li = this.findAncestorTag(range, 'li');

    if (li) {
      if (direction === 'increase') {
        this.nestListItem(li);
      } else {
        this.unNestListItem(canvasEl, li);
      }
    } else {
      this.adjustBlockIndent(canvasEl, range, direction);
    }
    this.onInput();
  }

  private adjustBlockIndent(
    canvasEl: HTMLElement,
    range: Range,
    direction: 'increase' | 'decrease',
  ): void {
    const block = this.findDirectBlockChild(canvasEl, range);
    if (!block) return;

    const curMargin = Number.parseFloat(block.style.marginLeft || '0');
    if (direction === 'increase') {
      block.style.marginLeft = `${curMargin + 1.5}rem`;
    } else {
      const next = Math.max(0, curMargin - 1.5);
      block.style.marginLeft = next > 0 ? `${next}rem` : '';
    }
  }

  private nestListItem(li: HTMLElement): void {
    const prevLi = li.previousElementSibling;
    if (prevLi instanceof HTMLElement) {
      let subList = prevLi.querySelector('ul, ol');
      if (!subList) {
        const parentTag = (li.parentElement?.tagName.toLowerCase() || 'ul') as 'ul' | 'ol';
        subList = document.createElement(parentTag);
        prevLi.appendChild(subList);
      }
      subList.appendChild(li);
      this.selectNodeContentsSafe(li);
    }
  }

  private unNestListItem(canvasEl: HTMLElement, li: HTMLElement): void {
    const parentList = li.parentElement;
    if (parentList && parentList.parentElement instanceof HTMLLIElement) {
      this.unNestFromGrandparent(li, parentList);
    } else {
      this.outdentListItemToParagraph(canvasEl, li, parentList);
    }
  }

  private unNestFromGrandparent(li: HTMLElement, parentList: HTMLElement): void {
    const grandParentLi = parentList.parentElement as HTMLLIElement;
    grandParentLi.after(li);
    if (parentList.children.length === 0) {
      parentList.remove();
    }
    this.selectNodeContentsSafe(li);
  }

  private outdentListItemToParagraph(
    canvasEl: HTMLElement,
    li: HTMLElement,
    parentList: HTMLElement | null,
  ): void {
    const p = document.createElement('p');
    p.innerHTML = li.innerHTML;
    if (parentList?.children.length === 1) {
      parentList.replaceWith(p);
    } else {
      li.remove();
      canvasEl.appendChild(p);
    }
    this.selectNodeContentsSafe(p);
  }

  private selectNodeContentsSafe(node: Node): void {
    try {
      const sel = window.getSelection();
      if (sel) {
        const newRange = document.createRange();
        newRange.selectNodeContents(node);
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
    } catch {
      // Ignore selection errors in non-browser or detached environments
    }
  }

  // --- Class Collector & Eraser Methods ---

  private loadClassHistory(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(this.LOCAL_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            this.classHistory.set(parsed);
          }
        }
      } catch {
        // Ignore storage errors in restricted environments
      }
    }
  }

  private saveClassHistory(cls: string): void {
    if (!cls) return;
    const current = this.classHistory();
    const updated = [cls, ...current.filter((c) => c !== cls)].slice(0, 30);
    this.classHistory.set(updated);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors in restricted environments
      }
    }
  }

  onClassMenuOpened(): void {
    const canvasEl = this.editorCanvas()?.nativeElement;
    if (!canvasEl) return;

    const target = this.resolveActiveTargetForClasses(canvasEl);
    if (!target) return;

    this.inspectedElementTag.set(`<${target.tagName.toLowerCase()}>`);

    const classList = Array.from(target.classList).filter((c) => c !== 'active-highlight');
    this.inspectedClasses.set(classList);

    // Refresh available classes library
    const combined = new Set<string>([...this.availableClassLibrary(), ...this.classHistory()]);

    // Scan classes inside canvas
    const allEls = canvasEl.querySelectorAll('*');
    allEls.forEach((el) => {
      el.classList.forEach((c) => {
        if (c !== 'active-highlight' && c !== 'story') combined.add(c);
      });
    });

    this.availableClassLibrary.set(Array.from(combined));
  }

  private resolveActiveTargetForClasses(canvasEl: HTMLElement): HTMLElement | null {
    const range = this.getActiveRangeInCanvas(canvasEl);
    let node: Node | null = range.commonAncestorContainer;
    if (node?.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }
    if (node instanceof HTMLElement && canvasEl.contains(node)) {
      // Check if inside a span (e.g. drop-cap or styled span)
      const span = node.closest('span');
      if (span && canvasEl.contains(span)) return span;
      return node;
    }
    return this.findDirectBlockChild(canvasEl, range);
  }

  addClassFromInput(inputEl: HTMLInputElement): void {
    const value = inputEl.value?.trim();
    if (value) {
      this.addClassToInspected(value);
      inputEl.value = '';
    }
  }

  addClassToInspected(className: string): void {
    const canvasEl = this.editorCanvas()?.nativeElement;
    if (!canvasEl) return;

    const target = this.resolveActiveTargetForClasses(canvasEl);
    if (!target || !className) return;

    target.classList.add(className);
    this.saveClassHistory(className);

    const classList = Array.from(target.classList).filter((c) => c !== 'active-highlight');
    this.inspectedClasses.set(classList);
    this.onInput();
  }

  removeClassFromInspected(className: string): void {
    const canvasEl = this.editorCanvas()?.nativeElement;
    if (!canvasEl) return;

    const target = this.resolveActiveTargetForClasses(canvasEl);
    if (!target || !className) return;

    target.classList.remove(className);
    if (target.getAttribute('class') === '') {
      target.removeAttribute('class');
    }

    const classList = Array.from(target.classList).filter((c) => c !== 'active-highlight');
    this.inspectedClasses.set(classList);
    this.onInput();
  }

  eraseAllClassesFromInspected(): void {
    const canvasEl = this.editorCanvas()?.nativeElement;
    if (!canvasEl) return;

    const target = this.resolveActiveTargetForClasses(canvasEl);
    if (!target) return;

    target.removeAttribute('class');
    this.inspectedClasses.set([]);
    this.onInput();
  }

  applyFirstLetterDropCap(): void {
    const canvasEl = this.editorCanvas()?.nativeElement;
    if (!canvasEl) return;

    const range = this.getActiveRangeInCanvas(canvasEl);
    const block = this.findDirectBlockChild(canvasEl, range);
    if (!block) return;

    const existingSpan = block.querySelector('.story-first-letter, .drop-cap');
    if (existingSpan) {
      this.inspectedClasses.set(Array.from(existingSpan.classList));
      return;
    }

    const html = block.innerHTML;
    const match = /^(\s*)([A-Za-z0-9])/.exec(html);
    if (match) {
      block.innerHTML = html.replace(
        /^(\s*)([A-Za-z0-9])/,
        `$1<span class="story-first-letter">$2</span>`,
      );
      this.saveClassHistory('story-first-letter');
      const span = block.querySelector('.story-first-letter');
      if (span) {
        this.inspectedClasses.set(Array.from(span.classList));
      }
      this.onInput();
    }
  }

  // --- HTML Image Handling and Serialization ---

  private resolveImageSrc(html: string): string {
    if (!html) return '';
    return html.replace(/<img([^>]+)>/gi, (match, attrs) => {
      const srcMatch = attrs.match(/(?:src)=["']([^"']+)["']/i);
      if (!srcMatch) return match;

      const originalSrc = srcMatch[1];
      if (
        originalSrc.startsWith('data:') ||
        originalSrc.startsWith('http://') ||
        originalSrc.startsWith('https://')
      ) {
        return match;
      }

      const cleanRelative = originalSrc.startsWith('/') ? originalSrc : `/${originalSrc}`;
      const newSrc = `${this.baseUrl}${cleanRelative}`;

      const newAttrs = attrs.replace(/(?:src)=["'][^"']+["']/gi, `src="${newSrc}"`);
      return `<img${newAttrs}>`;
    });
  }

  private stripImageBaseUrl(html: string): string {
    if (!html) return '';
    let clean = html.replace(/\bactive-highlight\b/g, '');
    clean = clean.replaceAll('class=" "', '');
    clean = clean.replaceAll('class=""', '');

    return clean.replace(/<img([^>]+)>/gi, (match, attrs) => {
      const srcMatch = attrs.match(/(?:src)=["']([^"']+)["']/i);
      if (!srcMatch) return match;

      const fullSrc = srcMatch[1];
      if (fullSrc.startsWith(this.baseUrl)) {
        const relativeSrc = fullSrc.slice(this.baseUrl.length);
        const newAttrs = attrs.replace(/(?:src)=["'][^"']+["']/gi, `src="${relativeSrc}"`);
        return `<img${newAttrs}>`;
      }
      return match;
    });
  }

  execCmd(command: string, value: string | undefined = undefined): void {
    if (this.isHtmlMode()) return;
    const canvasEl = this.editorCanvas()?.nativeElement;
    if (!canvasEl) return;

    const range = this.getActiveRangeInCanvas(canvasEl);

    switch (command) {
      case 'bold':
        this.wrapRangeWithInline(range, 'strong');
        break;
      case 'italic':
        this.wrapRangeWithInline(range, 'em');
        break;
      case 'underline':
        this.wrapRangeWithInline(range, 'u');
        break;
      case 'strikeThrough':
        this.wrapRangeWithInline(range, 's');
        break;
      case 'highlight':
        this.wrapRangeWithInline(range, 'mark');
        break;
      case 'code':
        this.wrapRangeWithInline(range, 'code');
        break;
      case 'createLink':
        if (value) {
          this.wrapRangeWithInline(range, 'a', { href: value });
        }
        break;
      case 'insertImage':
        if (value) {
          const img = document.createElement('img');
          img.src = value;
          this.insertNodeAtRange(range, img);
        }
        break;
      case 'insertHorizontalRule': {
        const hr = document.createElement('hr');
        this.insertNodeAtRange(range, hr);
        break;
      }
      case 'insertUnorderedList':
        this.wrapBlockAsList(canvasEl, range, 'ul');
        break;
      case 'insertOrderedList':
        this.wrapBlockAsList(canvasEl, range, 'ol');
        break;
      case 'callout':
        this.applyBlockTag(canvasEl, range, 'div', 'recipe-tip');
        break;
      case 'formatBlock': {
        const cleanTag = (value || 'p').replaceAll('<', '').replaceAll('>', '').toLowerCase();
        this.applyBlockTag(canvasEl, range, cleanTag);
        break;
      }
      case 'removeFormat':
        this.clearRangeFormatting(canvasEl, range);
        break;
    }

    this.onInput();
  }

  private getActiveRangeInCanvas(canvasEl: HTMLElement): Range {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const r = selection.getRangeAt(0);
      if (canvasEl.contains(r.commonAncestorContainer)) {
        return r;
      }
    }
    const fallbackRange = document.createRange();
    fallbackRange.selectNodeContents(canvasEl);
    fallbackRange.collapse(false);
    return fallbackRange;
  }

  private wrapRangeWithInline(
    range: Range,
    tagName: string,
    attrs: Record<string, string> = {},
  ): void {
    const el = document.createElement(tagName);
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, v);
    }

    if (range.collapsed) {
      el.textContent = attrs['href'] || '';
      range.insertNode(el);
      return;
    }

    const contents = range.extractContents();
    el.appendChild(contents);
    range.insertNode(el);
  }

  private insertNodeAtRange(range: Range, node: Node): void {
    range.deleteContents();
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
  }

  private findDirectBlockChild(canvasEl: HTMLElement, range: Range): HTMLElement | null {
    let curr: Node | null = range.commonAncestorContainer;
    if (curr === canvasEl) {
      return canvasEl.lastElementChild as HTMLElement | null;
    }
    while (curr?.parentNode && curr.parentNode !== canvasEl) {
      curr = curr.parentNode;
    }
    return curr instanceof HTMLElement && curr.parentNode === canvasEl ? curr : null;
  }

  private findDirectBlockFromElement(canvasEl: HTMLElement, el: HTMLElement): HTMLElement | null {
    let curr: HTMLElement | null = el;
    while (curr?.parentElement && curr.parentElement !== canvasEl) {
      curr = curr.parentElement;
    }
    return curr?.parentElement === canvasEl ? curr : null;
  }

  private findAncestorTag(range: Range, tagName: string): HTMLElement | null {
    let curr: Node | null = range.commonAncestorContainer;
    const upper = tagName.toUpperCase();
    while (curr) {
      if (curr instanceof HTMLElement && curr.tagName === upper) {
        return curr;
      }
      curr = curr.parentNode;
    }
    return null;
  }

  private applyBlockTag(
    canvasEl: HTMLElement,
    range: Range,
    tagName: string,
    className?: string,
  ): void {
    const blockEl = document.createElement(tagName);

    const existingBlock = this.findDirectBlockChild(canvasEl, range);
    if (existingBlock) {
      // Preserve existing classes unless a specific className is explicitly applied
      if (className) {
        blockEl.className = className;
      } else if (
        existingBlock.className &&
        !['recipe-tip', 'story-title', 'story-subtitle'].includes(existingBlock.className)
      ) {
        blockEl.className = existingBlock.className;
      }

      blockEl.innerHTML = existingBlock.innerHTML;
      existingBlock.replaceWith(blockEl);
    } else if (!range.collapsed) {
      if (className) blockEl.className = className;
      blockEl.appendChild(range.extractContents());
      range.insertNode(blockEl);
    } else {
      if (className) blockEl.className = className;
      canvasEl.appendChild(blockEl);
    }
  }

  private wrapBlockAsList(canvasEl: HTMLElement, range: Range, listTag: 'ul' | 'ol'): HTMLElement {
    const listEl = document.createElement(listTag);
    const li = document.createElement('li');

    const existingBlock = this.findDirectBlockChild(canvasEl, range);
    if (existingBlock) {
      li.innerHTML = existingBlock.innerHTML;
      listEl.appendChild(li);
      existingBlock.replaceWith(listEl);
    } else {
      if (!range.collapsed) {
        li.appendChild(range.extractContents());
      }
      listEl.appendChild(li);
      range.insertNode(listEl);
    }

    this.selectNodeContentsSafe(li);

    return listEl;
  }

  private clearRangeFormatting(canvasEl: HTMLElement, range: Range): void {
    if (!range.collapsed) {
      const text = range.toString();
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      return;
    }
    const existingBlock = this.findDirectBlockChild(canvasEl, range);
    if (existingBlock) {
      const p = document.createElement('p');
      p.textContent = existingBlock.textContent || '';
      existingBlock.replaceWith(p);
    }
  }

  promptLink(): void {
    const url = prompt('Enter URL:');
    if (url) {
      this.execCmd('createLink', url);
    }
  }

  triggerImageUpload(): void {
    const inputEl = this.imageFileInput()?.nativeElement;
    if (inputEl) {
      inputEl.value = '';
      inputEl.click();
    }
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (this.recipeService) {
      try {
        const serverPath = await this.recipeService.upload(file);
        if (serverPath) {
          const cleanRelative = serverPath.startsWith('/') ? serverPath : `/${serverPath}`;
          const fullUrl = `${this.baseUrl}${cleanRelative}`;
          this.execCmd('insertImage', fullUrl);
        }
      } catch (err) {
        console.error('Failed to upload story image:', err);
      }
    } else {
      const objectUrl = URL.createObjectURL(file);
      this.execCmd('insertImage', objectUrl);
    }
  }

  private getTargetImage(canvasEl: HTMLElement): HTMLImageElement | null {
    const highlightedEl = canvasEl.querySelector('.active-highlight');
    if (highlightedEl) {
      if (highlightedEl instanceof HTMLImageElement) return highlightedEl;
      if (highlightedEl instanceof HTMLElement) {
        return highlightedEl.querySelector('img') || highlightedEl.closest('img');
      }
    }
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      let node: Node | null = range.commonAncestorContainer;
      if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
      if (node instanceof HTMLElement && canvasEl.contains(node)) {
        return node.closest('img') || node.querySelector('img');
      }
    }
    return null;
  }

  private getFigureElements(targetImg: HTMLImageElement): {
    inner: HTMLElement | null;
    outer: HTMLElement | null;
  } {
    const parentFig = targetImg.closest('figure');
    if (!parentFig) return { inner: null, outer: null };
    if (parentFig.parentElement?.tagName.toLowerCase() === 'figure') {
      return { inner: parentFig, outer: parentFig.parentElement };
    }
    const childFigs = Array.from(parentFig.querySelectorAll('figure'));
    const matchingChild = childFigs.find((fig) => fig.contains(targetImg));
    return matchingChild
      ? { inner: matchingChild, outer: parentFig }
      : { inner: parentFig, outer: null };
  }

  private cleanFigureClass(cls: string | undefined): string {
    return (cls || '').replace(/\bactive-highlight\b/g, '').trim();
  }

  private applyDialogResult(
    result: FigureDialogData,
    targetImg: HTMLImageElement,
    innerFigure: HTMLElement | null,
    outerFigure: HTMLElement | null,
    isGalleryContainer: boolean,
  ): void {
    const imgClone = targetImg.cloneNode(true) as HTMLImageElement;
    if (result.imgClass) imgClone.className = result.imgClass;
    else imgClone.removeAttribute('class');

    const innerFig: HTMLElement = document.createElement('figure');
    if (result.innerFigureClass) innerFig.className = result.innerFigureClass;
    innerFig.appendChild(imgClone);

    if (result.captionText) {
      const figcap = document.createElement('figcaption');
      figcap.textContent = result.captionText;
      if (result.captionClass) figcap.className = result.captionClass;
      innerFig.appendChild(figcap);
    }

    if (isGalleryContainer && outerFigure) {
      if (result.outerFigureClass) outerFigure.className = result.outerFigureClass;
      const targetToReplace = innerFigure || targetImg;
      targetToReplace.parentNode?.replaceChild(innerFig, targetToReplace);
    } else {
      let replacementNode: HTMLElement = innerFig;
      if (result.outerFigureClass) {
        const outerFig = document.createElement('figure');
        outerFig.className = result.outerFigureClass;
        outerFig.appendChild(innerFig);
        replacementNode = outerFig;
      }
      const topTargetNode = outerFigure || innerFigure || targetImg;
      topTargetNode.parentNode?.replaceChild(replacementNode, topTargetNode);
    }
  }

  openFigureDialog(): void {
    const canvasEl = this.editorCanvas()?.nativeElement;
    if (!canvasEl) return;

    const targetImg = this.getTargetImage(canvasEl);
    if (!targetImg) return;

    const { inner: innerFigure, outer: outerFigure } = this.getFigureElements(targetImg);
    const captionEl = innerFigure?.querySelector('figcaption');

    const isGalleryContainer = !!(
      outerFigure &&
      (outerFigure.classList.contains('recipe-gallery') ||
        outerFigure.querySelectorAll('figure').length > 1)
    );

    const initialData: FigureDialogData = {
      outerFigureClass: this.cleanFigureClass(outerFigure?.className),
      innerFigureClass: this.cleanFigureClass(innerFigure?.className),
      imgClass: this.cleanFigureClass(targetImg.className),
      captionText: captionEl?.textContent || '',
      captionClass: this.cleanFigureClass(captionEl?.className),
    };

    const dialogRef = this.dialog.open(FigureDialogComponent, {
      data: initialData,
      width: '460px',
    });

    dialogRef.afterClosed().subscribe((result: FigureDialogData | undefined) => {
      if (!result || !targetImg) return;
      this.applyDialogResult(result, targetImg, innerFigure, outerFigure, isGalleryContainer);
      this.onInput();
    });
  }

  onInput(): void {
    const canvasEl = this.editorCanvas()?.nativeElement;
    if (canvasEl) {
      const cleanHtml = this.stripImageBaseUrl(canvasEl.innerHTML);
      this.value.set(cleanHtml);
    }
  }

  toggleHtmlMode(): void {
    const nextMode = !this.isHtmlMode();
    if (nextMode) {
      // Switching from Visual -> HTML mode
      const canvasEl = this.editorCanvas()?.nativeElement;
      let currentContent = this.value();
      if (canvasEl) {
        currentContent = this.stripImageBaseUrl(canvasEl.innerHTML);
        this.value.set(currentContent);
      }
      this.rawHtmlValue.set(this.formatHtmlForEditor(currentContent));
      this.isHtmlMode.set(true);
    } else {
      // Switching from HTML -> Visual mode
      const textareaEl = this.htmlTextarea()?.nativeElement;
      if (textareaEl) {
        const clean = this.stripImageBaseUrl(textareaEl.value);
        this.value.set(clean);
      }
      this.isHtmlMode.set(false);
      const canvasEl = this.editorCanvas()?.nativeElement;
      if (canvasEl) {
        canvasEl.innerHTML = this.resolveImageSrc(this.value());
      }
    }
  }

  onHtmlSourceInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    if (target) {
      this.rawHtmlValue.set(target.value);
      const cleanHtml = this.stripImageBaseUrl(target.value);
      this.value.set(cleanHtml);
    }
  }

  formatHtmlForEditor(html: string): string {
    if (!html) return '';
    return html
      .replace(/>\s*</g, '><')
      .replace(/(<\/(p|h1|h2|h3|blockquote|figure|figcaption|div|ul|ol|li|hr)>)/gi, '$1\n')
      .replace(/(<hr[^>]*>)/gi, '$1\n')
      .replace(/(<(figure|div|ul|ol)[^>]*>)/gi, '\n$1\n')
      .replace(/\n{2,}/g, '\n')
      .trim();
  }
}
