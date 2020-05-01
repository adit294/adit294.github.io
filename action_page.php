<?php

if(isset($_POST['submit'])){

$name = $_POST['name'];
$email = $_POST['email'];
$message = $_POST['subject'];
$countryfrom = $_POST['country'];

$mailTo = "hi@aditagrawl.com";
$subject = "Contact Form";
$headers = "From: ".$email;
$txt ="You have received an email from ".$name.".\n\n".$message;

mail($mailTo, $subject, $txt, $headers or die("Error!"));
header("Location: action_page.php?mailsent");
echo "Thank You!";
}

