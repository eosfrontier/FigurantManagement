<?php
//ini_set('display_errors', 1);
//ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

define('_JEXEC', 1);
define('JPATH_BASE', '/var/www/html/');

// Required Files
require_once JPATH_BASE . '/includes/defines.php';
require_once JPATH_BASE . '/includes/framework.php';

// To use Joomla's Database Class

$app = JFactory::getApplication('site');
$user = JFactory::getUser();

if ($user->get('guest')) {
    $cookieName =
        'joomla_remember_me_' . JUserHelper::getShortHashedUserAgent();
    // Check for the cookie
    if ($app->input->cookie->get($cookieName)) {
        $app->login(array('username' => ''), array('silent' => true));
        $user = JFactory::getUser();
    }
}

$myobj = new \stdClass();
$myobj->id = $user->get('id');
$myobj->groups = $user->get('groups');

//$myjson = json_encode($myobj);
//echo "ID:", $myobj->id, "\r\n";
//echo "Groups:", json_encode($myobj->groups), "\n";

//Generate pretty Json array for Silvester to use
foreach ($myobj->groups as $array) {
    $array1[] = $array;
}

$array = array(
    'id' => $myobj->id,
    'groups' => $array1
);

echo json_encode($array);

//	foreach ($groups as $group)
//	{
//    	echo json_encode(Group = ' . $group . '</p>';
//	}
//	echo "Groups:", json_encode($user->get('groups')),"\n";

?>
