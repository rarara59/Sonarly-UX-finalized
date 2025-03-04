// src/services/alertService.ts
import mongoose, { Schema } from 'mongoose';
import { IAlert } from '../types/database';

// Alert Schema
const AlertSchema = new Schema<IAlert>({
    type: { type: String, required: true, enum: ['PATTERN', 'WALLET', 'PRICE', 'VOLUME', 'FREQUENCY'] },
    severity: { type: String, required: true, enum: ['LOW', 'MEDIUM', 'HIGH'] },
    message: { type: String, required: true },
    metadata: {
        patternId: String,
        walletAddress: String,
        pairAddress: String,
        threshold: Number,
        volume: Number,
        priceImpact: Number,
        transactionHash: String
    },
    timestamp: { type: Date, default: Date.now },
    status: { 
        type: String, 
        required: true, 
        enum: ['NEW', 'ACKNOWLEDGED', 'RESOLVED'],
        default: 'NEW'
    }
});

// Create Model
const Alert = mongoose.model<IAlert>('Alert', AlertSchema);

class AlertService {
    constructor() {
        this.initializeService();
    }

    private async initializeService() {
        console.log('Alert Service initialized');
    }

    public async createAlert(alertData: Omit<IAlert, '_id'>) {
        try {
            const alert = new Alert(alertData);
            await alert.save();
            await this.dispatchNotification(alert);
            return alert;
        } catch (error) {
            console.error('Error creating alert:', error);
            throw error;
        }
    }

    private async dispatchNotification(alert: IAlert) {
        // In production, you'd implement actual notification dispatch here
        // For now, we'll just log it
        console.log('🚨 New Alert:', {
            type: alert.type,
            severity: alert.severity,
            message: alert.message,
            timestamp: alert.timestamp
        });
    }

    public async getAlerts(filter: Partial<IAlert> = {}, limit = 50) {
        try {
            return await Alert.find(filter)
                .sort({ timestamp: -1 })
                .limit(limit);
        } catch (error) {
            console.error('Error fetching alerts:', error);
            throw error;
        }
    }

    public async acknowledgeAlert(alertId: string) {
        try {
            const alert = await Alert.findByIdAndUpdate(
                alertId,
                { status: 'ACKNOWLEDGED' },
                { new: true }
            );
            return alert;
        } catch (error) {
            console.error('Error acknowledging alert:', error);
            throw error;
        }
    }

    public async resolveAlert(alertId: string) {
        try {
            const alert = await Alert.findByIdAndUpdate(
                alertId,
                { status: 'RESOLVED' },
                { new: true }
            );
            return alert;
        } catch (error) {
            console.error('Error resolving alert:', error);
            throw error;
        }
    }

    public async getActiveAlerts() {
        try {
            return await Alert.find({
                status: { $in: ['NEW', 'ACKNOWLEDGED'] }
            }).sort({ timestamp: -1 });
        } catch (error) {
            console.error('Error fetching active alerts:', error);
            throw error;
        }
    }
}

export default new AlertService();