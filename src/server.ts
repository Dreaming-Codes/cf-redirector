import { Hono } from 'hono';
import { readCleartextMessage, readKey, verify } from 'openpgp';
import { HTTPException } from 'hono/http-exception';

type Bindings = {
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

const app = new Hono<{ Bindings: Bindings }>();

app.post('/', async (ctx) => {
	const signed_url = await ctx.req.text();

	const publicKey = await readKey({ armoredKey: ctx.env.PUBLIC_KEY });

	const signedMessage = await readCleartextMessage({
		cleartextMessage: signed_url
	});

	const verificationResult = await verify({
		message: signedMessage,
		verificationKeys: publicKey
	});

	if (!await (verificationResult.signatures[0].verified)) {
		throw new HTTPException(400, { message: 'Invalid signature' });
	}

	ctx.redirect(verificationResult.data);
});

export default app;
