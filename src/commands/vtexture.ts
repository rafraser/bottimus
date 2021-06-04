import { Message, MessageEmbed, MessageAttachment } from 'discord.js'
import { Client } from '../command'
import { sendTabbedEmbed } from '../pagination'

function helpEmbed () {
  return new MessageEmbed()
    .setColor('#f0932b')
    .setTitle('Texture Colorizer')
    .setDescription(`
Welcome to the Beta Texture Colorizing Machine! Just tell me a texture pack and a color palette, and I'll spit out a cool set of textures for you!

For example, to generate a set of dev textures using the *flatui* color palette:
\`!vtexture dev flatui\`

Check the other tabs for more information:
    `)
    .addField('🟪', 'View list of texture packs')
    .addField('🎨', 'View list of color palettes')
}

function textureEmbed () {
  return new MessageEmbed()
    .setColor('#f0932b')
    .setTitle('Texture Packs')
    .setDescription('You can choose from any of these listed texture packs!')
    .addField('dev', 'Two simple dev textures (currently only one lol)')
    .addField('cross', 'Animal Crossing inspired patterns. Not yet implemented!')
}

function paletteEmbed () {
  return new MessageEmbed()
    .setColor('#f0932b')
    .setTitle('Color Palettes')
    .setDescription(`
You can use any palette from the [Lospec Palette List](https://lospec.com/palette-list)

Additionally, the following palettes have named colors:
- flatui
- horizon

To preview a palette:
\`!paletteview flatui\`
    `)
}

export default {
  name: 'vtexture',
  description: 'Beta!',
  aliases: ['texturepack', 'vcolorize', 'colortex'],
  cooldown: 120,

  async execute (client: Client, message: Message, args: string[]) {
    const embedPages = {
      ℹ️: helpEmbed(),
      '🟪': textureEmbed(),
      '🎨': paletteEmbed()
    }

    if (args.length === 2) {
      await message.channel.send('Processing textures...')

      try {
        const result = await client.executePython('vtexture', args, true)
        message.channel.send(new MessageAttachment(result))
      } catch (error) {
        await message.channel.send(`Something went wrong: ${error}`)
      }
    } else {
      await sendTabbedEmbed(message, embedPages)
    }
  }
}
