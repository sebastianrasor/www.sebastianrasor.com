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

export async function validateEmailAddress(context: EventContext, body: FormData): bool {
	const url = 'https://checkemail.sebastianrasor.com/' + body.get('email');
	const result = await fetch(url, {
		headers: {
			'Authorization': `Bearer ${context.env.CHECKEMAIL_KEY}`
		}
	});

	const outcome = await result.json();

	if ("error" in outcome) {
		throw new Error(outcome.error.message);
	}

	return outcome.data.isEmailAddressValid;
}
