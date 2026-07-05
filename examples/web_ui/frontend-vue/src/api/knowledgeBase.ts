import { ApiError, client, getBaseUrl, getUserId } from './client';
import type {
	CreateKnowledgeBaseRequest,
	CreateKnowledgeBaseResponse,
	KbMiddlewareParametersSchemaResponse,
	KnowledgeBaseView,
	ListKbEmbeddingModelsResponse,
	ListKnowledgeBasesResponse,
	ListKnowledgeDocumentsResponse,
	ListKnowledgeDocumentStatusResponse,
	ListSupportedContentTypesResponse,
	SearchKnowledgeBaseRequest,
	SearchKnowledgeBaseResponse,
	UpdateKnowledgeBaseRequest,
	UploadKnowledgeDocumentResponse,
} from './types';

export interface UploadProgress {
	loaded: number;
	total: number;
}

export interface UploadDocumentOptions {
	onProgress?: (progress: UploadProgress) => void;
	signal?: AbortSignal;
}

function uploadDocumentXhr(
	knowledgeBaseId: string,
	file: File,
	options: UploadDocumentOptions = {},
): Promise<UploadKnowledgeDocumentResponse> {
	const { onProgress, signal } = options;
	const formData = new FormData();
	formData.append('file', file);

	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(new DOMException('Aborted', 'AbortError'));
			return;
		}

		const xhr = new XMLHttpRequest();
		const url = new URL(`/knowledge_bases/${knowledgeBaseId}/documents`, getBaseUrl());
		xhr.open('POST', url.toString(), true);
		xhr.setRequestHeader('X-User-ID', getUserId());

		const onAbort = () => xhr.abort();
		signal?.addEventListener('abort', onAbort, { once: true });

		const cleanup = () => signal?.removeEventListener('abort', onAbort);

		if (xhr.upload && onProgress) {
			xhr.upload.onprogress = (e) => {
				onProgress({
					loaded: e.loaded,
					total: e.lengthComputable ? e.total : 0,
				});
			};
		}

		xhr.onload = () => {
			cleanup();
			if (xhr.status >= 200 && xhr.status < 300) {
				try {
					resolve(JSON.parse(xhr.responseText) as UploadKnowledgeDocumentResponse);
				} catch (e) {
					reject(e);
				}
				return;
			}
			let detail = xhr.responseText || xhr.statusText;
			try {
				const json = JSON.parse(xhr.responseText) as {
					detail?: unknown;
				};
				if (typeof json.detail === 'string') detail = json.detail;
				else if (json.detail !== undefined) detail = JSON.stringify(json.detail);
			} catch {
				// keep raw text
			}
			reject(new ApiError(xhr.status, detail));
		};
		xhr.onerror = () => {
			cleanup();
			reject(new ApiError(0, 'Network error'));
		};
		xhr.onabort = () => {
			cleanup();
			reject(new DOMException('Aborted', 'AbortError'));
		};

		xhr.send(formData);
	});
}

export const knowledgeBaseApi = {
	list: () => client.get<ListKnowledgeBasesResponse>('/knowledge_bases/'),
	listEmbeddingModels: () =>
		client.get<ListKbEmbeddingModelsResponse>('/knowledge_bases/embedding_models'),
	middlewareParametersSchema: () =>
		client.get<KbMiddlewareParametersSchemaResponse>(
			'/knowledge_bases/middleware/parameters_schema',
		),
	supportedContentTypes: () =>
		client.get<ListSupportedContentTypesResponse>('/knowledge_bases/supported_content_types'),
	create: (body: CreateKnowledgeBaseRequest) =>
		client.post<CreateKnowledgeBaseResponse>('/knowledge_bases/', body),
	update: (knowledgeBaseId: string, body: UpdateKnowledgeBaseRequest) =>
		client.patch<KnowledgeBaseView>(`/knowledge_bases/${knowledgeBaseId}`, body),
	delete: (knowledgeBaseId: string) => client.delete(`/knowledge_bases/${knowledgeBaseId}`),
	listDocuments: (knowledgeBaseId: string) =>
		client.get<ListKnowledgeDocumentsResponse>(`/knowledge_bases/${knowledgeBaseId}/documents`),
	getDocumentStatus: (knowledgeBaseId: string, ids: string[]) => {
		if (ids.length === 0) {
			return Promise.resolve<ListKnowledgeDocumentStatusResponse>({ items: [] });
		}
		return client.get<ListKnowledgeDocumentStatusResponse>(
			`/knowledge_bases/${knowledgeBaseId}/documents/status`,
			{ ids: ids.join(',') },
		);
	},
	uploadDocument: (knowledgeBaseId: string, file: File, options?: UploadDocumentOptions) =>
		uploadDocumentXhr(knowledgeBaseId, file, options),
	deleteDocument: (knowledgeBaseId: string, documentId: string) =>
		client.delete(`/knowledge_bases/${knowledgeBaseId}/documents/${documentId}`),
	search: (knowledgeBaseId: string, body: SearchKnowledgeBaseRequest) =>
		client.post<SearchKnowledgeBaseResponse>(
			`/knowledge_bases/${knowledgeBaseId}/search`,
			body,
		),
};
