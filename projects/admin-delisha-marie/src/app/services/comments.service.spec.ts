import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { CommentsService, Comment } from './comments.service';

describe('CommentsService', () => {
  let service: CommentsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CommentsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get comments', () => {
    const mockComments: Comment[] = [
      {
        id: '1',
        recipe_id: '1',
        parent_id: null,
        author: 'User',
        email: 'user@example.com',
        content: 'Test',
        is_admin: false,
        status: 'approved',
        created_at: '2026-06-29T10:00:00Z',
      },
    ];

    service.getComments('1').subscribe((res) => {
      expect(res.comments).toEqual(mockComments);
    });

    const req = httpMock.expectOne(`/api/recipes/1/comments`);
    expect(req.request.method).toBe('GET');
    req.flush({ comments: mockComments });
  });

  it('should reply to comment', () => {
    const mockReply: Comment = {
      id: '2',
      recipe_id: '1',
      parent_id: '1',
      author: 'Delisha Marie',
      email: 'admin@delishamarie.com',
      content: 'Reply',
      is_admin: true,
      status: 'approved',
      created_at: '2026-06-29T10:05:00Z',
    };

    service.replyToComment('1', '1', 'Reply').subscribe((res) => {
      expect(res).toEqual(mockReply);
    });

    const req = httpMock.expectOne(`/api/recipes/1/comments/1/reply`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ content: 'Reply' });
    req.flush(mockReply);
  });

  it('should delete comment', () => {
    service.deleteComment('1', '2').subscribe((res) => {
      expect(res.success).toBe(true);
    });

    const req = httpMock.expectOne(`/api/recipes/1/comments/2`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });
  });

  it('should skip comment', () => {
    const mockUpdated: Comment = {
      id: '1',
      recipe_id: '1',
      parent_id: null,
      author: 'User',
      email: 'user@example.com',
      content: 'Test',
      is_admin: false,
      status: 'skipped',
      created_at: '2026-06-29T10:00:00Z',
    };

    service.skipComment('1', '1', true).subscribe((res) => {
      expect(res).toEqual(mockUpdated);
    });

    const req = httpMock.expectOne(`/api/recipes/1/comments/1/skip`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ skipped: true });
    req.flush(mockUpdated);
  });
});
