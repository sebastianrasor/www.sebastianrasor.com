/**
 * @license
 * Copyright 2024 Sebastian Rasor <https://www.sebastianrasor.com/contact>
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

import * as urls from '../../src/urls';
import {validateTurnstile} from '../../src/turnstile_validation';
import {validateEmailAddress} from '../../src/email_address_validation';

export const onRequestPost: PagesFunction = async (context) => {
	const body = await context.request.formData();

	const failureRedirect = Response.redirect(urls.FAILURE_URL, 303);
	const badEmailRedirect = Response.redirect(urls.BAD_EMAIL_URL, 303);

	if (!validateTurnstile(context, body)) return failureRedirect;

	try {
		if (!validateEmailAddress(context, body)) return badEmailRedirect;
	} catch (e: unknown) {
		// this shouldn't happen
		if (e.message === 'Unauthorized') return failureRedirect;

		throw e;
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
				'CF-Connecting-IP': context.request.headers.get('CF-Connecting-IP'),
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
