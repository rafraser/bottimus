import { MessagePayload, Message, MessageOptions, SnowflakeUtil } from 'discord.js'
import { Command } from '../src/command'
import BottimusClient from '../src/client'

export class MockClient implements Partial<BottimusClient> {
  public cooldowns: Map<string, Map<string, number>> = new Map()

  public static create () {
    return new MockClient() as unknown as BottimusClient
  }

  public updateCooldown (command: Command, user: string) {
    if (!command.cooldown) return
    if (!this.cooldowns.get(command.name)) {
      this.cooldowns.set(command.name, new Map())
    }

    this.cooldowns.get(command.name).set(user, Date.now())
  }
}

export class MockMember {
  public id: string;

  constructor () {
    this.id = SnowflakeUtil.generate()
  }
}

export class MockChannel {
  public messages : (string | MessagePayload | MessageOptions)[] = []

  public send (options: string | MessagePayload | MessageOptions) {
    this.messages.push(options)
  }

  public getMessages () {
    return this.messages
  }
}

export class MockMessage {
  public channel: MockChannel
  public member: MockMember

  public static create () {
    return new MockMessage() as unknown as Message
  }

  constructor () {
    this.channel = new MockChannel()
    this.member = new MockMember()
  }
}
