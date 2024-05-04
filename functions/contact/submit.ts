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

  const turnstileValid = await validateTurnstile(context, body);
  if (!turnstileValid) return Response.json({
    error: {
      message: 'Turnstile validation failed. Please try again.'
    }
  }, {
    status: 400,
  });

  const emailValid = await validateEmailAddress(context, body);
  if (!emailValid) return Response.json({
    error: {
      message: 'Please enter a valid email address.'
    }
  }, {
    status: 400,
  });

  const emailSent = await sendEmail(context, body);
  if (!emailSent) return Response.json({
    error: {
      message: 'Failed to send email. Please try again later.'
    }
  }, {
    status: 500,
  });

  return Response.json({
    data: {
      success: true
    }
  });
}
