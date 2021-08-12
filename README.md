---

# Figurant Management

This is a Figuranten Management app developed in [Svelte](https://svelte.dev) for Eos Dynamic to use on their [Frontier](https://www.eosfrontier.space/) [LAIT](https://www.eosfrontier.space/homepage/wat-is-lait).

It allows the figuranten to easily generate a name and some aditional information, and to then link this information to their ID badge, which is used by other interactive systems at the LAIT.
It also allows directors to adjust asignment, information, or even delete the figurant character.

If anyone has a fix, update, patch, or even a completely different (hopefully better) way to do things inside this app, you are free to do so directly if you are part of the Eosfrontier IT team. **#IncrementalChange !**

_It's not cookie stealing, it's code to lift 🍪_

### Requires Orthanc & Watchtower

Most interactive systems on Frontier communicate with the server. This app especially requires the API's [Orthanc](https://github.com/eosfrontier/orthanc) and [Watchtower](https://github.com/eosfrontier/eos-watchtower).

Orthanc is used to interact with the database, in which the personas are saved. It is a critical part of how this app functions, and where it sends it's data and how said data is formated. If Orthanc is offline or for some reason not reachable, this app cannot work.

Watchtower is used to gain information about the ingame date, it is not an explicit requirement to have Watchtower enabled.

### Online only functions

Whilst the naming generating part of this app still works (when running as a PWA) without internet connectivity, the export capability is disabled. This is because of the inherit requirement to call the database (via Orthanc).
