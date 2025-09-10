import { connectToDatabase } from './database';
import { ClassificationHistory } from './classificationHistory';
import { ClassificationIntegrationService } from '../services/classification-integration.service';

async function reviewData() {
  await connectToDatabase();
  const classifier = new ClassificationIntegrationService();
  
  console.log("📊 === THORP DATA REVIEW ===\n");
  
  // 1. Overall Summary
  const stats = await classifier.getSystemStats();
  console.log("🎯 CURRENT SUMMARY:");
  console.log(`   Fresh Gems: ${stats.tokensByStatus['fresh-gem'] || 0}`);
  console.log(`   Established: ${stats.tokensByStatus['established'] || 0}`);
  console.log(`   Rejected: ${stats.tokensByStatus['rejected'] || 0}`);
  console.log(`   Under Review: ${stats.tokensByStatus['under-review'] || 0}`);
  console.log(`   Recent Activity: ${stats.recentActivity} changes\n`);
  
  // 2. Best Opportunities (High Edge Score)
  console.log("🔥 TOP OPPORTUNITIES (Edge Score ≥ 85):");
  const topTokens = await ClassificationHistory.find({
    edge_score: { $gte: 85 },
    current_status: { $in: ['fresh-gem', 'established'] }
  }).sort({ edge_score: -1 }).limit(10);
  
  topTokens.forEach(token => {
    console.log(`   ${token.token_address.substring(0, 8)}... | ${token.current_status} | Score: ${token.edge_score} | Age: ${token.age_minutes}m`);
  });
  console.log("");
  
  // 3. Recent Fresh Gems (Last 24 hours)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentGems = await ClassificationHistory.find({
    current_status: 'fresh-gem',
    first_detected_at: { $gte: yesterday }
  }).sort({ edge_score: -1 });
  
  console.log("💎 FRESH GEMS (Last 24h):");
  if (recentGems.length === 0) {
    console.log("   No fresh gems found in last 24 hours");
  } else {
    recentGems.forEach(gem => {
      console.log(`   ${gem.token_address.substring(0, 8)}... | Score: ${gem.edge_score} | ${gem.reason}`);
    });
  }
  console.log("");
  
  // 4. Performance Tracking
  const totalTokens = await ClassificationHistory.countDocuments();
  const goodTokens = await ClassificationHistory.countDocuments({
    current_status: { $in: ['fresh-gem', 'established'] }
  });
  const successRate = totalTokens > 0 ? ((goodTokens / totalTokens) * 100).toFixed(1) : 0;
  
  console.log("📈 PERFORMANCE METRICS:");
  console.log(`   Total Tokens Processed: ${totalTokens}`);
  console.log(`   Good Opportunities: ${goodTokens}`);
  console.log(`   Success Rate: ${successRate}%`);
  console.log(`   Target: 74-76%\n`);
  
  // 5. Activity Timeline (Last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentActivity = await ClassificationHistory.find({
    classification_timestamp: { $gte: weekAgo }
  }).sort({ classification_timestamp: -1 }).limit(20);
  
  console.log("⏰ RECENT ACTIVITY (Last 20 items):");
  recentActivity.forEach(activity => {
    const time = (activity as any).classification_timestamp || (activity as any).created_at || (activity as any).updatedAt || "No timestamp";
    console.log(`   ${time} | ${activity.current_status} | Score: ${activity.edge_score} | ${activity.reason.substring(0, 50)}...`);
  });
  
  process.exit(0);
}

reviewData().catch(console.error);