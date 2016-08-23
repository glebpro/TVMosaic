# TVMosaic
A video aggregation engine and interface built with asynchronous Javascript.

![Homepage](/screenshotTVMosaic.png?raw=true "Homepage")

File Descriptions:

- index.html
	The initial DOM, to be populated with channel and video infornmation from ReleTV_core.js. Contains code for both desktop and mobile web views. 

- stylesheet.css
	Styles for the desktop and mobile web views. 

- ReleTV_core.js
	Asynchronous loads the desktop/mobile website alongside retriving the requests to get the video infornmation.

- ReleTV_config.js
	Contains the configuration details of the site, including what channels to get videos from, as well as addiontal video sources, and advertisment configuration. 

- ReleTV_color_config.css
	Site color config.

- fakeScroll.js
	A small script to stylize the scrollbar. 

- pep.js
	A small script to enhance mobile web expirience. Thank you [briangonzalez](https://github.com/briangonzalez/jquery.pep.js).

- promise.js
	Script to define the otherwise un-defined javascript Promise() tool for Internet Explorer 9+.

- tooltip.js
	Script to efficiently display tooltips on hover over certian elements.

- xml2json.php
	A PHP file to allow cross domain XMLHttpRequests to be done.








