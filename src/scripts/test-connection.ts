// src/scripts/test-connection.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testMongoConnection() {
    try {
        const connection = await mongoose.connect('mongodb://localhost:27017/thorp');
        console.log('Successfully connected to MongoDB.');
        
        // Test database operations
        if (connection.connection.db) {
            const collections = await connection.connection.db.collections();
            console.log('Available collections:', collections.map(c => c.collectionName));
            
            // Optional: Create a test document
            const testCollection = connection.connection.db.collection('test');
            await testCollection.insertOne({ test: 'connection', timestamp: new Date() });
            console.log('Successfully inserted test document');
            
            // Cleanup
            await testCollection.deleteMany({ test: 'connection' });
            console.log('Successfully cleaned up test documents');
        }
        
    } catch (error) {
        console.error('MongoDB connection test failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
    }
}

testMongoConnection().catch(console.error);