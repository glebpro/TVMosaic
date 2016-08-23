//~~~~~~~~ NOTES
// all images should be in the /images folder
// logo image name is : logo.png
// custom tabs have the the format : tabicon_#.png
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~SITE TITLE
document.title = "TVMosaic";

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ LOGO CONFIG
// logo URL, used on loading screen and top-left corner of site
// logo preferably sized for a 350x75px box 
var logo = 'images/logo.png';
var logo_icon = 'images/logo_icon.png';

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ AD CONFIG
var adConfig = {
    max_ibv             : 1,      // ???
    leftListAdEvery     : 6,      // NOTE: must be at least 24 videos for this to display all of them
    leftListAdMAX       : 4,      // 0 to disable
    leftListOffset      : 2,      // start showing ads after this many left list videos
    rightBoxAd1Flag     : false,  // show 160x600ad to the LEFT of big player/mosaic
    rightBoxAd2Flag     : true,   // show 160x600ad to the RIGHT of big player/mosaic //NOTE: will work if either or both false or true
    loadInBannerVideoCounter   : 1,      // promote the first this many leftList ads into in-banner videos
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ TIMEOUT CONFIG
var timeouts = {
    getVideoTimeout     : 3000, // when doing original $.get() of videos, skip channel if getting it's videos takes longer than this many milliseconds
    updateVideoTimeout  : 3000, // when updating vidoes, add this much time to the $.get timeout
    updateVideoInterval : 5,    // default updating of videos to once every 5 mintues
    latestVideoHourCutoff : 1,    // only videos that were published less than this many hours ago show up in 'latest' cateogory

}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ CATEGORY CONFIG
// each category corresponds to a tab on the site's channel box
// each channel in mChannelDict must have their 'category' to match a 'category' in here
// includes customizable tabs as well as the 'latest' and 'favorites' hardcoded tabs
// tabs will be displayed in order that they are listed here
// entries consist of:
/*
    {
        'category'  : 'category',       // category to match 'category' in entry in mChannelDict, no spaces!
        'title'     : 'title',          // title displaye in the tab, works best if less that 16 charecters
        'icon'      : 'icon_URL',       // category icons preferably sized for a 20x20px box, desktop
        'mobileicon': 'mobileicon_URL'  // mobile icon
        'showFirst' : 'true/false',     // if true, show this category first on desktop version load
        'nobox'     : 'false/function'  // certain tabs will not have associated channels, give function name to call instead, false if has channel box
    }
*/
var categories = [

    // hardcoded tab
    {
        'category'   : 'live',
        'title'      : 'Live \u25CF',
        'icon'       : 'images/liveNowIcon.png',
        'showFirst'  : 'false',
        'nobox'      : 'loadLiveMosaic'
    },
    {
        'category'   : 'latest',
        'title'      : 'Latest',
        'icon'       : 'images/whiteStar.png',
        'showFirst'  : 'false',
        'nobox'      : 'loadLatestMosaic'
    },
    {
        'category'   : 'recentWatched',
        'title'      : 'Just Watched',
        'icon'       : 'images/eye.png',
        'showFirst'  : 'false',
        'nobox'      : 'loadRecentlyWatched'
    },
    
    // customizable tabs
    {
        'category'   : 'national',
        'title'      : 'National TV',
        'icon'       : 'images/tabicon_1.png',
        'showFirst'  : 'true',
        'nobox'      : 'false'
    },
    {
        'category'   : 'world',
        'title'      : 'International TV',
        'icon'       : 'images/tabicon_2.png',
        'showFirst'  : 'false',
        'nobox'      : 'false'
    },
    { 
        'category'   : 'webAndLocal',
        'title'      : 'Web/Local TV',
        'icon'       : 'images/tabicon_3.png',
        'showFirst'  : 'false',
        'nobox'      : 'false'
    },
    
    // hardcoded tabs
    {
        'category'   : 'favorites',
        'title'      : 'Favorites',
        'icon'       : 'images/whiteHeart.png',
        'showFirst'  : 'false',
        'nobox'      : 'false'
    },
]

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ CHANNEL CONFIG
// hardcoded info about all of the channels on the site
// entries consist of:
/*
    '<channel ID>':{
        'id'            : 'channel_ID', 
        'thumbnail'     : 'thumbnail_URL',  // icons should be square
        'title'         : 'title',          // works best if less that 18 charecters (or less depending on how many categories there are)
        'category'      : 'category',       // corresponds to a tab on site
        'numVideos'     : 'int',            // currently not in use
    }
*/
var mChannelDict = { 

/* hasn't been updated for a month
"UC2tg0g4H9h9bDfvuyBGxeRA":{"id":"UC2tg0g4H9h9bDfvuyBGxeRA","thumbnail":"https://yt3.ggpht.com/-EaXKoD-b0b4/AAAAAAAAAAI/AAAAAAAAAAA/7IIw2ghBD9Q/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"CBSN","numVideos":0,"category":"national"},
*/

"UCBi2mrWuNuyYy4gbM6fU18Q":{"id":"UCBi2mrWuNuyYy4gbM6fU18Q","thumbnail":"https://yt3.ggpht.com/-vFNoLd1HnDs/AAAAAAAAAAI/AAAAAAAAAAA/Yt468AF7XKE/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"ABC News","numVideos":0,"category":"national"},
"UCe-4xQosMQGkIA8mT4sR98Q":{"id":"UCe-4xQosMQGkIA8mT4sR98Q","thumbnail":"https://yt3.ggpht.com/-95dxd0EZ64Y/AAAAAAAAAAI/AAAAAAAAAAA/A0OZ_XTZHRA/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"CNNMoney","numVideos":0,"category":"national"},
"UCaXkIU1QidjPwiAYu6GcHjg":{"id":"UCaXkIU1QidjPwiAYu6GcHjg","thumbnail":"https://yt3.ggpht.com/-5f8ygZcGHxI/AAAAAAAAAAI/AAAAAAAAAAA/S797Ah40wm0/s88-c-k-no-mo-rj-c0xffffff/photo.jpg",
"title":"MSNBC","numVideos":0,"category":"national"},
"UCXIJgqnII2ZOINSWNOGFThA":{"id":"UCXIJgqnII2ZOINSWNOGFThA","thumbnail":"https://yt3.ggpht.com/-hWfA4bcw9-0/AAAAAAAAAAI/AAAAAAAAAAA/vIRaFanM9JE/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"Fox News","numVideos":0,"category":"national"},
"UCupvZG-5ko_eiXAupbDfxWw":{"id":"UCupvZG-5ko_eiXAupbDfxWw","thumbnail":"https://yt3.ggpht.com/-K12xTWC-rMI/AAAAAAAAAAI/AAAAAAAAAAA/2N_u5pcKB3w/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"CNN","numVideos":0,"category":"national"},
"UCJg9wBPyKMNA5sRDnvzmkdg":{"id":"UCJg9wBPyKMNA5sRDnvzmkdg","thumbnail":"https://yt3.ggpht.com/-STtszAb1knw/AAAAAAAAAAI/AAAAAAAAAAA/nodDCfNmJl8/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"FOX 10 Phoenix","numVideos":0,"category":"webAndLocal"},
"UCw3SYO_euO0TSPC_m_0Pzgw":{"id":"UCw3SYO_euO0TSPC_m_0Pzgw","thumbnail":"https://yt3.ggpht.com/-nBdLJUc7XJU/AAAAAAAAAAI/AAAAAAAAAAA/YARlQCW54tU/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"Los Angeles Times","numVideos":0,"category":"webAndLocal"},
"UCF4LEacx9sDvAbEJnlaJfKQ":{"id":"UCF4LEacx9sDvAbEJnlaJfKQ","thumbnail":"https://yt3.ggpht.com/-3_jhfsJAf50/AAAAAAAAAAI/AAAAAAAAAAA/O17h4t7IE0g/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"CBS SF Bay Area","numVideos":0,"category":"webAndLocal"},
"UCx-h2AWPCBJEqzH9HXe2ZIA":{"id":"UCx-h2AWPCBJEqzH9HXe2ZIA","thumbnail":"https://yt3.ggpht.com/-wPTWpwxLqvA/AAAAAAAAAAI/AAAAAAAAAAA/keG-65fMiHE/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"New York Daily News","numVideos":0,"category":"webAndLocal"},
"UC16niRr50-MSBwiO3YDb3RA":{"id":"UC16niRr50-MSBwiO3YDb3RA","thumbnail":"https://yt3.ggpht.com/-Em-drWQ3uYI/AAAAAAAAAAI/AAAAAAAAAAA/b-RZ1gDQAIc/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"BBC News","numVideos":0,"category":"world"},
"UCruQg25yVBppUWjza8AlyZA":{"id":"UCruQg25yVBppUWjza8AlyZA","thumbnail":"https://yt3.ggpht.com/-98nilP77140/AAAAAAAAAAI/AAAAAAAAAAA/QRvgw4X62u4/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"FOX 4 News - Dallas-Fort Worth","numVideos":0,"category":"webAndLocal"},
"UCuFFtHWoLl5fauMMD5Ww2jA":{"id":"UCuFFtHWoLl5fauMMD5Ww2jA","thumbnail":"https://yt3.ggpht.com/-n940EoZOqrY/AAAAAAAAAAI/AAAAAAAAAAA/u-JfEk7b9f0/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"CBC News","numVideos":0,"category":"world"},
"UCME81PohuzT1JMCsEtvsD2w":{"id":"UCME81PohuzT1JMCsEtvsD2w","thumbnail":"https://yt3.ggpht.com/-TBaP1B4qW-4/AAAAAAAAAAI/AAAAAAAAAAA/4rUUuwGIIQc/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"ODN","numVideos":0,"category":"world"}, 
"UCvHDpsWKADrDia0c99X37vg":{"id":"UCvHDpsWKADrDia0c99X37vg","thumbnail":"https://yt3.ggpht.com/-IxByG1mOxc4/AAAAAAAAAAI/AAAAAAAAAAA/Aw5G7U4SWLg/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"i24News","numVideos":0,"category":"world"},
"UC83jt4dlz1Gjl58fzQrrKZg":{"id":"UC83jt4dlz1Gjl58fzQrrKZg","thumbnail":"https://yt3.ggpht.com/-wh5rGr3HSXs/AAAAAAAAAAI/AAAAAAAAAAA/5rTU6pVkmIY/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"Channel NewsAsia","numVideos":0,"category":"world"},
"UCQfwfsi5VrQ8yKZ-UWmAEFg":{"id":"UCQfwfsi5VrQ8yKZ-UWmAEFg","thumbnail":"https://yt3.ggpht.com/-Qc-MGBq90YE/AAAAAAAAAAI/AAAAAAAAAAA/AAmrwHX7No0/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"FRANCE 24 English","numVideos":0,"category":"world"},
"UCKjU3KzdbJE1EFcHVqXC3_g":{"id":"UCKjU3KzdbJE1EFcHVqXC3_g","thumbnail":"https://yt3.ggpht.com/-o-i9qCy13bg/AAAAAAAAAAI/AAAAAAAAAAA/ETwUD8voAlc/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"The National","numVideos":0,"category":"world"},
"UCNye-wNBqNL5ZzHSJj3l8Bg":{"id":"UCNye-wNBqNL5ZzHSJj3l8Bg","thumbnail":"https://yt3.ggpht.com/-8IFpTckNBOQ/AAAAAAAAAAI/AAAAAAAAAAA/D3as0FRtFfo/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"Al Jazeera English","numVideos":0,"category":"world"},
"UCaFxVc4xHOea6s5CO0eBxIA":{"id":"UCaFxVc4xHOea6s5CO0eBxIA","thumbnail":"https://yt3.ggpht.com/-DWJr_rRAA6o/AAAAAAAAAAI/AAAAAAAAAAA/vsp9sWlvdGs/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"PressTV News Videos","numVideos":0,"category":"world"},
"UCoMdktPbSTixAyNGwb-UYkQ":{"id":"UCoMdktPbSTixAyNGwb-UYkQ","thumbnail":"https://yt3.ggpht.com/-uYnyeu0wFpQ/AAAAAAAAAAI/AAAAAAAAAAA/VU2Ct3J_ZQw/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"Sky News","numVideos":0,"category":"world"},
"UC52X5wxOL_s5yw0dQk7NtgA":{"id":"UC52X5wxOL_s5yw0dQk7NtgA","thumbnail":"https://yt3.ggpht.com/-w68FQ_fAEwk/AAAAAAAAAAI/AAAAAAAAAAA/0O-NUcXQDOA/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"Associated Press","numVideos":0,"category":"webAndLocal"},
"UCYPvAwZP8pZhSMW8qs7cVCw":{"id":"UCYPvAwZP8pZhSMW8qs7cVCw","thumbnail":"https://yt3.ggpht.com/-_D48Q-O_Q48/AAAAAAAAAAI/AAAAAAAAAAA/r31m_qnzd7k/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"India Today","numVideos":0,"category":"world"},
"UCpwvZwUam-URkxB7g4USKpg":{"id":"UCpwvZwUam-URkxB7g4USKpg","thumbnail":"https://yt3.ggpht.com/-Kctadlnnczo/AAAAAAAAAAI/AAAAAAAAAAA/5NdDPcu1rz8/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"RT","numVideos":0,"category":"world"},
"UCmh7afBz-uWwOSSNTqUBAhg":{"id":"UCmh7afBz-uWwOSSNTqUBAhg","thumbnail":"https://yt3.ggpht.com/-c2zXomLlGY4/AAAAAAAAAAI/AAAAAAAAAAA/gLQ4FPftadY/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"Forbes","numVideos":0,"category":"webAndLocal"},
"UCcyq283he07B7_KUX07mmtA":{"id":"UCcyq283he07B7_KUX07mmtA","thumbnail":"https://yt3.ggpht.com/-BS-6L6eQrKc/AAAAAAAAAAI/AAAAAAAAAAA/WGtdiY1ovKI/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"Business Insider","numVideos":0,"category":"webAndLocal"},
"UCx6h-dWzJ5NpAlja1YsApdg":{"id":"UCx6h-dWzJ5NpAlja1YsApdg","thumbnail":"https://yt3.ggpht.com/-C6_CcI6hu8Y/AAAAAAAAAAI/AAAAAAAAAAA/nvfyTFSNXx8/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"NewsmaxTV","numVideos":0,"category":"webAndLocal"},
"UC8Su5vZCXWRag13H53zWVwA":{"id":"UC8Su5vZCXWRag13H53zWVwA","thumbnail":"https://yt3.ggpht.com/-oLiJOcmqT2o/AAAAAAAAAAI/AAAAAAAAAAA/xC0GTrsdlzA/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"TIME","numVideos":0,"category":"webAndLocal"},
"UCSrZ3UV4jOidv8ppoVuvW9Q":{"id":"UCSrZ3UV4jOidv8ppoVuvW9Q","thumbnail":"https://yt3.ggpht.com/-E6JZH-KyyCc/AAAAAAAAAAI/AAAAAAAAAAA/fqL-p-2Wk40/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"euronews (in English)","numVideos":0,"category":"webAndLocal"},
"UCPgLNge0xqQHWM5B5EFH9Cg":{"id":"UCPgLNge0xqQHWM5B5EFH9Cg","thumbnail":"https://yt3.ggpht.com/-vvAoHEJ_UFc/AAAAAAAAAAI/AAAAAAAAAAA/NwJK8x4rCHQ/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"The Telegraph","numVideos":0,"category":"webAndLocal"},
"UCZaT_X_mc0BI-djXOlfhqWQ":{"id":"UCZaT_X_mc0BI-djXOlfhqWQ","thumbnail":"https://yt3.ggpht.com/-C_54SDZRV_U/AAAAAAAAAAI/AAAAAAAAAAA/tATYqE6eIT0/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"VICE News","numVideos":0,"category":"webAndLocal"},
"UCP6HGa63sBC7-KHtkme-p-g":{"id":"UCP6HGa63sBC7-KHtkme-p-g","thumbnail":"https://yt3.ggpht.com/-ZaYfYmjUUjA/AAAAAAAAAAI/AAAAAAAAAAA/J96Cc39TbSo/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"USA TODAY","numVideos":0,"category":"webAndLocal"},
"UCUMZ7gohGI9HcU9VNsr2FJQ":{"id":"UCUMZ7gohGI9HcU9VNsr2FJQ","thumbnail":"https://yt3.ggpht.com/-VEB545Y1H1M/AAAAAAAAAAI/AAAAAAAAAAA/trwfqEkQLEU/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"Bloomberg","numVideos":0,"category":"webAndLocal"},
"UCHpw8xwDNhU9gdohEcJu4aA":{"id":"UCHpw8xwDNhU9gdohEcJu4aA","thumbnail":"https://yt3.ggpht.com/-cpvCMjZlwt8/AAAAAAAAAAI/AAAAAAAAAAA/3lX_J-zXDnA/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"The Guardian","numVideos":0,"category":"webAndLocal"},
"UCGTUbwceCMibvpbd2NaIP7A":{"id":"UCGTUbwceCMibvpbd2NaIP7A","thumbnail":"https://yt3.ggpht.com/-hmy3hsRv7T0/AAAAAAAAAAI/AAAAAAAAAAA/BJ3BYgt0ZGc/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"The Weather Channel","numVideos":0,"category":"webAndLocal"},
"UCoUxsWakJucWg46KW5RsvPw":{"id":"UCoUxsWakJucWg46KW5RsvPw","thumbnail":"https://yt3.ggpht.com/-UJckZEI25kQ/AAAAAAAAAAI/AAAAAAAAAAA/Z_qsEZyNzpQ/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"Financial Times","numVideos":0,"category":"webAndLocal"},

"UCHd62-u_v4DvJ8TCFtpi4GA":{"id":"UCHd62-u_v4DvJ8TCFtpi4GA","thumbnail":"https://yt3.ggpht.com/-bJlcViFalyA/AAAAAAAAAAI/AAAAAAAAAAA/tJhCwVFtgfA/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"Washington Post","numVideos":0,"category":"webAndLocal"}, // this channel is only getting 1 video for some reason (youtube problem?)

"UCK7tptUDHh-RYDsdxO1-5QQ":{"id":"UCK7tptUDHh-RYDsdxO1-5QQ","thumbnail":"https://yt3.ggpht.com/-sH3JAVQUyJw/AAAAAAAAAAI/AAAAAAAAAAA/8s1D-T2B0XI/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"Wall Street Journal","numVideos":0,"category":"webAndLocal"},
"UCqnbDFdCpuN8CMEg0VuEBqA":{"id":"UCqnbDFdCpuN8CMEg0VuEBqA","thumbnail":"https://yt3.ggpht.com/-AxnGfN8cSps/AAAAAAAAAAI/AAAAAAAAAAA/tz_SU-X0VOk/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"The New York Times","numVideos":0,"category":"webAndLocal"},
"UC8p1vwvWtl6T73JiExfWs1g":{"id":"UC8p1vwvWtl6T73JiExfWs1g","thumbnail":"https://yt3.ggpht.com/-NSs-ufs2ZJU/AAAAAAAAAAI/AAAAAAAAAAA/bb7gM6EYgns/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"CBS News","numVideos":0,"category":"national"},
"UCeY0bbntWzzVIaj2z3QigXg":{"id":"UCeY0bbntWzzVIaj2z3QigXg","thumbnail":"https://yt3.ggpht.com/-xiyVh-oNzJE/AAAAAAAAAAI/AAAAAAAAAAA/5FaR9rGW-F4/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"NBC News","numVideos":0,"category":"national"},
"UC1yBKRuGpC1tSM73A0ZjYjQ":{"id":"UC1yBKRuGpC1tSM73A0ZjYjQ","thumbnail":"https://yt3.ggpht.com/-8EmOV6Uyan8/AAAAAAAAAAI/AAAAAAAAAAA/lsr2usyFUO0/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"The Young Turks","numVideos":0,"category":"webAndLocal"},
"UCIVk1L1-JmpdiGuZcVjImtA":{"id":"UCIVk1L1-JmpdiGuZcVjImtA","thumbnail":"https://yt3.ggpht.com/-jmCMFFjVMJU/AAAAAAAAAAI/AAAAAAAAAAA/Nq38S9RndjE/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"ABC15 Arizona","numVideos":0,"category":"webAndLocal"},
"UCYxRlFDqcWM4y7FfpiAN3KQ":{"id":"UCYxRlFDqcWM4y7FfpiAN3KQ","thumbnail":"https://yt3.ggpht.com/-E1SyZ9q7Z9E/AAAAAAAAAAI/AAAAAAAAAAA/iAkRlx2F-E0/s88-c-k-no-rj-c0xffffff/photo.jpg",
"title":"The White House","numVideos":0,"category":"webAndLocal"},
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ PLAYLIST CONFIG
// hardcoded info about addional playlists to get videos from
// in ReleTV_core.js, only videos from channels in mChannelDict will be added
var mPlaylistDict = {
    'PL3ZQ5CpNulQmA2Tegc98c0XXJTzuKb0wS':{
        'id' : 'PL3ZQ5CpNulQmA2Tegc98c0XXJTzuKb0wS',
        'title' : 'LIVE',
    },
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ HARDCODED VIDEO CONFIG
// hardcoded video config
// get these videos no matter what
// use in ex: TvMosaic in order to get live video streams that will not always show up in the channel's feeds
// these videos will be loaded in addition to whatever videos are got through the YT feeds from promiseToGetLIVEVideos()
// entries consist of:
/*
    {
        'chid'          : 'channel_ID',
        'description'   : 'description',
        'thumbnail'     : 'thumbnail_URL',
        'title'         : 'title',
        'videoId'       : 'video_ID',
        'updated'      : { ago : '', olderThanHour : '', published : ''},      
        'viewcount'     : 'viewcount',      // currently not in use
        'category'      : 'category'        // currently not in use
    }
*/
var hardcodedVideosList = [ 
    {
        'chid': 'UCvHDpsWKADrDia0c99X37vg',
        'description': 'i24news is an international 24-hour news and current affairs television channel based in Jaffa Port.',
        'thumbnail' : 'https://i.ytimg.com/vi_webp/Msgo-R3zZuM/hqdefault_live.webp',
        'title': 'i24News Live',
        'videoId': 'Msgo-R3zZuM',
        'updated' : { ago : 'LIVE', olderThanHour : false, published : '2016-07-21T05:06:40+00:00'}, // random time, it doesn't really matter for live vids     
        'viewcount': '',
        'category': ''
    },
    {
        'chid': 'UCQfwfsi5VrQ8yKZ-UWmAEFg',
        'description': 'Watch FRANCE 24 live in English on YouTube for free',
        'thumbnail' : 'https://i.ytimg.com/vi_webp/gq11un3xqsA/hqdefault_live.webp',
        'title': 'FRANCE 24 live news stream: all the latest news 24/7',
        'videoId': 'gq11un3xqsA',
        'updated' : { ago : 'LIVE', olderThanHour : false, published : '2016-07-21T05:06:40+00:00'}, // random time, it doesn't really matter for live vids     
        'viewcount': '',
        'category': ''
    },
    {
        'chid': 'UCYPvAwZP8pZhSMW8qs7cVCw',
        'description': 'India Today Television marks the entry of the nationâ€™s most credible name in journalism - India Today into news television.',
        'thumbnail' : 'https://i.ytimg.com/vi/oMncjfIE-ZU/mqdefault_live.jpg',
        'title': 'India Today Live Tv',
        'videoId': 'oMncjfIE-ZU',
        'updated' : { ago : 'LIVE', olderThanHour : false, published : '2016-07-21T05:06:40+00:00'}, // random time, it doesn't really matter for live vids     
        'viewcount': '',
        'category': '' 
    },
    {
        'chid': 'UCoMdktPbSTixAyNGwb-UYkQ',
        'description': 'Sky News Live',
        'thumbnail' : 'https://i.ytimg.com/vi_webp/y60wDzZt8yg/hqdefault_live.webp',
        'title': 'Sky News Live',
        'videoId': 'y60wDzZt8yg',
        'updated' : { ago : 'LIVE', olderThanHour : false, published : '2016-07-21T05:06:40+00:00'}, // random time, it doesn't really matter for live vids     
        'viewcount': '',
        'category': ''
    },
    /* went offline !
    {
        'chid': 'UCUMZ7gohGI9HcU9VNsr2FJQ',
        'description': 'Bloomberg TV brings you coverage on the biggest global news stories and in-depth analysis of the market reaction to them. C-suite executives and our in-house experts tell you what you need to know about topics like Brexit, the latest economic data, market moves, U.S. and international politics (and more.)',
        'thumbnail' : 'https://i.ytimg.com/vi/tf5PTcLuXN4/hqdefault_live.jpg',
        'title': 'LIVE on Bloomberg TV',
        'videoId': 'tf5PTcLuXN4',
        'updated' : { ago : 'LIVE', olderThanHour : false, published : '2016-07-21T05:06:40+00:00'}, // random time, it doesn't really matter for live vids     
        'viewcount': '',
        'category': ''
    },
    */
    {
        'chid': 'UCx6h-dWzJ5NpAlja1YsApdg',
        'description': 'Live news streaming from Newsmax TV, available nationwide on DirectTV 349 and Verizon FiOS 115.',
        'thumbnail' : 'https://i.ytimg.com/vi/UYKNKzT77Q4/mqdefault_live.jpg',
        'title': 'Newsmax TV Live News Stream',
        'videoId': 'UYKNKzT77Q4',
        'updated' : { ago : 'LIVE', olderThanHour : false, published : '2016-07-21T05:06:40+00:00'}, // random time, it doesn't really matter for live vids     
        'viewcount': '',
        'category': ''
    },
];