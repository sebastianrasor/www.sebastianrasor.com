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

import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage } from 'mimetext';

export async function sendEmail(context: EventContext, body: FormData): bool {
  const boundary = crypto.randomUUID();

	const msg = createMimeMessage;
	msg.setSender({ name: body.get('name'), addr: 'noreply@cfworker.sebastianrasor.com' });
	msg.setReplyTo({ name: body.get('name'), addr: body.get('email') });
	msg.setRecipient({ name: 'Sebastian Rasor', addr: context.env.EMAIL });
	msg.setSubject('Contact Form Submission');
	msg.setHeader('CF-Connecting-IP', context.request.headers.get('CF-Connecting-IP'));
	msg.addMessage({
		contentType: 'multipart/encrypted;'
							 + 'protocol="application/pgp-encrypted";'
							 + `boundary="${boundary}";`
							 + 'charset=utf-8',
		data: `--${boundary}\n`
        + 'Content-Type: application/pgp-encrypted\n\n'
        + 'Version: 1\n\n'
        + `--${boundary}\n`
        + 'Content-Type: application/octet-stream\n\n'
        + body.get('message')
        + `\n\n--${boundary}--`,
	});

	console.log(msg.asRaw());

	const message = new EmailMessage(
		'noreply@cfworker.sebastianrasor.com',
		context.env.EMAIL,
		msg.asRaw(),
	);

	try {
		await env.SEB.send(message);
	} catch (e) {
		return false
	}

  return true;
}
