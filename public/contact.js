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

import * as openpgp from './openpgp.min.mjs';

const PUBLIC_KEY_FINGERPRINTS = [
	'0878ED162F8B295F25AC197BF20DE4BA5B36D4E9',
	'4F398377C6B30D6397ECD7CE4A14A9E2AC256044',
	'7832D6BEC9B064F47B7DA043F10C0FFD5B533126',
];

const form = document.getElementById("contact-form");
const idempotencyKey = crypto.randomUUID();
const labelForMessage = document.querySelector("label[for=message]");
const originalInnerText = labelForMessage.innerText;

window.fetchPublicKeyArmored = async (keyFingerprint) => {
	const url = `/pgp-keys/${keyFingerprint}.asc`;
	const result = await fetch(url);
	const outcome = await result.text();

	return outcome;
};

window.constructPublicKeys = async (publicKeyFingerprints) => {
	const publicKeys = [];

	for (const publicKeyFingerprint of publicKeyFingerprints) {
		const publicKeyArmored = await fetchPublicKeyArmored(publicKeyFingerprint);
		const publicKey = await openpgp.readKey({
			armoredKey: publicKeyArmored
		});
		publicKeys.push(publicKey);
	};

	return publicKeys;
};

let blockEnableSubmit = false;
window.enableSubmit = () => {
	if (blockEnableSubmit) return;

	form.btnSubmit.disabled = false;
	form.btnSubmit.value = "Send Message";
	form.btnSubmit.classList.remove("button-disabled");
}

window.disableSubmit = () => {
	form.btnSubmit.disabled = true;
	form.btnSubmit.value = "Please wait...";
	form.btnSubmit.classList.add("button-disabled");
}

window.handleError = (errorMessage, restoreMessage) => {
	labelForMessage.innerText = errorMessage;

	const duration = errorMessage.split(/\s/g).length / (200 / 60);
	setTimeout(function() {
		form.message.value = restoreMessage;
		labelForMessage.innerText = originalInnerText;
		form.name.readOnly = false;
		form.email.readOnly = false;
		form.message.readOnly = false;
		blockEnableSubmit = false;
		enableSubmit();
	}, duration * 1000)

	return false;
}

window.addEventListener("submit", async (event) => {
	event.preventDefault();

	const form = event.target;

	if (form.btnSubmit.disabled) {
		return false
	}

	disableSubmit();
	blockEnableSubmit = true;

	form.name.readOnly = true;
	form.email.readOnly = true;
	form.message.readOnly = true;
	form.name.blur();
	form.email.blur();
	form.message.blur();

	labelForMessage.innerText =
		"Your message is being encrypted prior to submission."

	const encryptedMessage = await openpgp.encrypt({
		message: await openpgp.createMessage({
			text: "Content-Type: text/plain;charset=utf-8\n\n"
				+ form.message.value
		}),
		encryptionKeys: await constructPublicKeys(PUBLIC_KEY_FINGERPRINTS),
	})

	const unencryptedMessage = form.message.value;
	form.message.value = encryptedMessage;

	const formData = new FormData(form);
	formData.append("idempotency_key", idempotencyKey);

	const result = await fetch("/contact/submit", {
		method: "POST",
		body: formData,
	})

	if (!result.ok) {
		handleError(
			"Unexpected server error. Please try again later.",
			unencryptedMessage);
		return false;
	}

	const outcome = await result.json();

	if ("error" in outcome) {
		handleError(outcome.error.message, unencryptedMessage);
		return false;
	}

	const success = document.getElementById("success");
	form.hidden = true;
	success.hidden = false;
	turnstile.remove();

	return false;
})
