<?php
// Create a stream
$opts = array(
  'http'=>array(
    'method'=>"GET",
    'header'=>"token: rj4lki7oLzRsCpmmyrNM "  )
);

$context = stream_context_create($opts);

// Open the file using the HTTP headers set above
$file = file_get_contents('https://apidev2.eosfrontier.space/orthanc/v2/figurant/', false, $context);

echo $file;
?>
