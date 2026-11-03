import { TestBed } from '@angular/core/testing';
import { BRAND_TITLE_TOKEN, injectAuthCommon } from './auth-shared.utils';

describe('auth-shared.utils', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [],
    });
  });

  it('should initialize with defaults when BRAND_TITLE_TOKEN is not provided', () => {
    TestBed.runInInjectionContext(() => {
      const common = injectAuthCommon();
      expect(common.brandTitle).toBe('Admin Portal');
      expect(common.hidePassword()).toBe(true);
    });
  });

  it('should adopt the customized title when BRAND_TITLE_TOKEN is provided', () => {
    TestBed.overrideProvider(BRAND_TITLE_TOKEN, { useValue: 'Custom App' });
    TestBed.runInInjectionContext(() => {
      const common = injectAuthCommon();
      expect(common.brandTitle).toBe('Custom App');
    });
  });

  it('should flip the togglePassword signal when invoked', () => {
    TestBed.runInInjectionContext(() => {
      const common = injectAuthCommon();
      expect(common.hidePassword()).toBe(true);
      common.togglePassword();
      expect(common.hidePassword()).toBe(false);
      common.togglePassword();
      expect(common.hidePassword()).toBe(true);
    });
  });
});
