import { ref, onMounted, readonly } from 'vue';
import { credentialApi } from '@/api';
import type { CredentialRecord, CreateCredentialRequest, UpdateCredentialRequest } from '@/api';

export function useCredentials() {
	const credentials = ref<CredentialRecord[]>([]);
	const loading = ref(false);
	const error = ref<Error | null>(null);

	async function refetch() {
		loading.value = true;
		error.value = null;
		try {
			const res = await credentialApi.list();
			credentials.value = res.credentials;
		} catch (e) {
			error.value = e as Error;
		} finally {
			loading.value = false;
		}
	}

	onMounted(() => {
		refetch();
	});

	async function create(body: CreateCredentialRequest) {
		const res = await credentialApi.create(body);
		await refetch();
		return res;
	}

	async function update(credentialId: string, body: UpdateCredentialRequest) {
		await credentialApi.update(credentialId, body);
		await refetch();
	}

	async function remove(credentialId: string) {
		await credentialApi.delete(credentialId);
		await refetch();
	}

	return {
		credentials: readonly(credentials),
		loading: readonly(loading),
		error: readonly(error),
		refetch,
		create,
		update,
		remove,
	};
}
