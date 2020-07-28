import { Client, Message, Command } from "../command"
import { MessageEmbed } from "discord.js"
import fetch from "node-fetch"

export default {
  name: "catfact",
  description: "Get a random cat fact",
  cooldown: 10,

  async execute(client: Client, message: Message, args: string[]) {
    const data = await fetch("https://catfact.ninja/fact")
    const json = await data.json()
    const fact = json.fact

    const embed = new MessageEmbed()
      .setColor('#9c88ff')
      .setDescription(fact)
    message.channel.send(embed)

    client.updateCooldown(this, message.member.id)
  }
}