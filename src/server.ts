import { readCleartextMessage, readKey, verify } from 'openpgp';
import unraw from 'unraw';

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
	//
	// Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
	// MY_QUEUE: Queue;

	PUBLIC_KEY: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		const base64_signed_url = url.searchParams.get('url');

		if (!base64_signed_url) {
			return new Response('No signed url provided', { status: 400 });
		}

		const plain_signed_url = atob(base64_signed_url);

		const signed_url = unraw(plain_signed_url);

		const publicKey = await readKey({ armoredKey: env.PUBLIC_KEY });

		const signedMessage = await readCleartextMessage({
			cleartextMessage: signed_url
		});

		const verificationResult = await verify({
			message: signedMessage,
			verificationKeys: publicKey
		});

		if (!await (verificationResult.signatures[0].verified)) {
			return new Response('Invalid signature', { status: 400 });
		}

		return Response.redirect(verificationResult.data, 301);
	},
};
