<?php
ob_start();
ini_set('display_errors', '0');
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

/**
 * Universal Joomla User Bridge Variable Provisioner
 * Cross-Compatible: Joomla 3.x, 4.x, and 5.x
 * Bypasses the Joomla 5 System Plugin Redirect Loop via Direct DI Container Bootstrapping
 */

$dev = $dev ?? false;

if ($dev) {
    $jid     = 747;
    $jname   = "Development User";
    $jguest  = 0;
    $myobj         = new \stdClass();
    $myobj->id     = $jid;
    $myobj->groups = ["32", "66", "64"];
    $jgroups = ["32", "66", "64"];
} else {
    if (!defined('_JEXEC')) {
        define('_JEXEC', 1);
    }

    define('JPATH_BASE','/var/www/html');

    require_once JPATH_BASE . '/includes/defines.php';
    require_once JPATH_BASE . '/includes/framework.php';

    // Detect if we are running modern Joomla (4/5) vs Legacy Joomla (3)
    if (class_exists('\\Joomla\\CMS\\Factory') && method_exists('\\Joomla\\CMS\\Factory', 'getContainer')) {
        // --- Joomla 4 / 5 Runtime (Isolated Environment) ---
        // Notice we DO NOT load 'includes/app.php'. Bypassing it prevents system plugins
        // from hooking into the request lifecycle and triggering the redirect loop.

        $container = \Joomla\CMS\Factory::getContainer();

        // Map required core session service aliases inside the isolated container
        $container->alias('session.web', 'session.web.site')
            ->alias('session', 'session.web.site')
            ->alias('JSession', 'session.web.site')
            ->alias(\Joomla\CMS\Session\Session::class, 'session.web.site')
            ->alias(\Joomla\Session\Session::class, 'session.web.site')
            ->alias(\Joomla\Session\SessionInterface::class, 'session.web.site');

        // Instantiate the Site Application directly from the container services
        $app = $container->get(\Joomla\CMS\Application\SiteApplication::class);
        \Joomla\CMS\Factory::$application = $app;

        // Safely pull the user data out of the active browser cookie session
        $user = \Joomla\CMS\Factory::getUser();
    } else {
        // --- Legacy Joomla 3 Runtime ---
        $app = JFactory::getApplication('site');
        $app->initialise();
        $user = JFactory::getUser();
    }

    // Populate exact variables expected by your downstream applications
    $jid     = $user->id;
    $jname   = $user->name;
    $jguest  = $user->guest;

    $myobj         = new \stdClass();
    $myobj->id     = $user->get('id');
    $myobj->groups = $user->get('groups');

    $jgroups = array();
    if (is_array($myobj->groups)) {
        foreach ($myobj->groups as $group) {
            $jgroups[] = (string)$group;
        }
    }
    $myobj->groups = $jgroups;
}

$array1 = array();
//Generate pretty Json array for Sil to use
foreach ($myobj->groups as $array) {
    $array1[] = $array;
}

$array = array(
    'id' => $myobj->id,
    'groups' => $array1
);

echo json_encode($array);
