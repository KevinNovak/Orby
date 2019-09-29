const Discord = require('discord.js');
const _commandService = require('./services/command-service');
const _config = require('./config/config.json');
const _lang = require('./config/lang.json');

const _client = new Discord.Client();

let _acceptMessages = false;

_client.on('ready', () => {
    _acceptMessages = true;

    _client.user.setPresence({
        game: {
            name: _lang.msg.presence,
            type: 'PLAYING'
        }
    });
});

function canReply(msg) {
    return msg.guild
        ? msg.channel.permissionsFor(msg.guild.me).has('SEND_MESSAGES')
        : true;
}

_client.on('message', msg => {
    if (!_acceptMessages || msg.author.bot || !canReply(msg)) {
        return;
    }

    let args = msg.content.split(' ');
    if (!_lang.cmd.prefix.includes(args[0].toLowerCase())) {
        return;
    }

    if (args.length > 1) {
        let cmd = args[1].toLowerCase();
        if (_lang.cmd.help.includes(cmd)) {
            _commandService.processHelp(msg);
            return;
        }

        if (_lang.cmd.set.includes(cmd)) {
            _commandService.processSet(msg, args);
            return;
        }

        if (_lang.cmd.top.includes(cmd)) {
            _commandService.processTop(msg);
            return;
        }
    }

    _commandService.processHelp(msg);
});

_client.on('error', error => {
    console.error(error);
});

_client.login(_config.token).catch(error => {
    console.error(error);
});