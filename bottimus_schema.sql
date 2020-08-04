CREATE TABLE IF NOT EXISTS `arcade_currency` (
  `userid` varchar(32) NOT NULL,
  `amount` int(11) DEFAULT NULL,
  PRIMARY KEY (`userid`)
);

CREATE TABLE IF NOT EXISTS `arcade_dailyspin` (
  `discordid` varchar(64) NOT NULL,
  `lastspin` datetime DEFAULT NULL,
  `number` int(11) DEFAULT NULL,
  PRIMARY KEY (`discordid`)
);

CREATE TABLE IF NOT EXISTS `arcade_hangman` (
  `discordid` varchar(64) NOT NULL,
  `guesses` int(11) DEFAULT NULL,
  `correct` int(11) DEFAULT NULL,
  `revealed` int(11) DEFAULT NULL,
  `words` int(11) DEFAULT NULL,
  `contribution` float DEFAULT NULL,
  PRIMARY KEY (`discordid`)
);

CREATE TABLE IF NOT EXISTS `arcade_mining` (
  `discordid` varchar(64) NOT NULL,
  `number` int(11) DEFAULT NULL,
  `diamonds` int(11) DEFAULT NULL,
  PRIMARY KEY (`discordid`)
);

CREATE TABLE IF NOT EXISTS `arcade_pachinko` (
  `discordid` varchar(64) NOT NULL,
  `attempts` int(11) DEFAULT NULL,
  `wins` int(11) DEFAULT NULL,
  PRIMARY KEY (`discordid`)
);

CREATE TABLE IF NOT EXISTS `arcade_prizes` (
  `discordid` varchar(64) NOT NULL,
  `prize` varchar(64) NOT NULL,
  `amount` int(11) DEFAULT NULL,
  PRIMARY KEY (`discordid`,`prize`)
);

CREATE TABLE IF NOT EXISTS `arcade_roulette` (
  `discordid` varchar(64) NOT NULL,
  `number` int(11) DEFAULT NULL,
  `winnings` int(11) DEFAULT NULL,
  `bet_total` int(11) DEFAULT NULL,
  PRIMARY KEY (`discordid`)
);

CREATE TABLE IF NOT EXISTS `arcade_scratchcard` (
  `discordid` varchar(64) NOT NULL,
  `number` int(11) DEFAULT NULL,
  `winnings` int(11) DEFAULT NULL,
  PRIMARY KEY (`discordid`)
);

CREATE TABLE IF NOT EXISTS `arcade_switchcode` (
  `discordid` varchar(64) NOT NULL,
  `guild` varchar(64) NOT NULL,
  `code` varchar(64) NOT NULL,
  PRIMARY KEY (`discordid`,`guild`)
);

CREATE TABLE IF NOT EXISTS `arcade_trivia` (
  `discordid` varchar(64) NOT NULL,
  `category` varchar(64) NOT NULL,
  `attempted` int(10) unsigned NOT NULL,
  `correct` int(10) unsigned NOT NULL,
  PRIMARY KEY (`discordid`,`category`)
);

CREATE TABLE IF NOT EXISTS `arcade_typeracer` (
  `discordid` varchar(64) NOT NULL,
  `completed` int(11) DEFAULT NULL,
  `speed_average` float DEFAULT NULL,
  `speed_best` int(11) DEFAULT '0',
  `date_best` date DEFAULT NULL,
  PRIMARY KEY (`discordid`)
);

CREATE TABLE IF NOT EXISTS `arcade_typeracer_copy` (
  `discordid` varchar(64) NOT NULL,
  `completed` int(11) DEFAULT NULL,
  `speed_average` int(11) DEFAULT NULL,
  `speed_best` int(11) DEFAULT '0',
  `date_best` date DEFAULT NULL,
  PRIMARY KEY (`discordid`)
);

CREATE TABLE IF NOT EXISTS `bottimus_userdata` (
  `discordid` varchar(64) NOT NULL,
  `username` varchar(64) NOT NULL,
  `tag` varchar(64) NOT NULL,
  `avatar` varchar(1024) NOT NULL,
  PRIMARY KEY (`discordid`)
);

CREATE TABLE IF NOT EXISTS `event_history` (
  `time` datetime NOT NULL,
  `title` varchar(50) DEFAULT NULL,
  `type` varchar(30) DEFAULT NULL,
  `subscribers` int(11) DEFAULT NULL,
  PRIMARY KEY (`time`)
);

CREATE TABLE IF NOT EXISTS `ticket_data` (
  `guild` varchar(64) NOT NULL,
  `member` varchar(64) NOT NULL,
  `channel` varchar(64) NOT NULL,
  `expiry` datetime NOT NULL,
  `active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`guild`, `member`, `expiry`)
);

CREATE TABLE IF NOT EXISTS `mute_data` (
  `guild` varchar(64) NOT NULL,
  `member` varchar(64) NOT NULL,
  `channel` varchar(64) NOT NULL,
  `expiry` datetime NOT NULL,
  `roles` text,
  `active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`guild`, `member`, `expiry`)
);
