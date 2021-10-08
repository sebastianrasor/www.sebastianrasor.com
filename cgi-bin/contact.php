<!doctype html>

<!--
contact.php - Allows visitors to send messages to me without exposing my
email address
Written in 2021 by Sebastian Riley Rasor

To the extent possible under law, the author(s) have dedicated all
copyright and related and neighboring rights to this software to the public
domain worldwide. This software is distributed without any warranty.

You should have received a copy of the CC0 Public Domain Dedication along
with this software. If not, see
<http://creativecommons.org/publicdomain/zero/1.0/>.
-->

<html lang="en">
<title>Sebastian Rasor - Contact</title>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="description" content="Sebastian Rasor - Contact">
<meta name=viewport content="width=device-width, initial-scale=1">
<link rel="canonical" href="https://www.sebastianrasor.com/cgi-bin/contact.php">
<link rel="icon" href="/favicon.svg" sizes="any" type="image/svg+xml">
<link rel="stylesheet" href="/styles.css">
<article>
<?php

if($_POST) {
	include("rate_limiter.php");

	if (!check_within_rate_limit("contact", $_SERVER["REMOTE_ADDR"], 1, 60, 0)) {
		die("<p>Please wait before submitting another message.");
	}
	
	if (!check_within_rate_limit("contact", $_SERVER["REMOTE_ADDR"], 10, 3600, 1)) {
		die("<p>Please wait before submitting another message.");
	}
	
	$name = "";
	$email = "";
	$subject = "";
	$message = "";

	if(!empty($_POST["lastname"])) {
		die("<p>Something went wrong.");
	}

	if(empty($_SERVER["HTTP_REFERER"]) || $_SERVER["HTTP_REFERER"] != "https://www.sebastianrasor.com/contact") {
		die("<p>Something went wrong.");
	}

	if(isset($_POST["firstname"])) {
		$name = $_POST["firstname"];
	} else {
		die("<p>Something went wrong.");
	}

	if(isset($_POST["email"])) {
		$email = $_POST["email"];
		if(!filter_var($email, FILTER_VALIDATE_EMAIL)) {
			die("<p>Something went wrong.");
		}
	} else {
		die("<p>Something went wrong.");
	}

	if(isset($_POST["subject"])) {
		$subject = $_POST["subject"];
	} else {
		die("<p>Something went wrong.");
	}

	if(isset($_POST["message"])) {
		$message = $_POST["message"];
	} else {
		die("<p>Something went wrong.");
	}

	$headers = "Reply-To: " . $name . " <" . $email . ">\r\nFrom: " . $name . " <noreply@www.sebastianrasor.com>";
	$myEmail = file_get_contents("/etc/my-email");
	$to = "Sebastian Rasor <" . $myEmail . ">";

	if(mail($to, $subject, $message, $headers)) {
		echo("<p>Thanks for contacting me! I have received your message and will respond as soon as possible.");
	} else {
		die("<p>Something went wrong.");
	}
} else {
	die("<p>Something went wrong.");
}

?>
</article>
