import { describe, it, expect } from '@jest/globals';
import { CreateResourceSchema } from '#src/validations/resource.validation.ts';

describe('CreateResourceSchema', () => {
  it('accepts a valid TEXT resource', () => {
    const result = CreateResourceSchema.safeParse({
      title: 'My Notes',
      sourceType: 'TEXT',
      text: 'Some learning content here.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects TEXT resource without text', () => {
    const result = CreateResourceSchema.safeParse({
      title: 'My Notes',
      sourceType: 'TEXT',
    });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toMatch(/text/i);
  });

  it('rejects TEXT resource with empty text', () => {
    const result = CreateResourceSchema.safeParse({
      title: 'My Notes',
      sourceType: 'TEXT',
      text: '   ',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid URL resource', () => {
    const result = CreateResourceSchema.safeParse({
      title: 'Article',
      sourceType: 'URL',
      sourceUrl: 'https://example.com/article',
    });
    expect(result.success).toBe(true);
  });

  it('rejects URL resource without sourceUrl', () => {
    const result = CreateResourceSchema.safeParse({
      title: 'Article',
      sourceType: 'URL',
    });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toMatch(/sourceUrl/i);
  });

  it('rejects URL resource with invalid URL', () => {
    const result = CreateResourceSchema.safeParse({
      title: 'Article',
      sourceType: 'URL',
      sourceUrl: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid UPLOAD resource', () => {
    const result = CreateResourceSchema.safeParse({
      title: 'Uploaded PDF',
      sourceType: 'UPLOAD',
      storageKey: 'users/abc/resources/xyz/doc.pdf',
    });
    expect(result.success).toBe(true);
  });

  it('rejects UPLOAD resource without storageKey', () => {
    const result = CreateResourceSchema.safeParse({
      title: 'Uploaded PDF',
      sourceType: 'UPLOAD',
    });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toMatch(/storageKey/i);
  });

  it('rejects unknown sourceType', () => {
    const result = CreateResourceSchema.safeParse({
      title: 'Weird',
      sourceType: 'PDF',
      text: 'content',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing title', () => {
    const result = CreateResourceSchema.safeParse({
      sourceType: 'TEXT',
      text: 'content',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty title', () => {
    const result = CreateResourceSchema.safeParse({
      title: '',
      sourceType: 'TEXT',
      text: 'content',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional subject and topic', () => {
    const result = CreateResourceSchema.safeParse({
      title: 'Notes',
      sourceType: 'TEXT',
      text: 'content',
      subject: 'physics',
      topic: 'Newton laws',
    });
    expect(result.success).toBe(true);
  });
});
