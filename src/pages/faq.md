---
layout: ../layouts/Docs.astro
title: "Frequently Asked Questions"
description: "Straight answers about TAK, servers, plugins, licensing and cost."
---

### What is TAK?

TAK is a Government Off The Shelf (GOTS) suite of situational awareness applications from the federal government. 

TAK is an acronym.

The military version is called the Tactical Assault Kit while the civilian version is deamed the Team Awareness Kit.

### How is Public Safety using TAK today?

[TAK Public Safety](https://www.takps.org) is a 501(c)(3) non-profit, founded in 2024, that works to make TAK accessible for public safety agencies in the U.S. and around the world. It runs parallel to the TAK Product Center: TAK Product Center serves the official product line and the government community, while TAK Public Safety focuses on law enforcement, fire, EMS, wildland fire, homeland security and search and rescue. It hosts the CivTAK conference and regional gatherings where practitioners share what works on incidents and events, publishes field stories from peer agencies, and keeps a resource library. Membership is free for individuals, and agencies and companies can join too. It is a good first stop to see how agencies like yours are using TAK.

TAK is largely being used in federal law enforcement, dignitary protection and to a lesser degree in the fire service. Statewide deployments are up and running in Colorado ([COTAK](https://cotak.gov)), Texas (TX-DPS) and North Carolina (NCTAK). At a local level counties and cities are seeing the benefit of TAK as a method to better manage their local incidents and have the ability to collaborate on a common platform with federal entities like the FBI. The Coconino County Arizona Sheriff Search & Rescue Team is leveraging TAK as way to better manage their search operations.   

On the fire service front, COTAK, the State of Colorado's TAK program run by the Colorado Center of Excellence, is leading the way; more information can be found [here](https://www.cofiretech.org/feature-projects/team-awareness-kit-tak). At a local level the State of Colorado, Corona Fire Department and the Youngseville Fire Department have been deploying TAK as an all hazards tool. [The TAK Syndicate](https://www.youtube.com/channel/UCwQGzHkLVJiNzJJvh3lLGmA) and [State of Colorado Center of Excellence](https://www.youtube.com/@coetak) YouTube channels have a large library of videos showing how TAK can be integrated into the fire service. 

TAK has seen success supporting EMS support at large events such as the [Outside Lands Music Festival](https://www.sfoutsidelands.com/) in San Francisco. This [video](https://www.youtube.com/watch?v=QaVy15l2mxM) from Greg Albrecht explains it well.

### Where is TAK really making a difference?

TAK makes its biggest impact with dismounted resource tracking and collaboration. Public safety as a whole has adopted technology to track where police/ems/fire vehicles are but when the personnel become dismounted and step away from the vehicle their position is unknown. When a public safety member has deployed TAK the can see themselves and their relationship to other users in real-time no matter where they are. Collaboration takes place while looking at common mapping application which reduces confusion and the requirement to ask questions over the airwaves.

### What are the different versions of TAK?

| Platform | TAK clients |
|---|---|
| Android | ATAK |
| iOS | iTAK, TAK Aware |
| Windows | WinTAK |
| Windows & Linux | TAKX |
| Browser | WebTAK, [CloudTAK](https://github.com/dfpc-coe/CloudTAK) |
| Smartwatch | [WearTAK](#can-i-run-tak-on-a-watch) |
| Virtual Reality | VR-TAK |

### Where do I get ATAK/WinTAK and associated Plugins?

The official U.S. Govt. repository is at [www.TAK.gov](http://www.tak.gov) and is the authoritative source for all TAK products. 

If you are a government employee you can register at [www.TAK.gov](http://www.tak.gov) and gain access to government specific plugins. 

Only military members have access to the Tactical Assault Kit. 

The civilian version of ATAK and publicly released plugins can be downloaded at the [Google Play Store](https://play.google.com/store/apps/details?id=com.atakmap.app.civ&hl=en_US&gl=US). 

The Play Store version does not come bundled with a few plugins that the version you will get from TAK.gov due to size limits from the playstore. 

Third-party plugins are typically available directly from their developer or integrator. The free [TAKwerx Market](/plugins/takwerx-market/) plugin lists the [TAKwerx plugins](/plugins/) and listed community plugins inside ATAK, installs the build that matches your ATAK version, and keeps them updated.

### Where can I get iTAK and TAK Aware?

iTAK can be downloaded from the [Apple App Store](https://apps.apple.com/us/app/itak/id1561656396).

TAK Aware, an iOS TAK client from Flight Tactics, is also on the [Apple App Store](https://apps.apple.com/us/app/tak-aware/id6738631659).


iOS TAK clients don't have a plugin architecture, so they are limited to the capabilities built into the core application.

### Can I run TAK on a watch?

Yes. [WearTAK](https://ascentitech.com/) from Ascent Integrated Tech puts TAK on a Samsung Galaxy smartwatch. The watch is a TAK device of its own: it sends and receives Cursor on Target directly, so it works with your existing TAK Server and needs no plugin and no server changes.

WearTAK shows your team on the map at a glance on your wrist. It can also watch the wearer's vital signs (heart rate, skin temperature, blood oxygen, exertion, cold stress and signs of major trauma) and send an automatic alert to command when something is wrong. Data is tied to the callsign, such as a riding position on an engine, not to a named person, and each wearer can turn the health monitoring off on the watch.

It was built with the Air Force TAK Center of Excellence, is fielded across the Department of Defense, and is being piloted by fire departments. Ascent says WearTAK is free for public safety. Get it from the "Get WearTAK" page on [ascentitech.com](https://ascentitech.com/).

### What is a Plugin?

A plugin is a companion application that adds additional capability like hardware integration, access to additional data elements or task specific functions into ATAK and WinTAK.

### What is a TAK Server used for?

A TAK Server is used to connect disparate users on different networks together. 

A TAK Server can also be used as host for data to be shared and stored between users.

### What are my options for a TAK Server?

There are several options for a TAK Server. 

The official TAK Server from the federal government is available for download at [www.TAK.gov](http://www.tak.gov). You can deploy this in your own environment as you see fit. Here is a [helpful tutorial](https://mytecknet.com/lets-build-a-tak-server/) to explain the ins and outs of TAK Server.

[infra-TAK](/infra-tak/) is a free, open-source web console that deploys and manages TAK Server in your own environment, along with Authentik, TAK Portal, SSL, CloudTAK, MediaMTX video and Node-RED. Upload the TAK Server package from TAK.gov and run the rest from the browser.

[TryTAK](https://trytak.org/) is a free, hosted community TAK Server. It lets your agency try TAK out free of charge before you commit to a deployment of your own.

A variety of vendors offer TAK Server as a Service. You can leave it to them to manage your deployment. A list of vendors in no particular order of preference; Realm Alliance, Parsons, Booz Allen, RaytheonBBN, EOTAK, GoTAK, Syzygy, TAKGRID and District 47. [OpenTAKServer](https://opentakserver.io) is an open-source TAK server you can deploy in your own environment. All of these vendors are listed on the [Links page](/links/).

### Does TAK work without a cellular connection?

One of the greatest features about TAK is its ability to work on a variety of networks and communication pathways. If you work in areas with poor to no cellular coverage, TAK provides an opportunity to continue to communicate. 

Alternative communications solutions from the following vendors, in no particular order of preference: Somewear Labs, Beartooth, goTenna, Tough Stump ATOS, Doodle Labs, TrellisWare, Persistent Systems, Silvus and Nokia Federal (formerly Fenix Group). Many of them are on the [Links page](/links/).

Two open-source, low-cost LoRa mesh projects work with no cell or internet connection at all. [Meshtastic](https://meshtastic.org/docs/software/integrations/integrations-atak-plugin/) has an ATAK plugin that carries positions, chat and other TAK traffic over the mesh. [MeshCore](https://meshcore.co.uk/) is a newer off-grid mesh system on the same kind of radios; it is built for messaging, and TAK support for it is still on developers' roadmaps.

ATAK and TAK Aware have also been tested over T-Mobile's satellite service (T-Satellite), which connects compatible phones directly to satellites where there is no cell coverage.

### Can I use a Drone/UAS with TAK?

Many commercially available drones/UAS platforms can be used inside the TAK ecosystem via the ATAK UAS-Tool Plugin available on the Google Playstore. See the TAK Syndicate youtube channel for a brief introduction to the benefits of using a drone/UAS in ATAK.

The [UAS page](/uas/) covers the rest: what it takes to get a drone flying with TAK (MAVLink, OEM SDKs, UAS Relay), drone video, fleet ETLs, mapping and airspace.

### How does TAK help with airspace awareness?

TAK is one of the best places to bring the airspace together, because everything arrives as a point on the same shared map.

- **Crewed aircraft (ADS-B).** Most aircraft broadcast their position, altitude and callsign over ADS-B. ATAK can show them from a networked feed, pushed out through a TAK Server so the whole team sees the same traffic, or directly from a small ADS-B receiver at the incident when there is no network.
- **Drones (Remote ID).** Most drones in the U.S. now broadcast Remote ID: the drone's position and altitude, its serial number, and where the pilot is standing. A Remote ID receiver turns that into TAK markers, so a crew can see every drone flying near the incident, not only their own.
- **Restrictions.** The free TAKwerx [Air Aware](/plugins/air-aware/) plugin draws TFRs, NOTAMs, airspace classes, drone ceilings and no-fly areas in ATAK, so a crew knows what it may do where it is standing.

The same approach works for every other sensor. RF detectors, acoustic sensors, radar, and EO/IR cameras can all send their detections into TAK as Cursor on Target. Instead of a separate screen for each system, everyone on the TAK Server shares one picture of what is in the air and on the ground. Companies that build these integrations, such as UAS Strategic, Nine Hill Technologies, Echodyne and Sensors & Signals, are on the [Links page](/links/).

### How much does TAK cost?

While the TAK applications are free from the federal government the costs associated with running a TAK program stem from deploying a server, the cost of end eser devices (phones, tablets etc), additional communication devices such as mesh radios, video and UAS Integrations, etc. The benefit of TAK is you can start out small and scale to what fits your needs and budget.

### Who are the vendors listed on the links tab?

The links page is meant to be a town square where vendors who work in the TAK space can be seen. A listing is not an endorsement and there are no financial interests.

### Where can I collaborate with other TAK users?

 Both r[eddit](https://www.reddit.com/r/ATAK/) and [Discord](https://discord.gg/wNHJ9YZ) have open community chatrooms that discuss all aspects of TAK. 

The Tak Syndicate has a closed space for public safety users to discuss deployment and development. If you are in public safety and would like to join this group please send an email to [thetaksyndicate@gmail.com](mailto:thetaksyndicate@gmail.com)

### Where can I get updated news on TAK?

 A great reseource to stay up to date on all TAK related news is at [www.civtak.org](http://www.civtak.org)

### How do I get started?

For more information please contact us at [thetaksyndicate@gmail.com](mailto:thetaksyndicate@gmail.com). 

We are a free resource.
