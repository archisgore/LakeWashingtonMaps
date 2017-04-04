# Scuba Diving Maps

This is a very simple, minimalistic, yet powerful single-application to find, store, search for and
catalogue wrecks. It is intended to allow the world-wide dive community to store and share locations
of all the cool sites you love to visit.

## What is it?

This is merely a map that shows various wrecks around the world, hosted at:
http://map.archisgore.com

It has a few key unique features to make life easy:
* URL Linking - the biggest reason I built it for. You can select
a target, or an entire filter and copy the link to send to others. This way you can collaborate
on targets with other people

* It is mobile-friendly. I use it on my phone very frequently.

* It has real-time filtering of all known points, and full-text search.

* Sophisticated comparison operators are supported for filtering with (> depth, <= depth, etc.)

* Instantly jump from a marker to Apple Maps or Google Maps, thus finding driving
  directions to the nearest shore access, or to check out what else is around it.

* No iframes. The entire page is one large map, so there are no weird scrolling problems caused
  by window-within-a-window layouts.

* Public-domain publically-editable markers. You may add, remove, or update markers
  by submitting PRs to this repo: https://github.com/archisgore/dive-site-markers
  So long as your json is valid, the markers will instantly show up in all deployments
  anywhere in the world, since the JSON file is pulled on the client-side from the
  raw URL to it on github. You can also add other metadata, notes, guidelines, etc.

* Open-source. This allows you to edit, modify, add, update, contribute, improve,
  and clone all code that makes it work.

* Purely client-side. For users this doesn't make a difference. But for developers and cloners,
  I have made your life VERY easy. No cumbersome "frameworks", or awkward web server installs
  or ridiculous dependency tries to track, or platforms to worry about.

* All data is stored in git, so you have full history of all repos.

## Roadmap

### Upcoming features:

* Ability to work on markers from the website directly (using github auth), so you don't have to hand-edit the JSON.

### Requested features/contribution:

* Please supply many more Overlay Maps which the NOAA has made public domain, and from other international
  mapping/charting organizations. There are mercator projections out there, and I don't have the time to track them
  down and implement them, unless I am personally going to visit a dive site I care about.

* Please add wreck points you know from the countless diving websites which list GPS coordinates. It helps us all.

## How can I contribute?

Visit this github repository: https://github.com/archisgore/dive-site-markers

Then edit the markers.json file, and add your own entry. This requires a minor technical understand of JSON, but
you should be able to find someone easily.

If not, file an ISSUE: https://github.com/archisgore/dive-site-markers/issues and describe what marker
you wanted to change/add and I can do it too.

## How can I deploy it?

It is a single-page HTML application with relative references, so you can clone
this repository, and get ALL functionality by simply opening the index.html page.

I have placed an index.php which magically gets Heroku to host it as a static website.
You can easily create a blank Heroku dyno and auto-deploy this repo with no changes.

## History

This tool original began as a clone of the GUE Seattle Lake Washington/Union map with
improved functionality, but then it sort of grew into more. GUE Seattle gets full credit for beginning
this and motivating me to do something a bit larger.

## Licence and Usage

This code is licenced under the AGPLv3 (Affero GPL V3 licence). This means that all the code I am hosting,
is available to you, to do with as you please. The hosted website has clear instructions on how to reasonably
and easily find all code. It effectively precludes a "secret sauce" behind the scenes from ever being created.

You can clone this, host it yourself, fork it, update it, etc. without ever having to answer to worry so long
as you also host it under all conditions of the AGPLv3.

