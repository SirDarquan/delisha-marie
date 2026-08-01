import { CommonModule } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { TextFieldModule } from '@angular/cdk/text-field';
import { Comment, CommentsService } from '../../services/comments.service';

export interface ReplyTexts {
  text: string;
}

@Component({
  selector: 'app-recipe-reply-form',
  standalone: true,
  imports: [
    CommonModule,
    FormRoot,
    FormField,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    TextFieldModule,
  ],
  template: `
    <form [formRoot]="replyForm" class="w-full mt-2">
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Reply as Delisha Marie...</mat-label>
        <textarea
          matInput
          cdkTextareaAutosize
          cdkAutosizeMinRows="4"
          cdkAutosizeMaxRows="15"
          [formField]="replyForm.text"
          class="text-slate-200"></textarea>
        @for (error of replyForm.text().errors(); track error) {
          <mat-error>{{ error.message }}</mat-error>
        }
      </mat-form-field>
      <div class="flex gap-2 justify-end">
        <button type="button" mat-button class="text-slate-400" (click)="canceled.emit()">
          Cancel
        </button>
        <button type="submit" mat-flat-button color="accent" [disabled]="!replyModel().text.trim()">
          Send
        </button>
      </div>
    </form>
  `,
})
export class RecipeReplyFormComponent {
  recipeId = input.required<string>();
  parentId = input.required<string>();

  canceled = output<void>();
  success = output<Comment>();

  private readonly commentsService = inject(CommentsService);
  private readonly snackBar = inject(MatSnackBar);

  replyModel = signal<ReplyTexts>({ text: '' });

  replyForm = form(
    this.replyModel,
    (fields) => {
      required(fields.text, { message: 'Please enter a comment text' });
    },
    {
      submission: {
        action: async () => {
          const content = this.replyModel().text.trim();
          if (!content) return;

          try {
            const newReply = await firstValueFrom(
              this.commentsService.replyToComment(this.recipeId(), this.parentId(), content),
            );
            if (newReply) {
              this.success.emit(newReply);
            }
          } catch {
            this.snackBar.open('Failed to send reply', 'Close', { duration: 3000 });
          }
        },
      },
    },
  );
}
