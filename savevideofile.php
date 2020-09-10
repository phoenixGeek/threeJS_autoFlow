<?php

if($_FILES['videofile'] && $_POST['videoname']){

    $filename = $_POST['videoname'];
    $my_file = $_FILES['videofile'];
    $my_blob = file_get_contents($my_file['tmp_name']);
    file_put_contents($filename.'.webm', $my_blob);
}

