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

	const turnstile_response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
		body: formData,
		method: 'POST',
	});

	const turnstile_outcome = await turnstile_response.json();

	if (!turnstile_outcome.success) {
		console.log("turnstile API fail");
		console.log(JSON.stringify(turnstile_response.body));
		console.log(turnstile_response.status);
		console.log(turnstile_response.statusText);
		return Response.redirect('https://www.sebastianrasor.com/contact/failure', 303);
	}

	const checkemail_response = await fetch(`https://checkemail.sebastianrasor.com/${body.get('email')}`, {
		headers: {
			'Authorization': `Bearer ${context.env.CHECKEMAIL_KEY}`
		}
	})

	console.log(checkemail_response.body)

	if (!checkemail_response.success) {
		console.log("checkemail API fail");
		console.log(JSON.stringify(checkemail_response.body));
		console.log(checkemail_response.status);
		console.log(checkemail_response.statusText);
		return Response.redirect('https://www.sebastianrasor.com/contact/failure', 303);
	}

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
							email: context.env.EMAIL,
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

	const mailchannels_response = await fetch(send_request);

	if (!mailchannels_response.ok) {
		console.log("mailchannels API fail");
		console.log(JSON.stringify(mailchannels_response.body));
		console.log(mailchannels_response.status);
		console.log(mailchannels_response.statusText);
		return Response.redirect('https://www.sebastianrasor.com/contact/failure', 303);
	}

	return Response.redirect('https://www.sebastianrasor.com/contact/success', 303)
}
