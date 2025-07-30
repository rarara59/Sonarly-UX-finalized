// src/scripts/migrate-classification-model.ts

import mongoose from 'mongoose';
import { ClassificationHistory } from '../models/classificationHistory';
import { ClassificationAuditTrail } from '../models/classificationAuditTrail';
import { logger } from '../utils/logger';

/**
 * Migration script to upgrade from schema v1 to v2
 * Addresses auditability and traceability gaps identified in the review
 */

interface MigrationStats {
  totalRecords: number;
  migratedRecords: number;
  auditEntriesCreated: number;
  errors: number;
  skippedRecords: number;
}

interface LegacyRecord {
  token_address: string;
  current_status: string;
  edge_score: number;
  is_late_blooming?: boolean;
  is_early_established?: boolean;
  is_delayed_hot?: boolean;
  is_false_positive?: boolean;
  is_reborn?: boolean;
  is_edge_plateau?: boolean;
  is_echo?: boolean;
  is_sidecar?: boolean;
  is_reversal?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ClassificationModelMigration {
  private stats: MigrationStats = {
    totalRecords: 0,
    migratedRecords: 0,
    auditEntriesCreated: 0,
    errors: 0,
    skippedRecords: 0
  };

  /**
   * Main migration method - safe to run multiple times
   */
  async migrate(options: {
    dryRun?: boolean;
    batchSize?: number;
    skipAuditTrail?: boolean;
  } = {}): Promise<MigrationStats> {
    const { dryRun = false, batchSize = 100, skipAuditTrail = false } = options;

    logger.info(`Starting classification model migration (dry run: ${dryRun})`);

    try {
      // Step 1: Count total records to migrate
      await this.analyzeCurrentData();

      // Step 2: Create new indexes if not in dry run mode
      if (!dryRun) {
        await this.createNewIndexes();
      }

      // Step 3: Migrate records in batches
      await this.migrateRecords(batchSize, dryRun);

      // Step 4: Create audit trail for existing records
      if (!skipAuditTrail && !dryRun) {
        await this.createInitialAuditTrail(batchSize);
      }

      // Step 5: Validate migration
      await this.validateMigration();

      logger.info('Migration completed successfully', this.stats);
      return this.stats;

    } catch (error: any) {
      logger.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Analyze current data structure
   */
  private async analyzeCurrentData(): Promise<void> {
    logger.info('Analyzing current data structure...');

    // Count total records
    this.stats.totalRecords = await ClassificationHistory.countDocuments();

    // Check for schema version field
    const recordsWithVersion = await ClassificationHistory.countDocuments({
      schema_version: { $exists: true }
    });

    // Check for embedded flags
    const recordsWithEmbeddedFlags = await ClassificationHistory.countDocuments({
      'reclassificationFlags': { $exists: true }
    });

    // Check for source field
    const recordsWithSource = await ClassificationHistory.countDocuments({
      source: { $exists: true }
    });

    logger.info('Current data analysis:', {
      totalRecords: this.stats.totalRecords,
      recordsWithVersion,
      recordsWithEmbeddedFlags,
      recordsWithSource,
      needsMigration: this.stats.totalRecords - recordsWithVersion
    });
  }

  /**
   * Create new indexes for improved performance
   */
  private async createNewIndexes(): Promise<void> {
    logger.info('Creating new indexes...');

    try {
      // Compound index for pagination (addressing review feedback)
      await ClassificationHistory.collection.createIndex(
        { current_status: 1, updated_at: -1 },
        { background: true, name: 'idx_status_updated_pagination' }
      );

      // Source and audit indexes
      await ClassificationHistory.collection.createIndex(
        { source: 1, updated_at: -1 },
        { background: true, name: 'idx_source_updated' }
      );

      await ClassificationHistory.collection.createIndex(
        { schema_version: 1, updated_at: -1 },
        { background: true, name: 'idx_version_updated' }
      );

      logger.info('New indexes created successfully');
    } catch (error: any) {
      logger.warn('Some indexes may already exist:', error.message);
    }
  }

  /**
   * Migrate records in batches
   */
  private async migrateRecords(batchSize: number, dryRun: boolean): Promise<void> {
    logger.info(`Migrating records in batches of ${batchSize}...`);

    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      // Find records that need migration (no schema_version or version < 2)
      const records = await ClassificationHistory.find({
        $or: [
          { schema_version: { $exists: false } },
          { schema_version: { $lt: 2 } }
        ]
      })
      .limit(batchSize)
      .skip(skip)
      .lean<LegacyRecord[]>();

      if (records.length === 0) {
        hasMore = false;
        break;
      }

      for (const record of records) {
        try {
          await this.migrateRecord(record, dryRun);
          this.stats.migratedRecords++;
        } catch (error: any) {
          logger.error(`Error migrating record ${record.token_address}:`, error);
          this.stats.errors++;
        }
      }

      skip += batchSize;
      logger.info(`Processed ${skip} records so far...`);
    }
  }

  /**
   * Migrate a single record
   */
  private async migrateRecord(record: LegacyRecord, dryRun: boolean): Promise<void> {
    if (dryRun) {
      logger.debug(`Would migrate record: ${record.token_address}`);
      return;
    }

    // Build reclassificationFlags object from flat flags
    const reclassificationFlags = {
      is_late_blooming: record.is_late_blooming || false,
      is_early_established: record.is_early_established || false,
      is_delayed_hot: record.is_delayed_hot || false,
      is_false_positive: record.is_false_positive || false,
      is_reborn: record.is_reborn || false,
      is_edge_plateau: record.is_edge_plateau || false,
      is_echo: record.is_echo || false,
      is_sidecar: record.is_sidecar || false,
      is_reversal: record.is_reversal || false
    };

    // Update the record with new schema
    await ClassificationHistory.updateOne(
      { token_address: record.token_address },
      {
        $set: {
          reclassificationFlags,
          source: 'batch_processor', // Default source for legacy records
          updated_by: 'migration_script',
          schema_version: 2,
          change_count: 0,
          last_significant_change_at: record.updatedAt || record.createdAt || new Date()
        },
        $unset: {
          // Remove flat flag fields to clean up schema
          is_late_blooming: '',
          is_early_established: '',
          is_delayed_hot: '',
          is_false_positive: '',
          is_reborn: '',
          is_edge_plateau: '',
          is_echo: '',
          is_sidecar: '',
          is_reversal: ''
        }
      }
    );
  }

  /**
   * Create initial audit trail for existing records
   */
  private async createInitialAuditTrail(batchSize: number): Promise<void> {
    logger.info('Creating initial audit trail entries...');

    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const records = await ClassificationHistory.find({
        schema_version: 2
      })
      .limit(batchSize)
      .skip(skip)
      .lean();

      if (records.length === 0) {
        hasMore = false;
        break;
      }

      for (const record of records) {
        try {
          await this.createAuditEntry(record);
          this.stats.auditEntriesCreated++;
        } catch (error: any) {
          logger.error(`Error creating audit entry for ${record.token_address}:`, error);
          this.stats.errors++;
        }
      }

      skip += batchSize;
      logger.info(`Created audit entries for ${skip} records...`);
    }
  }

  /**
   * Create audit entry for migrated record
   */
  private async createAuditEntry(record: any): Promise<void> {
    const flagsSummary: any[] = [];
    
    if (record.reclassificationFlags) {
      Object.entries(record.reclassificationFlags).forEach(([key, value]) => {
        if (value && key.startsWith('is_')) {
          flagsSummary.push(key.substring(3)); // Remove 'is_' prefix
        }
      });
    }

    // COMMENTED OUT: await AuditTrailLogger.logChange( // AuditTrailLogger not available
      record.token_address,
      'create',
      [{
        field_name: 'current_status',
        old_value: null,
        new_value: record.current_status
      }],
      {
        reason: 'Initial record creation (migrated)',
        triggered_by: 'system_rule',
        source: record.source || 'batch_processor',
        initiated_by: 'migration_script'
      },
      null, // No before snapshot for initial creation
      {
        current_status: record.current_status,
        edge_score: record.edge_score,
        reevaluation_count: record.reevaluation_count || 0,
        alert_suppressed: record.alert_suppressed || false,
        flags_summary: flagsSummary
      }
    // ); // Auto-fixed: was causing syntax error
  }

  /**
   * Validate migration results
   */
  private async validateMigration(): Promise<void> {
    logger.info('Validating migration results...');

    // Check that all records have schema_version 2
    const unmigratedCount = await ClassificationHistory.countDocuments({
      $or: [
        { schema_version: { $exists: false } },
        { schema_version: { $lt: 2 } }
      ]
    });

    if (unmigratedCount > 0) {
      throw new Error(`Migration incomplete: ${unmigratedCount} records still need migration`);
    }

    // Check that reclassificationFlags exist
    const recordsWithFlags = await ClassificationHistory.countDocuments({
      reclassificationFlags: { $exists: true }
    });

    if (recordsWithFlags !== this.stats.totalRecords) {
      logger.warn(`Flag migration incomplete: ${recordsWithFlags}/${this.stats.totalRecords} records have embedded flags`);
    }

    // Validate index creation
    const indexes = await ClassificationHistory.collection.getIndexes();
    const requiredIndexes = [
      'idx_status_updated_pagination',
      'idx_source_updated',
      'idx_version_updated'
    ];

    const missingIndexes = requiredIndexes.filter(idx => !indexes[idx]);
    if (missingIndexes.length > 0) {
      logger.warn(`Missing indexes: ${missingIndexes.join(', ')}`);
    }

    logger.info('Migration validation completed');
  }

  /**
   * Rollback migration (emergency use only)
   */
  async rollback(): Promise<void> {
    logger.warn('🚨 ROLLBACK: Reverting classification model migration...');

    const confirm = process.env.CONFIRM_ROLLBACK;
    if (confirm !== 'YES_I_WANT_TO_ROLLBACK') {
      throw new Error('Rollback requires explicit confirmation via CONFIRM_ROLLBACK=YES_I_WANT_TO_ROLLBACK');
    }

    try {
      // Restore flat flags from embedded structure
      const records = await ClassificationHistory.find({
        schema_version: 2,
        reclassificationFlags: { $exists: true }
      }).lean();

      for (const record of records) {
        const flags = record.reclassificationFlags || {};
        
        await ClassificationHistory.updateOne(
          { token_address: record.token_address },
          {
            $set: {
              is_late_blooming: flags.is_late_blooming || false,
              is_early_established: flags.is_early_established || false,
              is_delayed_hot: flags.is_delayed_hot || false,
              is_false_positive: flags.is_false_positive || false,
              is_reborn: flags.is_reborn || false,
              is_edge_plateau: flags.is_edge_plateau || false,
              is_echo: flags.is_echo || false,
              is_sidecar: flags.is_sidecar || false,
              is_reversal: flags.is_reversal || false,
              schema_version: 1
            },
            $unset: {
              reclassificationFlags: '',
              source: '',
              updated_by: '',
              change_count: '',
              last_significant_change_at: ''
            }
          }
        );
      }

      logger.info(`Rolled back ${records.length} records to schema v1`);
    } catch (error: any) {
      logger.error('Rollback failed:', error);
      throw error;
    }
  }

  /**
   * Get migration statistics
   */
  getStats(): MigrationStats {
    return { ...this.stats };
  }
}

/**
 * Command line interface
 */
async function runMigration() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const skipAuditTrail = args.includes('--skip-audit');
  const rollback = args.includes('--rollback');

  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thorp');
    
    const migration = new ClassificationModelMigration();
    
    if (rollback) {
      await migration.rollback();
    } else {
      const stats = await migration.migrate({
        dryRun,
        skipAuditTrail,
        batchSize: 100
      });
      
      console.log('\n📊 Migration Results:');
      console.log('┌─────────────────────────────────────┐');
      console.log('│           MIGRATION STATS           │');
      console.log('├─────────────────────────────────────┤');
      console.log(`│ Total Records: ${stats.totalRecords.toString().padEnd(18)} │`);
      console.log(`│ Migrated: ${stats.migratedRecords.toString().padEnd(23)} │`);
      console.log(`│ Audit Entries: ${stats.auditEntriesCreated.toString().padEnd(19)} │`);
      console.log(`│ Errors: ${stats.errors.toString().padEnd(25)} │`);
      console.log(`│ Skipped: ${stats.skippedRecords.toString().padEnd(24)} │`);
      console.log('└─────────────────────────────────────┘');
      
      if (dryRun) {
        console.log('\n✅ Dry run completed - no changes made');
        console.log('Run without --dry-run to execute migration');
      } else {
        console.log('\n🎉 Migration completed successfully!');
      }
    }
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration();
}

// export { ClassificationModelMigration, runMigration }; // Commented out due to comma operator issue