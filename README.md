# Bottimus
## Why?
Bottimus was created to add a few minor features to the Fluffy Servers community discord. Bottimus mostly has a couple of useful commands customised for Fluffy Servers and a few additional fun commands.

## .env
A lot of functionality of Bottimus is based on getting information from other sources. To this effect, API keys and other information is placed in a .env file.
```javascript
DB_HOST=[Server DB IP]
DB_USER=[Server DB User]
DB_PASSWORD=[Server DB Password]
DISCORD=[Discord Bot key (very important)]
IMGUR=[Imgur API key]
```

## Notable Commands
+ 8ball
  + Ask the magic 8ball a question... if you dare
+ gallery
  + Fetches a bunch of images and updates the web-based Art Gallery accordingly
+ role
  + Self-assign roles for access to channels/announcements as requested
+ status
  + Get player & map information about the Garry's Mod server
+ stats
  + Fetches player statistics from the Garry's Mod server
+ trivia
  + Play a game of Trivia, uses OpenTriviaDB

## Commands & Scanners
Bottimus is designed to be as modular as possible. To enable this, functionality is split into Commands and Scanners modules.
#### Commands
Commands are triggered manually by users, by typing the given command followed by a prefix (ex. !status). These are what the majority of functionality is implemented as.
#### Scanners
Scanners are functions that are applied to every message that is sent. This can be used for functionality such as doing certain things to a given users message; or applying things with a random chance to every message.
