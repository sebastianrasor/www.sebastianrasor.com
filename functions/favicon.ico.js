export function onRequest(context) {
	return new Response(null, {
		status: 204,
		headers: new Headers({
			"Cache-Control": "max-age=31536000",
		}),
	});
}
