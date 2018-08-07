# pinteresttopaprika

## Overview

The script works as an adapter en Pinterest and parika 3 recipe manager. It requires some setup but will emulate the action of using the paprika 3 bookmarklet on an entire pinterest board.

The script uses the url for a public pinterest board to call the Pinterest API to gather all te links found in the board. The links are then opened inside a headless chrome instance using 'puppeteer'. For each link the paprika bookmarklet is used. If any link fails they are retried once after the who initial list has been run through. At the end any failures are printed.

On first run the bookmarklet will create an config.toml file if one doesn't already exist in the directory. After this has been filled with the correct infromation, the application will run and if you don't have a 'cookies.txt', the script will login to Pinterest and save the cookies in a new 'cookies.txt' file in the current directory. In future login to Pinterest in not required.

## Below is what your config.toml should look like with, 'XXX's should be replaced with apropriate codes

````toml
[Pinterest]
PinterestUser = "your login name"
PinterestPassword = "passoword"
[Paprika]
PaprikaBookmarkletToken = "XXXXXXXXXXXXXXXX"
PaprikaUser = "your login name"
PaprikaPassword = "password"
[Dev]
PinterestAppID = "XXXXXXXXXXXXXXXXXXX"
PinterestAppSecret = "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
PinterestToken = "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

````

## Instructions for codes

- PaprikaBookmarkletToken can be retrived from "https://www.paprikaapp.com/bookmarklet/"
  - once logged in go copy from the "iPhone/iPad Installation" code the code preceded by '//www.paprikaapp.com/bookmarklet/v1/?token='.
  - the token looks something like this "787659f80afba450"
- PinterestAppID, PinterestAppSecret, PinterestToken (OAUTH access token) can be created by following instructions from here "https://developers.pinterest.com/docs/api/overview/?"
  - To use a GUI to get the access token, consider scrolling down to the section "Using Postman to get an auth token"

## Know problems

- Currently there 'cookies.txt' will be assumed to have active pinterest credentials, if there are any issues with all links grabbed from board failing and 404'ing then this is likely due to wrong or outdated cookies. Please delete the file.
- Opening each page in a chromium instance may not be the most efficient way of adding links to paprika. Will look into it.
- Some failed links may actually be possible to manually add to paprika with the bookrmarklet, but failed due to the script not accepting possible gdpr prompts
  - Further note, due try to add the links manually using the apps own interface.
