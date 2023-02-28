/*
 * Copyright (c) 2023 Sebastian Riley Rasor <https://www.sebastianrasor.com/contact>
 *
 * Permission to use, copy, modify, and distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

export const onRequestPost: PagesFunction = async (context) => {
	const body = await context.request.formData();
	const token = body.get('cf-turnstile-response');
	const ip = context.request.headers.get('CF-Connecting-IP');

	let formData = new FormData();
	formData.append('secret', context.env.TURNSTILE_SECRET_KEY);
	formData.append('response', token);
	formData.append('remoteip', ip);

	const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
	const result = await fetch(url, {
		body: formData,
		method: 'POST',
	});

	const outcome = await result.json();
	if (outcome.success) {
		let send_request = new Request('https://api.mailchannels.net/tx/v1/send', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
			},
			body: JSON.stringify({
				personalizations: [
					{
						to: [
							{
								name: 'Sebastian Rasor',
								email: '***REMOVED***',
							},
						],
						dkim_domain: 'sebastianrasor.com',
						dkim_selector: 'mailchannels',
						dkim_private_key: context.env.DKIM_PRIVATE_KEY,
					},
				],
				from: {
					name: body.get('name'),
					email: 'noreply@sebastianrasor.com',
				},
				reply_to: {
					name: body.get('name'),
					email: body.get('email'),
				},
				headers: {
					'CF-Connecting-IP': ip,
				},
				subject: 'Contact Form Submission',
				content: [
					{
						type: 'text/plain',
						value: body.get('message'),
					},
				],
			}),
		});

		const response = await fetch(send_request);

		if (response.ok) {
			return Response.redirect('https://www.sebastianrasor.com/contact/success', 303)
		}
	}
	return Response.redirect('https://www.sebastianrasor.com/contact/failure', 303)
}