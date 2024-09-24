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

export async function sendEmail(context: EventContext, body: FormData): bool {
  let boundary = crypto.randomUUID();

  const url = 'https://api.mailchannels.net/tx/v1/send';
  const result = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
			'X-API-Key': context.env.MAILCHANNELS_API_KEY,
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: context.env.EMAIL, name: 'Sebastian Rasor' }],
        }
      ],
      headers: {
        'CF-Connecting-IP': context.request.headers.get('CF-Connecting-IP'),
      },
      from: {
        name: body.get('name'),
        email: 'noreply@sebastianrasor.com',
      },
      reply_to: {
        name: body.get('name'),
        email: body.get('email'),
      },
      subject: 'Contact Form Submission',
      content: [
        {
          type: 'multipart/encrypted;' +
            'protocol="application/pgp-encrypted";' +
            `boundary="${boundary}";` +
            'charset=utf-8',
          value: `--${boundary}\n` +
            'Content-Type: application/pgp-encrypted\n\n' +
            'Version: 1\n\n' +
            `--${boundary}\n` +
            'Content-Type: application/octet-stream\n\n' +
            body.get('message') +
            '\n\n--${boundary}--',
        },
      ],
    }),
  });

  const outcome = await result.json();
  console.log(outcome);

  return result.ok;
}
