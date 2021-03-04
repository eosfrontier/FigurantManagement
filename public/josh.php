<?php
stream_context_set_default(
    array(
        'http' => array(
            'method' => 'OPTIONS'
        )
    )
);
$headers = get_headers('https://apidev2.eosfrontier.space/orthanc/v2/figurant/');
echo json_encode($headers);
?>
