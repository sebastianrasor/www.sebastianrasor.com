/**
 * @license
 * Copyright 2023 Sebastian Rasor <https://www.sebastianrasor.com/contact>
 *
 * This file is part of www.sebastianrasor.com
 *
 * www.sebastianrasor.com is free software: you can redistribute it and/or 
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * www.sebastianrasor.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of 
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
 * General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with www.sebastianrasor.com. If not, see
 * <https://www.gnu.org/licenses/>.
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

	const checkemail_response_text = await checkemail_response.text()

	if (!checkemail_response.ok) {
		console.log("checkemail API fail");
		console.log(checkemail_response_text);
		console.log(checkemail_response.status);
		console.log(checkemail_response.statusText);
		return Response.redirect('https://www.sebastianrasor.com/contact/failure', 303);
	}

	if (checkemail_response_text != 'True') {
		return Response.redirect('https://www.sebastianrasor.com/contact/bad-email', 303);
	}

	let boundary = crypto.randomUUID();
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
					type: `multipart/encrypted; protocol="application/pgp-encrypted"; boundary="${boundary}"; charset=utf-8`,
					value: [
						`--${boundary}`,
						'Content-Type: application/pgp-encrypted',
						'',
						'Version: 1',
						'',
						`--${boundary}`,
						'Content-Type: application/octet-stream',
						'',
						body.get('message'),
						'',
						`--${boundary}--`
					].join('\n')
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
