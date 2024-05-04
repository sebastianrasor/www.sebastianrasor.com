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

export async function validateTurnstile(context: EventContext, body: FormData): bool {
  const idempotencyKey = body.get('idempotency_key');
  const token = body.get('cf-turnstile-response');
  const ip = context.request.headers.get('CF-Connecting-IP');

  let formData = new FormData();
  formData.append('secret', context.env.TURNSTILE_SECRET_KEY);
  formData.append('response', token);
  formData.append('remoteip', ip);
  formData.append('idempotency_key', idempotencyKey);

  const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
  const result = await fetch(url, {
    body: formData,
    method: 'POST',
  });

  const outcome = await result.json();
  return outcome.success;
}
