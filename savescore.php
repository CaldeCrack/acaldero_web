<?php
    error_reporting(E_ALL);
    $username = $_POST['username'];
    $score = $_POST['score'];
    $f = fopen('scoreaboard.txt', 'w+');
    fwrite($f, "{$username},{$score}");
    fclose($f);
?>
