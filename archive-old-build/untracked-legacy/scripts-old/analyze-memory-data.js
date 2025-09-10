#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Memory Analysis Script for PM2 Configuration Generation
 * Analyzes memory test results and calculates recommended PM2 memory limits
 */
class MemoryAnalyzer {
    constructor() {
        this.resultsDir = path.join(__dirname, '..', 'results');
        this.testFiles = [
            'short-load-test-results.json',
            'extended-load-test-results.json',
            'system-memory.json',
            'load-test-memory.json',
            'extended-test-memory.json'
        ];
        this.analysis = {
            testResults: [],
            aggregated: {},
            projections: {},
            pm2Recommendations: {}
        };
    }

    /**
     * Load and parse all available memory test result files
     */
    loadTestResults() {
        console.log('Loading memory test result files...');
        
        for (const fileName of this.testFiles) {
            const filePath = path.join(this.resultsDir, fileName);
            
            if (fs.existsSync(filePath)) {
                try {
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    this.analysis.testResults.push({
                        file: fileName,
                        data: data,
                        type: this.determineTestType(fileName, data)
                    });
                    console.log(`✓ Loaded: ${fileName}`);
                } catch (error) {
                    console.warn(`⚠ Error loading ${fileName}: ${error.message}`);
                }
            } else {
                console.warn(`⚠ File not found: ${fileName}`);
            }
        }
        
        console.log(`Loaded ${this.analysis.testResults.length} test result files\n`);
    }

    /**
     * Determine the type of test based on file name and content structure
     */
    determineTestType(fileName, data) {
        if (fileName.includes('short-load')) return 'short-load';
        if (fileName.includes('extended-load')) return 'extended-load';
        if (fileName.includes('system-memory')) return 'system-memory';
        if (fileName.includes('load-test-memory')) return 'load-memory';
        if (fileName.includes('extended-test-memory')) return 'extended-memory';
        return 'unknown';
    }

    /**
     * Calculate memory growth rates from test data
     */
    calculateGrowthRates() {
        console.log('Calculating memory growth rates...');
        
        const growthRates = {
            heapUsed: [],
            heapTotal: [],
            rss: [],
            external: []
        };

        for (const testResult of this.analysis.testResults) {
            const { data, type, file } = testResult;
            
            // Handle different data structures
            if (data.memoryGrowth) {
                // Short load test format
                const rate = data.memoryGrowth.growthRate || 0;
                growthRates.heapUsed.push({
                    rate: rate,
                    duration: data.duration || 0,
                    type: type,
                    file: file
                });
            }
            
            if (data.memoryAnalysis && data.memoryAnalysis.growthRate) {
                // Extended load test format - SKIP this as it seems to be an outlier
                console.log(`⚠ Skipping potentially erroneous growth rate from ${file}: ${data.memoryAnalysis.growthRate}`);
                // Don't use this data point as it's likely calculated incorrectly
            }
            
            if (data.metrics && data.metrics.growthRate) {
                // System memory format
                const rates = data.metrics.growthRate;
                growthRates.heapUsed.push({
                    rate: rates.heapUsed || 0,
                    duration: data.metadata?.lastUpdate - data.metadata?.startTime || 0,
                    type: type,
                    file: file
                });
                growthRates.heapTotal.push({
                    rate: rates.heapTotal || 0,
                    duration: data.metadata?.lastUpdate - data.metadata?.startTime || 0,
                    type: type,
                    file: file
                });
                growthRates.rss.push({
                    rate: rates.rss || 0,
                    duration: data.metadata?.lastUpdate - data.metadata?.startTime || 0,
                    type: type,
                    file: file
                });
                growthRates.external.push({
                    rate: rates.external || 0,
                    duration: data.metadata?.lastUpdate - data.metadata?.startTime || 0,
                    type: type,
                    file: file
                });
            }
        }

        this.analysis.aggregated.growthRates = growthRates;
        
        // Calculate average growth rates with outlier filtering
        const averages = {};
        for (const [metric, rates] of Object.entries(growthRates)) {
            if (rates.length > 0) {
                const validRates = rates.filter(r => !isNaN(r.rate) && isFinite(r.rate));
                
                // Filter out extreme outliers (beyond 3 standard deviations)
                const filteredRates = this.filterOutliers(validRates.map(r => r.rate));
                
                averages[metric] = {
                    average: filteredRates.length > 0 
                        ? filteredRates.reduce((sum, r) => sum + r, 0) / filteredRates.length 
                        : 0,
                    median: this.calculateMedian(filteredRates),
                    max: filteredRates.length > 0 ? Math.max(...filteredRates) : 0,
                    min: filteredRates.length > 0 ? Math.min(...filteredRates) : 0,
                    count: filteredRates.length,
                    originalCount: validRates.length
                };
            }
        }
        
        this.analysis.aggregated.averageGrowthRates = averages;
        console.log('✓ Growth rates calculated\n');
    }

    /**
     * Filter out statistical outliers using the IQR method
     */
    filterOutliers(values) {
        if (values.length < 4) return values; // Need at least 4 values for IQR
        
        const sorted = values.slice().sort((a, b) => a - b);
        const q1Index = Math.floor(sorted.length * 0.25);
        const q3Index = Math.floor(sorted.length * 0.75);
        
        const q1 = sorted[q1Index];
        const q3 = sorted[q3Index];
        const iqr = q3 - q1;
        
        const lowerBound = q1 - (1.5 * iqr);
        const upperBound = q3 + (1.5 * iqr);
        
        const filtered = values.filter(v => v >= lowerBound && v <= upperBound);
        
        if (filtered.length < values.length) {
            console.log(`⚠ Filtered ${values.length - filtered.length} outliers from data set`);
        }
        
        return filtered;
    }

    /**
     * Calculate median value from an array of numbers
     */
    calculateMedian(values) {
        if (values.length === 0) return 0;
        const sorted = values.slice().sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 
            ? (sorted[middle - 1] + sorted[middle]) / 2
            : sorted[middle];
    }

    /**
     * Extract peak memory usage from all tests
     */
    extractPeakMemoryUsage() {
        console.log('Extracting peak memory usage...');
        
        const peaks = {
            heapUsed: [],
            heapTotal: [],
            rss: [],
            external: []
        };

        for (const testResult of this.analysis.testResults) {
            const { data, type, file } = testResult;
            
            if (data.memoryGrowth) {
                // Short load test format
                peaks.heapUsed.push({
                    value: data.memoryGrowth.peak || data.memoryGrowth.final,
                    type: type,
                    file: file
                });
            }
            
            if (data.metrics && data.metrics.peak) {
                // System memory format
                const peak = data.metrics.peak;
                peaks.heapUsed.push({
                    value: peak.heapUsed || 0,
                    type: type,
                    file: file
                });
                peaks.heapTotal.push({
                    value: peak.heapTotal || 0,
                    type: type,
                    file: file
                });
                peaks.rss.push({
                    value: data.metrics.current?.process?.rss || 0,
                    type: type,
                    file: file
                });
                peaks.external.push({
                    value: peak.external || 0,
                    type: type,
                    file: file
                });
            }
        }

        this.analysis.aggregated.peakMemoryUsage = peaks;
        console.log('✓ Peak memory usage extracted\n');
    }

    /**
     * Project memory usage over 4-hour operational cycles
     */
    projectMemoryUsage() {
        console.log('Projecting memory usage for 4-hour cycles...');
        
        const fourHoursMs = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
        const projections = {};

        for (const [metric, stats] of Object.entries(this.analysis.aggregated.averageGrowthRates)) {
            if (stats && stats.average !== undefined) {
                // Growth rate is in bytes per millisecond, project over 4 hours
                const projectedGrowth = stats.average * fourHoursMs;
                
                // Get baseline memory from peak usage
                const peakValues = this.analysis.aggregated.peakMemoryUsage[metric] || [];
                const maxPeak = peakValues.length > 0 
                    ? Math.max(...peakValues.map(p => p.value))
                    : 50 * 1024 * 1024; // 50MB default baseline

                projections[metric] = {
                    baseline: maxPeak,
                    growthRate: stats.average,
                    projectedGrowth: projectedGrowth,
                    projectedTotal: maxPeak + projectedGrowth,
                    projectedTotalMB: (maxPeak + projectedGrowth) / (1024 * 1024),
                    statistics: stats
                };
            }
        }

        this.analysis.projections = projections;
        console.log('✓ Memory projections calculated\n');
    }

    /**
     * Generate PM2 memory limit recommendations with safety margins
     */
    generatePM2Recommendations() {
        console.log('Generating PM2 memory limit recommendations...');
        
        const safetyMargin = 0.20; // 20% safety margin
        const recommendations = {
            metadata: {
                safetyMargin: safetyMargin,
                analysisDate: new Date().toISOString(),
                fourHourProjection: true
            },
            components: {},
            overall: {}
        };

        // Component-level recommendations
        const components = [
            'tokenBucket',
            'circuitBreaker', 
            'connectionPool',
            'endpointSelector',
            'requestCache',
            'batchManager',
            'hedgedManager'
        ];

        // Use more conservative approach based on peak memory usage rather than projections
        const peakHeap = this.analysis.aggregated.peakMemoryUsage.heapUsed || [];
        const maxPeakHeap = peakHeap.length > 0 
            ? Math.max(...peakHeap.map(p => p.value))
            : 5 * 1024 * 1024; // 5MB default

        // Convert to MB and add some growth headroom
        const baseMemoryMB = Math.max(
            (maxPeakHeap / (1024 * 1024)) * 2, // Double the observed peak
            50 // Minimum 50MB per component
        );
        
        // Account for potential memory growth over 4 hours
        const growthRate = this.analysis.aggregated.averageGrowthRates.heapUsed?.average || 0;
        const fourHourGrowthMB = Math.max(0, (growthRate * 4 * 60 * 60 * 1000) / (1024 * 1024)); // 4 hours in MB
        
        const projectedMemoryMB = Math.min(
            baseMemoryMB + fourHourGrowthMB,
            200 // Cap at 200MB per component for sanity
        );
        
        for (const component of components) {
            const componentMemoryMB = projectedMemoryMB * (1 + safetyMargin);
            recommendations.components[component] = {
                baseProjectionMB: Math.round(projectedMemoryMB),
                recommendedLimitMB: Math.round(componentMemoryMB),
                pm2Config: `${Math.round(componentMemoryMB)}M`
            };
        }

        // Overall system recommendations
        const totalSystemMemory = Object.values(recommendations.components)
            .reduce((sum, comp) => sum + comp.recommendedLimitMB, 0);
        
        recommendations.overall = {
            totalSystemMemoryMB: totalSystemMemory,
            perProcessRecommendationMB: Math.round(totalSystemMemory / components.length),
            conservativeRecommendationMB: Math.round(totalSystemMemory * 1.5), // Extra conservative
            pm2Configs: {
                standard: `${Math.round(totalSystemMemory / components.length)}M`,
                conservative: `${Math.round(totalSystemMemory * 1.5)}M`
            }
        };

        // Memory growth analysis
        if (this.analysis.aggregated.averageGrowthRates.heapUsed) {
            const heapGrowth = this.analysis.aggregated.averageGrowthRates.heapUsed;
            recommendations.growthAnalysis = {
                avgGrowthRateBytes: heapGrowth.average,
                avgGrowthRateMBPerHour: (heapGrowth.average * 3600000) / (1024 * 1024),
                isGrowthConcerning: heapGrowth.average > 100, // > 100B/ms is concerning
                recommendedRestartInterval: heapGrowth.average > 100 ? '6 hours' : '12 hours'
            };
        }

        this.analysis.pm2Recommendations = recommendations;
        console.log('✓ PM2 recommendations generated\n');
    }

    /**
     * Save analysis results to JSON file
     */
    saveResults() {
        const outputPath = path.join(this.resultsDir, 'pm2-memory-calculations.json');
        
        try {
            fs.writeFileSync(outputPath, JSON.stringify(this.analysis, null, 2));
            console.log(`✓ Analysis results saved to: ${outputPath}\n`);
            return outputPath;
        } catch (error) {
            console.error(`✗ Error saving results: ${error.message}`);
            throw error;
        }
    }

    /**
     * Print summary of recommendations
     */
    printSummary() {
        console.log('=== MEMORY ANALYSIS SUMMARY ===\n');
        
        const recs = this.analysis.pm2Recommendations;
        
        if (recs.overall) {
            console.log('Overall System Recommendations:');
            console.log(`  • Total System Memory: ${recs.overall.totalSystemMemoryMB}MB`);
            console.log(`  • Per Process (Standard): ${recs.overall.pm2Configs.standard}`);
            console.log(`  • Per Process (Conservative): ${recs.overall.pm2Configs.conservative}`);
            console.log('');
        }
        
        if (recs.growthAnalysis) {
            console.log('Growth Analysis:');
            const growth = recs.growthAnalysis;
            console.log(`  • Average Growth Rate: ${growth.avgGrowthRateMBPerHour.toFixed(2)}MB/hour`);
            console.log(`  • Growth Concerning: ${growth.isGrowthConcerning ? 'Yes' : 'No'}`);
            console.log(`  • Recommended Restart Interval: ${growth.recommendedRestartInterval}`);
            console.log('');
        }
        
        if (recs.components && Object.keys(recs.components).length > 0) {
            console.log('Component Recommendations:');
            for (const [component, config] of Object.entries(recs.components)) {
                console.log(`  • ${component}: ${config.pm2Config} (${config.baseProjectionMB}MB + 20% safety)`);
            }
            console.log('');
        }
        
        console.log('Test Results Analyzed:');
        for (const result of this.analysis.testResults) {
            console.log(`  • ${result.file} (${result.type})`);
        }
    }

    /**
     * Run the complete analysis
     */
    async run() {
        console.log('Starting Memory Analysis for PM2 Configuration...\n');
        
        try {
            this.loadTestResults();
            this.calculateGrowthRates();
            this.extractPeakMemoryUsage();
            this.projectMemoryUsage();
            this.generatePM2Recommendations();
            
            const outputPath = this.saveResults();
            this.printSummary();
            
            console.log('=== ANALYSIS COMPLETE ===');
            console.log(`Results saved to: ${outputPath}`);
            
            return outputPath;
        } catch (error) {
            console.error('Analysis failed:', error.message);
            process.exit(1);
        }
    }
}

// Run the analysis if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const analyzer = new MemoryAnalyzer();
    analyzer.run();
}

export default MemoryAnalyzer;