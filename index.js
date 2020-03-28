const Discord = require('discord.js')
const SQLite = require('better-sqlite3');
const paquito = new Discord.Client()
const sql = new SQLite('./database.sqlite');

paquito.login('mdrtacru')

paquito.on('ready', () => {
    console.log(`Online: ${paquito.user.tag}!`)

    const usersTable = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'users';").get()
    if (!usersTable['count(*)']) {
        sql.prepare("CREATE TABLE users (discord_id TEXT, points INTEGER);").run()
        sql.prepare("CREATE UNIQUE INDEX idx_sponsored_id ON users (discord_id);").run()
    }

    const chans = [
        '693203476171325502',
        '693249353758015588'
    ]

    const eggs = [
        'https://www.emauxdelongwy.com/pub/categories/e-shop/modeles/objets_decoratifs/oeufs/taille_2/oeuf_t2_paques_2018_2.jpeg',
        'https://grainedeviking.fr/uploads/img/activites/22f6adbeea5d90aeb2b54c1f5c74501072285f6c.jpeg',
        'https://nlcdeco.fr/file/2019/05/oeuf-de-p%C3%A2ques-nlcdeco-d%C3%A9coration-en-r%C3%A9sine-printemps-f%C3%AAtes-chocolat-enfants-jardin.jpg'
    ]

    const randomly = arr => {
        return Math.floor(Math.random() * Math.floor(arr.length))
    }

    setInterval(function () {
        paquito.channels.fetch(chans[randomly(chans)])
            .then(channel => {
                channel.send(eggs[randomly(eggs)])
                    .then(message => {
                        message.react('✅')

                        const filter = (reaction, user) => reaction.emoji.name === '✅' && user.id !== '692892645625692230'

                        message.awaitReactions(filter, { maxUsers: 1, time: 10000, errors: ['time'] })
                            .then(collected => {
                                const reactions_users_id = [...collected.first().users.cache.keys()]

                                const check_if_user_exists = sql.prepare('SELECT * FROM users WHERE discord_id = ' + reactions_users_id[1] + '').get()

                                if (check_if_user_exists === null) {
                                    sql.prepare('INSERT INTO users (discord_id, points) VALUES(' + reactions_users_id[1] + ', 1)').run()
                                } else {
                                    const new_points = (check_if_user_exists.points + 1)
                                    sql.prepare('UPDATE users SET points = ' + new_points + ' WHERE discord_id = ' + reactions_users_id[1] + '').run()
                                }
                                message.delete()
                                message.channel.send(`Le point à été ajouté avec succès à <@${reactions_users_id[1]}>`)

                            }).catch(err => console.log(err))
                    })
            }).catch(err => console.log(err))
    }, 5000)
})

paquito.on('message', (message) => {
    if (message.content === 'p!classement') {
        const getTop15 = sql.prepare('SELECT * FROM users ORDER BY points DESC LIMIT 15').all()

        let top15 = ''
        let counter = 1

        for (const data of getTop15) {

            top15 = top15 + `${counter} - <@${data.discord_id}> - ${data.points} \n`
            counter = counter + 1
        }
        message.channel.send(top15)
    }
})
