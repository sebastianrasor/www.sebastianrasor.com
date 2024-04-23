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
import {sendEmail} from '../../src/mailchannels_send';
import {validateEmailAddress} from '../../src/email_address_validation';
import {validateTurnstile} from '../../src/turnstile_validation';

export const onRequestPost: PagesFunction = async (context) => {
	const body = await context.request.formData();

	const badEmailRedirect = Response.redirect(urls.BAD_EMAIL_URL, 303);
	const failureRedirect = Response.redirect(urls.FAILURE_URL, 303);
	const successRedirect = Response.redirect(urls.SUCCESS_URL, 303);

	try {
		if (!await validateTurnstile(context, body)) return failureRedirect;
		if (!await validateEmailAddress(context, body)) return badEmailRedirect;
		if (!await sendEmail(context, body)) return failureRedirect;
	} catch (e: unknown) {
		console.error(e);
		return failureRedirect;
	}

	return successRedirect;
}
