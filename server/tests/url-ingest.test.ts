import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// --- Mocks ----------------------------------------------------------------

const mockUpdateResourceStatus = jest.fn<any>();
const mockGetResourceById = jest.fn<any>();
const mockUpdateResourceFields = jest.fn<any>();

jest.unstable_mockModule('#src/services/resource.service.ts', () => ({
  updateResourceStatus: mockUpdateResourceStatus,
  getResourceById: mockGetResourceById,
  updateResourceFields: mockUpdateResourceFields,
  createResource: jest.fn(),
  createResourceChunk: jest.fn(),
  createEmbeddingRecord: jest.fn(),
  attachResourceToSession: jest.fn(),
}));

const mockIngestResourceText = jest.fn<any>();
jest.unstable_mockModule('#src/services/resource-ingest.service.ts', () => ({
  ingestResourceText: mockIngestResourceText,
}));

const mockTrackAnalyticsEvent = jest.fn<any>();
jest.unstable_mockModule('#src/services/analytics.service.ts', () => ({
  trackAnalyticsEvent: mockTrackAnalyticsEvent,
}));

const mockDocumentParserService = {
  parseDocument: jest.fn<any>(),
};
jest.unstable_mockModule('#src/services/document-parser.service.ts', () => ({
  documentParserService: mockDocumentParserService,
  DocumentParserError: class DocumentParserError extends Error {
    code: string;
    status: number;
    details?: unknown;
    constructor({
      code,
      message,
      status,
    }: {
      code: string;
      message: string;
      status: number;
    }) {
      super(message);
      this.code = code;
      this.status = status;
    }
  },
}));

const mockUploadBufferToS3 = jest.fn<any>();
const mockBuildResourceStorageKey = jest.fn<any>();
jest.unstable_mockModule('#src/services/storage.service.ts', () => ({
  uploadBufferToS3: mockUploadBufferToS3,
  buildResourceStorageKey: mockBuildResourceStorageKey,
}));

jest.unstable_mockModule('#src/services/document-parser.constants.ts', () => ({
  isSupportedFile: jest.fn<any>().mockReturnValue(false),
}));

jest.unstable_mockModule('#config/env.ts', () => ({
  env: {
    URL_MAX_FILE_SIZE_MB: 10,
    URL_FETCH_TIMEOUT_MS: 5000,
    UPLOAD_DIR: undefined,
    S3_BUCKET: undefined,
    STORAGE_PROVIDER: undefined,
    ENABLE_ANALYTICS: true,
  },
}));

jest.unstable_mockModule('#src/utils/file-system.ts', () => ({
  resolveTempDir: jest.fn<any>().mockReturnValue('/tmp/feynman-test'),
  ensureDirectory: jest.fn<any>().mockResolvedValue(undefined),
  deleteFileIfExists: jest.fn<any>().mockResolvedValue(undefined),
}));

const mockFetch = jest.fn<any>();
jest.unstable_mockModule('node-fetch', () => ({
  default: mockFetch,
  Blob: global.Blob,
  FormData: class {},
}));

jest.unstable_mockModule('#src/transcript/utils/text.ts', () => ({
  normalizeWhitespace: jest.fn<any>().mockImplementation((t: any) => t),
}));

// --- Tests ----------------------------------------------------------------

const { ingestResourceFromUrl } =
  await import('#src/services/url-ingest.service.ts');

const FAKE_RESOURCE = {
  id: 'res-1',
  userId: 'user-1',
  title: 'Test URL',
  sourceType: 'URL',
  sourceUrl: 'https://example.com/article',
  subject: 'physics',
  topic: 'Newton',
  storageKey: null,
  filePath: null,
};

describe('ingestResourceFromUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetResourceById.mockResolvedValue(FAKE_RESOURCE);
    mockUpdateResourceStatus.mockResolvedValue(undefined);
    mockUpdateResourceFields.mockResolvedValue(undefined);
    mockTrackAnalyticsEvent.mockResolvedValue(undefined);
    mockIngestResourceText.mockResolvedValue({ chunkCount: 3 });
  });

  it('marks resource as PROCESSING then READY on success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: {
        get: (name: string) => (name === 'content-type' ? 'text/plain' : null),
      },
      arrayBuffer: async () => Buffer.from('Learning content').buffer,
    });

    await ingestResourceFromUrl({
      resourceId: 'res-1',
      sourceUrl: 'https://example.com/article',
    });

    expect(mockUpdateResourceStatus).toHaveBeenCalledWith(
      'res-1',
      'PROCESSING'
    );
    expect(mockIngestResourceText).toHaveBeenCalledWith(
      expect.objectContaining({ resourceId: 'res-1' })
    );
  });

  it('marks resource as FAILED when fetch fails', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      headers: { get: () => null },
    });

    await expect(
      ingestResourceFromUrl({
        resourceId: 'res-1',
        sourceUrl: 'https://example.com/missing',
      })
    ).rejects.toThrow();

    expect(mockUpdateResourceStatus).toHaveBeenCalledWith('res-1', 'FAILED');
  });

  it('marks resource as FAILED when network throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    await expect(
      ingestResourceFromUrl({
        resourceId: 'res-1',
        sourceUrl: 'https://example.com/article',
      })
    ).rejects.toThrow('Network error');

    expect(mockUpdateResourceStatus).toHaveBeenCalledWith('res-1', 'FAILED');
  });

  it('rejects localhost URLs as SSRF protection', async () => {
    await expect(
      ingestResourceFromUrl({
        resourceId: 'res-1',
        sourceUrl: 'http://localhost/admin',
      })
    ).rejects.toThrow(/blocked host/i);

    expect(mockUpdateResourceStatus).toHaveBeenCalledWith('res-1', 'FAILED');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('rejects non-HTTP protocols as SSRF protection', async () => {
    await expect(
      ingestResourceFromUrl({
        resourceId: 'res-1',
        sourceUrl: 'file:///etc/passwd',
      })
    ).rejects.toThrow(/HTTP\/HTTPS/i);

    expect(mockUpdateResourceStatus).toHaveBeenCalledWith('res-1', 'FAILED');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('tracks ingestion.started and ingestion.completed analytics events', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: {
        get: (name: string) => (name === 'content-type' ? 'text/plain' : null),
      },
      arrayBuffer: async () => Buffer.from('content').buffer,
    });

    await ingestResourceFromUrl({
      resourceId: 'res-1',
      sourceUrl: 'https://example.com/article',
    });

    expect(mockTrackAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'resource.ingestion.started' })
    );
    expect(mockTrackAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'resource.ingestion.completed' })
    );
  });

  it('tracks ingestion.failed analytics event on error', async () => {
    mockFetch.mockRejectedValue(new Error('timeout'));

    await expect(
      ingestResourceFromUrl({
        resourceId: 'res-1',
        sourceUrl: 'https://example.com/article',
      })
    ).rejects.toThrow();

    expect(mockTrackAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'resource.ingestion.failed' })
    );
  });

  it('throws when resource does not exist', async () => {
    mockGetResourceById.mockResolvedValue(null);

    await expect(
      ingestResourceFromUrl({
        resourceId: 'ghost-res',
        sourceUrl: 'https://example.com/article',
      })
    ).rejects.toThrow('Resource not found');
  });
});
