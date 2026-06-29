import { extractYouTubeVideoId } from './url-utils';

describe('url-utils', () => {
  describe('extractYouTubeVideoId', () => {
    it('should return null if url is null or undefined', () => {
      expect(extractYouTubeVideoId(null)).toBeNull();
      expect(extractYouTubeVideoId(undefined)).toBeNull();
      expect(extractYouTubeVideoId('')).toBeNull();
    });

    it('should extract video ID from standard youtube watch URL', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
        'dQw4w9WgXcQ',
      );
      expect(extractYouTubeVideoId('http://youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from youtu.be short URL', () => {
      expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeVideoId('http://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from embed URL', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(
        'dQw4w9WgXcQ',
      );
    });

    it('should extract video ID from URL with additional parameters', () => {
      expect(
        extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=youtu.be'),
      ).toBe('dQw4w9WgXcQ');
      expect(
        extractYouTubeVideoId('https://www.youtube.com/watch?feature=youtu.be&v=dQw4w9WgXcQ'),
      ).toBe('dQw4w9WgXcQ');
    });

    it('should return the original string if it does not match a youtube URL', () => {
      expect(extractYouTubeVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeVideoId('  dQw4w9WgXcQ  ')).toBe('dQw4w9WgXcQ');
    });
  });
});
