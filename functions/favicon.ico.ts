export const onRequest: PagesFunction = async (context) => {
  return new Response(null, {
    status: 204,
	headers: {
		"Cache-Control": "public, max-age=31536000, immutable",
	},
  });
}
