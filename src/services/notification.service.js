const EventEmitter = require('events');

class NotificationService extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            discord: {
                webhookUrl: config.discord?.webhookUrl || process.env.DISCORD_WEBHOOK_URL,
                enabled: config.discord?.enabled ?? true
            },
            console: {
                enabled: config.console?.enabled ?? true
            }
        };
        this.isInitialized = false;
    }

    async initialize() {
        console.log('🔔 Renaissance Notification System initialized');
        console.log(`  📱 Discord: ${this.config.discord.enabled ? 'Enabled' : 'Disabled'}`);
        console.log(`  🖥️ Console: ${this.config.console.enabled ? 'Enabled' : 'Disabled'}`);
        this.isInitialized = true;
        return true;
    }

    async sendTradingAlert(filteredToken) {
        if (!this.isInitialized) await this.initialize();

        const classification = filteredToken.renaissanceClassification;
        const metadata = filteredToken.tokenMetadata;
        
        const alert = {
            type: 'TRADING_OPPORTUNITY',
            tier: classification.tier,
            score: classification.overallScore,
            securityScore: classification.securityScore,
            organicScore: classification.organicScore,
            token: {
                name: metadata.name,
                symbol: metadata.symbol,
                address: metadata.address
            },
            timestamp: Date.now()
        };

        // Console notification
        if (this.config.console.enabled) {
            console.log('\n🚨🚨🚨 RENAISSANCE TRADING ALERT 🚨🚨🚨');
            console.log(`💎 ${classification.tier.toUpperCase()}: ${metadata.name} (${metadata.symbol})`);
            console.log(`📊 Overall Score: ${(classification.overallScore * 100).toFixed(1)}%`);
            console.log(`🔐 Security: ${(classification.securityScore * 100).toFixed(1)}%`);
            console.log(`🌱 Organic: ${(classification.organicScore * 100).toFixed(1)}%`);
            console.log(`⚠️ Risk Level: ${classification.riskLevel.toUpperCase()}`);
            console.log(`🎯 Token: ${metadata.address}`);
            console.log(`⏰ Time: ${new Date().toLocaleString()}`);
            console.log('🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨\n');
        }

        // Discord notification (if configured)
        if (this.config.discord.enabled && this.config.discord.webhookUrl) {
            await this.sendDiscordAlert(alert);
        }

        this.emit('alertSent', alert);
        return alert;
    }

    async sendDiscordAlert(alert) {
        try {
            const embed = {
                title: `🚨 ${alert.tier.toUpperCase()} DETECTED`,
                description: `**${alert.token.name}** (${alert.token.symbol})`,
                color: alert.tier === 'fresh-gem' ? 0x00ff00 : 0xffaa00,
                fields: [
                    { name: '📊 Overall Score', value: `${(alert.score * 100).toFixed(1)}%`, inline: true },
                    { name: '🔐 Security Score', value: `${(alert.securityScore * 100).toFixed(1)}%`, inline: true },
                    { name: '🌱 Organic Score', value: `${(alert.organicScore * 100).toFixed(1)}%`, inline: true },
                    { name: '🎯 Token Address', value: `\`${alert.token.address}\``, inline: false }
                ],
                timestamp: new Date().toISOString()
            };

            const response = await fetch(this.config.discord.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    embeds: [embed]
                })
            });

            if (!response.ok) {
                throw new Error(`Discord webhook failed: ${response.status}`);
            }

        } catch (error) {
            console.error('❌ Discord notification failed:', error.message);
        }
    }

    async healthCheck() {
        return {
            healthy: this.isInitialized,
            discord: this.config.discord.enabled,
            console: this.config.console.enabled
        };
    }

    async shutdown() {
        console.log('[NotificationService] Shutdown complete');
        this.isInitialized = false;
        this.removeAllListeners();
    }
}

module.exports = NotificationService;