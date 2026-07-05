import { ElMessage } from 'element-plus';

export const getBaseUrl = () => localStorage.getItem('server_url') ?? '';
export const getUserId = () => localStorage.getItem('username') ?? '';

export class ApiError extends Error {
	readonly status: number;
	readonly detail: string;

	constructor(status: number, detail: string) {
		super(detail);
		this.name = 'ApiError';
		this.status = status;
		this.detail = detail;
	}
}

interface RequestOptions {
	method?: string;
	body?: unknown;
	params?: Record<string, string>;
	silent?: boolean;
}

function buildHeaders(hasBody: boolean): Record<string, string> {
	const headers: Record<string, string> = { 'X-User-ID': getUserId() };
	if (hasBody) headers['Content-Type'] = 'application/json';
	return headers;
}

async function extractErrorDetail(res: Response): Promise<string> {
	const text = await res.text();
	try {
		const json = JSON.parse(text) as { detail?: unknown };
		if (typeof json.detail === 'string') return json.detail;
		if (json.detail !== undefined) return JSON.stringify(json.detail);
	} catch {
		// not JSON
	}
	return text || res.statusText;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
	const { method = 'GET', body, params, silent = false } = options;
	const url = new URL(path, getBaseUrl());
	if (params) {
		Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
	}

	const res = await fetch(url.toString(), {
		method,
		headers: buildHeaders(body !== undefined),
		body: body ? JSON.stringify(body) : undefined,
	});

	if (!res.ok) {
		const detail = await extractErrorDetail(res);
		const error = new ApiError(res.status, detail);
		if (!silent) ElMessage.error(detail);
		throw error;
	}

	if (res.status === 204) return undefined as T;
	return res.json() as Promise<T>;
}

async function streamRequest(
	path: string,
	options: RequestOptions & { signal?: AbortSignal } = {},
): Promise<Response> {
	const { method = 'GET', body, params, signal, silent = false } = options;
	const url = new URL(path, getBaseUrl());
	if (params) {
		Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
	}

	const res = await fetch(url.toString(), {
		method,
		headers: buildHeaders(body !== undefined),
		body: body ? JSON.stringify(body) : undefined,
		signal,
	});

	if (!res.ok) {
		const detail = await extractErrorDetail(res);
		const error = new ApiError(res.status, detail);
		if (!silent) ElMessage.error(detail);
		throw error;
	}

	return res;
}

export const client = {
	get: <T>(path: string, params?: Record<string, string>) =>
		request<T>(path, { method: 'GET', params }),
	post: <T>(path: string, body?: unknown, params?: Record<string, string>) =>
		request<T>(path, { method: 'POST', body, params }),
	patch: <T>(path: string, body?: unknown, params?: Record<string, string>) =>
		request<T>(path, { method: 'PATCH', body, params }),
	delete: <T = void>(path: string, params?: Record<string, string>) =>
		request<T>(path, { method: 'DELETE', params }),
	stream: (path: string, options?: RequestOptions & { signal?: AbortSignal }) =>
		streamRequest(path, options),
};
