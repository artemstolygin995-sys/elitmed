<?php
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $to = "elit.med.77@bk.ru"; // заменить на почту клиники
    $name = htmlspecialchars($_POST["name"] ?? "");
    $phone = htmlspecialchars($_POST["phone"] ?? "");
    $message = htmlspecialchars($_POST["message"] ?? "");
    $subject = "Новая заявка с сайта ElitMed";
    $body = "Имя: $name\nТелефон: $phone\nСообщение: $message";
    $headers = "Content-Type: text/plain; charset=UTF-8";
    if (mail($to, $subject, $body, $headers)) {
        echo "ok";
    } else {
        echo "error";
    }
}
?>
