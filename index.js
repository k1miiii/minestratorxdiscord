const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, REST, Routes } = require('discord.js');
const fetch = require('node-fetch').default;

// Configuration
const config = {
  discordToken: '', // Token du bot Discord
  discordClientId: '', // ID du client du bot
  discordGuildId: '', // ID du serveur Discord
  roleFounderId: '', // ID du rôle fondateur/owner
  apiToken: '', // Token API MineStrator
  hashsupport: '' // Code 'support' du serveur par défaut
};

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// Define slash commands for MineStrator API actions
const commands = [
  new SlashCommandBuilder()
    .setName('list-servers')
    .setDescription('Liste tous les serveurs MineStrator (fondateurs uniquement)'),
  new SlashCommandBuilder()
    .setName('server-ressources')
    .setDescription('Récupère la consommation de ressources d’un serveur MineStrator (fondateurs uniquement)')
    .addStringOption(opt =>
      opt.setName('hashsupport')
        .setDescription('Code support du serveur (ex: EF85L)')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('start')
    .setDescription('Démarre le serveur MineStrator (fondateurs uniquement)')
    .addStringOption(opt =>
      opt.setName('hashsupport')
        .setDescription('Code support du serveur (ex: EF85L, défaut: config)')
        .setRequired(false)),
  new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Arrête le serveur MineStrator (fondateurs uniquement)')
    .addStringOption(opt =>
      opt.setName('hashsupport')
        .setDescription('Code support du serveur (ex: EF85L, défaut: config)')
        .setRequired(false)),
  new SlashCommandBuilder()
    .setName('restart')
    .setDescription('Redémarre le serveur MineStrator (fondateurs uniquement)')
    .addStringOption(opt =>
      opt.setName('hashsupport')
        .setDescription('Code support du serveur (ex: EF85L, défaut: config)')
        .setRequired(false)),
  new SlashCommandBuilder()
    .setName('kill')
    .setDescription('Termine immédiatement le serveur MineStrator (fondateurs uniquement)')
    .addStringOption(opt =>
      opt.setName('hashsupport')
        .setDescription('Code support du serveur (ex: EF85L, défaut: config)')
        .setRequired(false))
];

// Initialize REST client for command registration
const rest = new REST({ version: '10' }).setToken(config.discordToken);

// Register commands
(async () => {
  try {
    console.log('🔄 Enregistrement des commandes slash...');
    await rest.put(
      Routes.applicationGuildCommands(config.discordClientId, config.discordGuildId),
      { body: commands.map(cmd => cmd.toJSON()) }
    );
    console.log('✅ Commandes enregistrées : list-servers, server-ressources, start, stop, restart, kill.');
  } catch (error) {
    console.error('[SLASH_COMMANDS] Erreur lors de l\'enregistrement:', error);
  }
})();

// MineStrator API function for actions (POST)
async function sendMineStratorAction(action, hashsupport) {
  try {
    const params = new URLSearchParams();
    params.append('hashsupport', hashsupport);
    params.append('action', action);

    const response = await fetch('https://rest.minestrator.com/api/v1/server/action', {
      method: 'POST',
      headers: {
        'Authorization': config.apiToken
      },
      body: params
    });

    if (response.ok) {
      console.log(`[MINESTRATOR_API] Commande ${action} envoyée avec succès pour ${hashsupport}.`);
      return true;
    } else {
      console.error(`[MINESTRATOR_API] Erreur lors de l'envoi de la commande ${action} pour ${hashsupport}:`, response.statusText);
      return false;
    }
  } catch (error) {
    console.error(`[MINESTRATOR_API] Erreur pour ${action} (${hashsupport}):`, error);
    return false;
  }
}

// MineStrator API function for GET requests
async function fetchMineStratorData(endpoint, hashsupport = '') {
  try {
    const url = hashsupport
      ? `https://rest.minestrator.com/api/v1/server/${endpoint}/${hashsupport}`
      : `https://rest.minestrator.com/api/v1/server/${endpoint}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': config.apiToken
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`[MINESTRATOR_API] Données récupérées pour ${endpoint}${hashsupport ? `/${hashsupport}` : ''}:`, JSON.stringify(data, null, 2));
      return data.data;
    } else {
      console.error(`[MINESTRATOR_API] Erreur lors de la récupération des données pour ${endpoint}${hashsupport ? `/${hashsupport}` : ''}:`, response.statusText);
      return null;
    }
  } catch (error) {
    console.error(`[MINESTRATOR_API] Erreur pour ${endpoint}${hashsupport ? `/${hashsupport}` : ''}:`, error);
    return null;
  }
}

// Format server data for embeds
function formatServerData(data, type) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return '❌ Aucune donnée disponible.';
  }

  if (type === 'list-servers') {
    return data.map(server => 
      `**${server.hashsupport}** (${server.offer || 'Inconnu'})\n` +
      `- IP: ${server.ip}:${server.port}\n` +
      `- DNS: ${server.dns || 'N/A'}\n` +
      `- Début: ${server.tstart ? new Date(server.tstart).toLocaleDateString('fr-FR') : 'N/A'}\n` +
      `- Fin: ${server.tend ? new Date(server.tend).toLocaleDateString('fr-FR') : 'N/A'}`
    ).join('\n\n');
  }

  if (type === 'server-ressources') {
    const server = data[0];
    return (
      `**${server.hashsupport}** (${server.offer || 'Inconnu'})\n` +
      `- IP: ${server.ip}:${server.port}\n` +
      `- Statut: ${server.status === 'on' ? 'En ligne' : 'Hors ligne'}\n` +
      `- CPU: ${server.cpu?.live || 'N/A'}% / ${server.cpu?.max || 'N/A'}%\n` +
      `- RAM: ${server.memory?.live || 'N/A'} MB / ${server.memory?.max || 'N/A'} MB\n` +
      `- Disque: ${server.disk?.live || 'N/A'} MB / ${server.disk?.max || 'N/A'} MB`
    );
  }

  return '❌ Type de données inconnu.';
}

// Handle slash commands
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    const guild = await client.guilds.fetch(config.discordGuildId);
    const member = await guild.members.fetch(interaction.user.id);

    // Check if user has founder role
    if (!member.roles.cache.has(config.roleFounderId)) {
      return interaction.reply({
        content: '⛔ Seuls les fondateurs peuvent utiliser cette commande.',
        flags: 64
      });
    }

    const commandName = interaction.commandName;
    let actionText, data;

    if (['start', 'stop', 'restart', 'kill'].includes(commandName)) {
      // Handle action commands
      actionText = {
        start: 'Démarrage',
        stop: 'Arrêt',
        restart: 'Redémarrage',
        kill: 'Termination'
      }[commandName];

      const hashsupport = interaction.options.getString('hashsupport') || config.hashsupport;

      await interaction.reply({
        embeds: [new EmbedBuilder()
          .setTitle(`${actionText} du Serveur`)
          .setDescription(`🚀 Envoi de la commande ${commandName} au serveur MineStrator (${hashsupport})...`)
          .setColor('#FFA500')
          .setTimestamp()],
        flags: 64
      });

      const success = await sendMineStratorAction(commandName, hashsupport);

      await interaction.editReply({
        embeds: [new EmbedBuilder()
          .setTitle(success ? `${actionText} Réussi` : `Échec du ${actionText}`)
          .setDescription(success
            ? `✅ La commande ${commandName} a été exécutée avec succès pour ${hashsupport}.`
            : `❌ Échec de l'envoi de la commande ${commandName} pour ${hashsupport}. Vérifiez le token API ou le code support.`)
          .setColor(success ? '#00FF00' : '#FF0000')
          .setTimestamp()]
      });
    } else {
      // Handle GET commands
      actionText = {
        'list-servers': 'Liste des Serveurs',
        'server-ressources': 'Ressources du Serveur'
      }[commandName];

      await interaction.reply({
        embeds: [new EmbedBuilder()
          .setTitle(actionText)
          .setDescription(`🔍 Récupération des données...`)
          .setColor('#FFA500')
          .setTimestamp()],
        flags: 64
      });

      let endpoint;
      let hashsupport = commandName !== 'list-servers' ? interaction.options.getString('hashsupport') : '';
      if (commandName === 'list-servers') endpoint = 'list';
      else if (commandName === 'server-ressources') endpoint = 'ressources';

      data = await fetchMineStratorData(endpoint, hashsupport);

      await interaction.editReply({
        embeds: [new EmbedBuilder()
          .setTitle(data ? actionText : `Échec de la ${actionText}`)
          .setDescription(data
            ? formatServerData(data, commandName)
            : `❌ Impossible de récupérer les données. Vérifiez le token API ou le code support${hashsupport ? ` (${hashsupport})` : ''}.`)
          .setColor(data ? '#00FF00' : '#FF0000')
          .setTimestamp()]
      });
    }
  } catch (error) {
    console.error('[INTERACTION] Erreur:', error);
    if (!interaction.replied) {
      await interaction.reply({
        embeds: [new EmbedBuilder()
          .setTitle('Erreur')
          .setDescription('❌ Une erreur est survenue lors de l\'exécution de la commande.')
          .setColor('#FF0000')
          .setTimestamp()],
        flags: 64
      }).catch(() => {});
    }
  }
});

// Bot ready event
client.once('ready', () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

// Login to Discord
client.login(config.discordToken);
