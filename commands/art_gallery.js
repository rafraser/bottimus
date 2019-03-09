const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const folder = '../public/img/art'

// Save an image
function download(url, dest, cb) {
    var file = fs.createWriteStream(dest);
    var protocol = url.slice(0, 5);
    var func;
    if (protocol == 'https') {
        func = https;
    } else if (protocol == 'http') {
        func = http;
    }
    
    var request = func.get(url, function(response) {
        response.pipe(file);
        file.on('finish', function() {
            file.close(cb);
        });
    }).on('error', function(e) {
        // eh
        console.log(e);
    });
}

function messageCallback(messages) {
	sum = sum + 100
	if(sum < 500) {
		channel.fetchMessages({limit: 100, before: messages.last().id}, messageCallback)
	}
}

module.exports = {
    name: 'gallery',
    description: 'Update the art gallery for this channel',
    execute(message, args) {
        var channel = message.channel;
        var count = 0;
        var queue = [];
        var results = [];
        channel.send('Starting scan...')
		
		// Scan the latest 100 messages
		var sum = 0
		var messages_total = []
		
		
		
        channel.fetchMessages({limit: 100}).then(function(messages) {
			sum = sum + 100
			if(sum < 500) {
				channel.fetchMessages({limit
			}
		}
            messages.forEach(function(message) {
				// Find and queue any attachments that are .png or .jpg images
                message.attachments.forEach(function(attachment, snowflake) {
                    if (attachment.filesize > 1000000) return;
                    var name = attachment.filename
                    if (!name.endsWith('.png') && !name.endsWith('.jpg')) return;
                    
                    if (queue.indexOf(attachment.url) <= -1) {
                        queue.push(attachment.url);
                        count++;
                    }
                });
                
				// Find and queue any embeds that are .png or .jpg images
                message.embeds.forEach(function(embed, snowflake) {
                    if (embed.image) {
                        var name = embed.image.url;
                        if (!name.endsWith('.png') && !name.endsWith('.jpg')) return;
                        
                        if (queue.indexOf(name) <= -1) {
                            queue.push(name);
                            count++;
                        }
                    }
                });
            });
			console.log(messages.last().id)
            
			// Prepare to download any images in the queue
            channel.send('I found ' + count + ' images for the gallery.');
            if (count < 1) return;
            if (!channel.id) return;
            var dir = folder + '/' + channel.id
            
            // Prepare the directory
            if (fs.existsSync(dir)) {
				// Empty the directory if it already exists
                console.log('Folder exists already');
                var files = fs.readdirSync(dir)
                for (var file of files) {
                    fs.unlink(path.join(dir, file))
                }
            } else {
				// Create a directory if it doesn't exist yet
                fs.mkdirSync(dir);
            }
            
            // Download all the images
            for (var i=0; i<queue.length; i++) {
                download(queue[i], dir + '/' + i + queue[i].slice(-4));
                results.push(i + queue[i].slice(-4));
            }
            
            // Create and save a .json containing server information
            var info = {guild: channel.guild.name, channel: channel.name, images: results};
            var json = JSON.stringify(info);
            fs.writeFile(dir + '/' + 'info.json', json, function(e) {
                if (e) return;
                console.log('Saved JSON!');
                channel.send('https://fluffyservers.com/gallery.html?id=' + channel.id);
            });
        });
    },
};