module.exports = {
    name: 'restart',
    description: 'Restarts Bottimus',
    execute(message, args) {
        var user = message.member;
        if(user.roles.has('309952512331612160') || user.roles.has('309956347309326336')) {
            message.channel.send('Goodbye!');
            setTimeout(function() { process.exit(1) }, 1000);
        } else {
            message.reply('You need to be an Administrator to use this.');
        }
    },
};