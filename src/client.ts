import { Client, ClientOptions } from "discord.js"

export default class BottimusClient extends Client {
    public static prefixes = ['!', 'Bottimus, ']

    public readonly testingMode: boolean

    public constructor(options: ClientOptions, testing: boolean) {
        super(options)
        this.testingMode = testing
    }
}