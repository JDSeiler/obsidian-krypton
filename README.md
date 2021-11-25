# Krypton
## Disclaimer
This software is provided 'as-is', without any express or implied
warranty. In no event will the authors be held liable for any damages
arising from the use of this software.

**Bottom Line:** Usage of this plugin can result in losing the contents of your notes **forever**! Use it at
your own risk! I made this plugin just for fun and for personal use. But because of the potential
risks of using it I decided **not** to publish it. I am not currently in a position to actively maintain
the plugin and test it enough such that I'd be comfortable letting it loose to the community.

## About this plugin
Krypton is a plugin for encrypting the contents of individual notes using a password.
It exposes 4 commands:
1. Initial Setup :: For setting up encryption keys / a password for the first time.
2. Change Password :: For changing your password **and** replacing your encryption keys.
3. Encrypt File :: Encrypts the contents of the file. Replacing the text with the hex digest
   of the encrypted binary.
4. Decrypt File :: Decrypts an encrypted file.

Krypton also exposes one setting: Whether or not to encrypt note front-matter.
By default Krypton will encrypt front-matter, but you may want to turn this off
if you want your tags and other metadata to remain intact for encrypted files.

## Development
This plugin is developed just like any other Obsidian plugin. See the [Obsidian Sample Plugin](https://github.com/obsidianmd/obsidian-sample-plugin)
on GitHub for full details. However, here are some quick getting started instructions:
1. Create a separate Obsidian vault for testing.
2. Clone this repo into the `.obsidian/plugins` folder of the testing vault.
3. Run `npm install` or `yarn install` to install dependencies.
4. Run `npm run dev` to bundle the plugin and start rollup in watch mode.
5. Open Obsidian and select the testing vault.

Now you're ready to make changes to the plugin and test them in Obsidian.

See also: https://github.com/obsidianmd/obsidian-api for Obsidian API documentation.

## Questions? Want to make a contribution?
Feel free to open an Issue or Pull Request. While I don't have plans to actively
maintain this plugin personally, I'm happy to work with folks who have an interest
in the plugin.
