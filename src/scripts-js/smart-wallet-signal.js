/**
 * SMART WALLET NETWORK EFFECTS ANALYZER - RENAISSANCE SUPPLEMENT
 * 
 * Focused Mathematical Framework:
 * - Graph Theory: Transaction relationship mapping and centrality analysis
 * - Network Effects: Smart wallet clustering and influence propagation
 * - Statistical Significance: Network effect validation and confidence scoring
 * - Integration: Supplements SmartWalletSignalJS with network relationship analysis
 * 
 * Performance Targets:
 * - Graph construction: < 30ms for 1000-node networks
 * - Centrality calculation: < 20ms using sparse matrix optimization
 * - Network effect analysis: < 15ms for detected wallet clusters
 * - Integration processing: < 5ms supplement calculation
 * 
 * Role: NETWORK SUPPLEMENT to SmartWalletSignalJS (not standalone)
 */

class SmartWalletNetworkEffectsAnalyzer {
  constructor() {
    // Graph representation (memory efficient, focused on relationships)
    this.walletGraph = new Map(); // wallet -> Set of connected wallets
    this.transactionWeights = new Map(); // edge -> cumulative weight
    this.networkMetrics = new Map(); // wallet -> centrality scores
    
    // Numerical precision controls
    this.EPSILON = 1e-10;
    this.MAX_ITERATIONS = 100;
    this.CONVERGENCE_THRESHOLD = 1e-8;
    
    // Network effect weights (Renaissance calibrated for network analysis)
    this.networkWeights = { 
      degree: 0.30,      // Direct connection importance
      betweenness: 0.40, // Bridge/intermediary importance  
      eigenvector: 0.30  // Influence from connected nodes
    };
    
    // Network effect thresholds (empirically derived)
    this.networkThresholds = {
      MIN_CLUSTER_SIZE: 3,           // Minimum wallets for meaningful network effect
      MIN_CONNECTION_STRENGTH: 2,    // Minimum transaction count for meaningful edge
      NETWORK_EFFECT_BASELINE: 0.05, // 5% baseline network clustering
      INFLUENCE_DECAY_RATE: 0.1,     // Network influence decay over distance
      MAX_NETWORK_EFFECT: 0.25       // Maximum 25% confidence boost from network
    };
    
    // Performance monitoring (network-focused)
    this.performanceMetrics = {
      graphConstructionTime: 0,
      centralityCalculationTime: 0,
      networkAnalysisTime: 0,
      totalProcessingTime: 0
    };
  }

  // =============================================================================
  // MAIN PUBLIC INTERFACE - NETWORK SUPPLEMENT
  // =============================================================================

  async analyzeNetworkEffects(tokenAddress, detectedWallets, transactions) {
    const startTime = performance.now();
    
    try {
      // 1. Build transaction network graph focused on detected wallets
      const networkStartTime = performance.now();
      const network = this.buildFocusedTransactionNetwork(transactions, detectedWallets);
      this.performanceMetrics.graphConstructionTime = performance.now() - networkStartTime;
      
      if (network.size < this.networkThresholds.MIN_CLUSTER_SIZE) {
        return this.createMinimalNetworkResult('Insufficient network size for analysis', startTime);
      }
      
      // 2. Calculate centrality measures for detected wallets only
      const centralityStartTime = performance.now();
      const centralityScores = this.calculateNetworkCentrality(network, detectedWallets);
      this.performanceMetrics.centralityCalculationTime = performance.now() - centralityStartTime;
      
      // 3. Analyze network clustering and effects
      const analysisStartTime = performance.now();
      const networkEffects = this.calculateNetworkEffects(network, centralityScores, detectedWallets);
      this.performanceMetrics.networkAnalysisTime = performance.now() - analysisStartTime;
      
      // 4. Generate network effect confidence supplement
      const networkConfidence = this.calculateNetworkConfidenceSupplement(networkEffects);
      
      this.performanceMetrics.totalProcessingTime = performance.now() - startTime;
      
      return {
        networkConfidence: networkConfidence,
        networkEffects: networkEffects,
        centralityScores: centralityScores,
        networkMetrics: this.calculateNetworkMetrics(network),
        performance: { ...this.performanceMetrics },
        supplement: true,
        integrationMode: 'network-effects-only'
      };
      
    } catch (error) {
      console.error('Network effects analysis error:', error);
      return this.createMinimalNetworkResult(`Analysis failed: ${error.message}`, startTime);
    }
  }

  // =============================================================================
  // FOCUSED NETWORK CONSTRUCTION
  // =============================================================================

  buildFocusedTransactionNetwork(transactions, detectedWallets) {
    const walletSet = new Set(detectedWallets);
    const network = new Map();
    const weights = new Map();
    
    // Only process transactions involving detected smart wallets
    const relevantTransactions = transactions.filter(tx => 
      walletSet.has(tx.from) || walletSet.has(tx.to)
    );
    
    for (const tx of relevantTransactions) {
      const { from, to, amount, timestamp } = tx;
      
      if (!from || !to || from === to) continue;
      
      // Initialize nodes for detected wallets only
      if (walletSet.has(from) && !network.has(from)) network.set(from, new Set());
      if (walletSet.has(to) && !network.has(to)) network.set(to, new Set());
      
      // Only create edges between detected wallets or from/to detected wallets
      if (walletSet.has(from) && walletSet.has(to)) {
        // Direct smart wallet to smart wallet connection (highest weight)
        network.get(from).add(to);
        network.get(to).add(from);
        
        const edgeKey = this.getEdgeKey(from, to);
        const timeDecay = this.calculateTimeDecay(timestamp);
        const weight = (amount || 1) * timeDecay * 2.0; // Boost smart-to-smart connections
        
        weights.set(edgeKey, (weights.get(edgeKey) || 0) + weight);
      } else if (walletSet.has(from) || walletSet.has(to)) {
        // Connection between smart wallet and other wallet (lower weight)
        const smartWallet = walletSet.has(from) ? from : to;
        const otherWallet = walletSet.has(from) ? to : from;
        
        if (!network.has(smartWallet)) network.set(smartWallet, new Set());
        
        // Track connection but don't add other wallet as node
        const edgeKey = this.getEdgeKey(smartWallet, otherWallet);
        const timeDecay = this.calculateTimeDecay(timestamp);
        const weight = (amount || 1) * timeDecay * 0.5; // Reduced weight for mixed connections
        
        weights.set(edgeKey, (weights.get(edgeKey) || 0) + weight);
      }
    }
    
    this.walletGraph = network;
    this.transactionWeights = weights;
    
    return network;
  }

  calculateTimeDecay(timestamp) {
    const now = Date.now();
    const ageHours = (now - timestamp) / (1000 * 60 * 60);
    const decayRate = 0.01; // λ = 0.01 per hour
    
    return Math.exp(-decayRate * ageHours);
  }

  // =============================================================================
  // NETWORK CENTRALITY FOR DETECTED WALLETS
  // =============================================================================

  calculateNetworkCentrality(network, detectedWallets) {
    const walletSet = new Set(detectedWallets);
    
    // Calculate centrality only for detected smart wallets
    const degreeCentrality = this.calculateFocusedDegreeCentrality(network, walletSet);
    const betweennessCentrality = this.calculateFocusedBetweennessCentrality(network, walletSet);
    const eigenvectorCentrality = this.calculateFocusedEigenvectorCentrality(network, walletSet);
    
    const combinedScores = new Map();
    
    for (const wallet of walletSet) {
      if (network.has(wallet)) {
        const degree = degreeCentrality.get(wallet) || 0;
        const betweenness = betweennessCentrality.get(wallet) || 0;
        const eigenvector = eigenvectorCentrality.get(wallet) || 0;
        
        // Network-focused weighted combination
        const combinedScore = 
          this.networkWeights.degree * degree +
          this.networkWeights.betweenness * betweenness +
          this.networkWeights.eigenvector * eigenvector;
        
        combinedScores.set(wallet, combinedScore);
      }
    }
    
    // Statistical normalization focused on detected wallets only
    return this.statisticallyNormalize(combinedScores);
  }

  calculateFocusedBetweennessCentrality(graph, detectedWallets) {
    const centralities = new Map();
    const nodes = Array.from(detectedWallets).filter(wallet => graph.has(wallet));
    
    // Initialize all centralities to 0
    nodes.forEach(node => centralities.set(node, 0));
    
    if (nodes.length <= 2) return centralities;
    
    // Simplified betweenness for detected wallets only
    for (const source of nodes) {
      const result = this.singleSourceShortestPaths(graph, source);
      const { predecessors, distances, sigma } = result;
      
      // Dependency accumulation
      const delta = new Map();
      nodes.forEach(node => delta.set(node, 0));
      
      // Sort nodes by distance (decreasing)
      const sortedNodes = nodes
        .filter(node => node !== source)
        .sort((a, b) => distances.get(b) - distances.get(a));
      
      for (const w of sortedNodes) {
        for (const v of predecessors.get(w)) {
          if (detectedWallets.has(v)) {
            const contribution = (sigma.get(v) / sigma.get(w)) * (1 + delta.get(w));
            delta.set(v, delta.get(v) + contribution);
          }
        }
        if (detectedWallets.has(w)) {
          centralities.set(w, centralities.get(w) + delta.get(w));
        }
      }
    }
    
    // Normalize
    const n = nodes.length;
    const normalizationFactor = (n - 1) * (n - 2);
    
    if (normalizationFactor > 0) {
      for (const [node, centrality] of centralities) {
        centralities.set(node, centrality / normalizationFactor);
      }
    }
    
    return centralities;
  }

  calculateFocusedEigenvectorCentrality(graph, detectedWallets) {
    const nodes = Array.from(detectedWallets).filter(wallet => graph.has(wallet));
    const n = nodes.length;
    
    if (n === 0) return new Map();
    
    // Initialize eigenvector with uniform distribution
    let eigenvector = new Map();
    const initialValue = 1.0 / Math.sqrt(n);
    nodes.forEach(node => eigenvector.set(node, initialValue));
    
    let iteration = 0;
    let hasConverged = false;
    
    while (iteration < this.MAX_ITERATIONS && !hasConverged) {
      const newEigenvector = new Map();
      let eigenvalue = 0;
      
      // Matrix-vector multiplication: Ax = λx
      for (const node of nodes) {
        let sum = 0;
        const neighbors = graph.get(node) || new Set();
        
        for (const neighbor of neighbors) {
          if (detectedWallets.has(neighbor)) {
            const weight = this.getEdgeWeight(node, neighbor);
            sum += weight * eigenvector.get(neighbor);
          }
        }
        
        newEigenvector.set(node, sum);
        eigenvalue += sum * sum; // For normalization
      }
      
      // Normalize eigenvector (L2 norm)
      eigenvalue = Math.sqrt(eigenvalue);
      if (eigenvalue > this.EPSILON) {
        for (const [node, value] of newEigenvector) {
          newEigenvector.set(node, value / eigenvalue);
        }
      }
      
      // Check convergence
      hasConverged = this.checkConvergence(eigenvector, newEigenvector);
      eigenvector = newEigenvector;
      iteration++;
    }
    
    return eigenvector;

  }

    calculateFocusedDegreeCentrality(graph, detectedWallets) {
    const centralities = new Map();
    const totalDetectedWallets = detectedWallets.size;
    
    if (totalDetectedWallets <= 1) {
      for (const wallet of detectedWallets) {
        centralities.set(wallet, 0);
      }
      return centralities;
    }
    
    for (const wallet of detectedWallets) {
      if (!graph.has(wallet)) {
        centralities.set(wallet, 0);
        continue;
      }
      
      const connections = graph.get(wallet);
      let weightedDegree = 0;
      let smartWalletConnections = 0;
      
      for (const neighbor of connections) {
        const edgeKey = this.getEdgeKey(wallet, neighbor);
        const weight = this.transactionWeights.get(edgeKey) || 0;
        
        if (weight >= this.networkThresholds.MIN_CONNECTION_STRENGTH) {
          weightedDegree += Math.log(1 + weight);
          
          // Bonus for connections to other detected smart wallets
          if (detectedWallets.has(neighbor)) {
            smartWalletConnections++;
            weightedDegree += Math.log(1 + weight) * 0.5; // 50% bonus for smart-to-smart
          }
        }
      }
      
      // Normalize by potential connections within detected wallet set
      const normalizedCentrality = weightedDegree / (totalDetectedWallets - 1);
      centralities.set(wallet, normalizedCentrality);
    }
    
    return centralities;
  }

  calculateBetweennessCentrality(graph) {
    const centralities = new Map();
    const nodes = Array.from(graph.keys());
    
    // Initialize all centralities to 0
    nodes.forEach(node => centralities.set(node, 0));
    
    if (nodes.length <= 2) return centralities;
    
    // Brandes algorithm for weighted graphs
    for (const source of nodes) {
      const result = this.singleSourceShortestPaths(graph, source);
      const { predecessors, distances, sigma } = result;
      
      // Dependency accumulation
      const delta = new Map();
      nodes.forEach(node => delta.set(node, 0));
      
      // Sort nodes by distance (decreasing)
      const sortedNodes = nodes
        .filter(node => node !== source)
        .sort((a, b) => distances.get(b) - distances.get(a));
      
      for (const w of sortedNodes) {
        for (const v of predecessors.get(w)) {
          const contribution = (sigma.get(v) / sigma.get(w)) * (1 + delta.get(w));
          delta.set(v, delta.get(v) + contribution);
        }
        centralities.set(w, centralities.get(w) + delta.get(w));
      }
    }
    
    // Normalize - divide by (n-1)(n-2) for undirected graphs
    const n = nodes.length;
    const normalizationFactor = (n - 1) * (n - 2);
    
    if (normalizationFactor > 0) {
      for (const [node, centrality] of centralities) {
        centralities.set(node, centrality / normalizationFactor);
      }
    }
    
    return centralities;
  }

  singleSourceShortestPaths(graph, source) {
    const nodes = Array.from(graph.keys());
    const predecessors = new Map();
    const distances = new Map();
    const sigma = new Map(); // number of shortest paths
    
    // Initialize
    nodes.forEach(node => {
      predecessors.set(node, []);
      distances.set(node, Infinity);
      sigma.set(node, 0);
    });
    
    distances.set(source, 0);
    sigma.set(source, 1);
    
    // Priority queue for Dijkstra's algorithm
    const queue = new PriorityQueue();
    queue.enqueue(source, 0);
    
    while (!queue.isEmpty()) {
      const current = queue.dequeue();
      const neighbors = graph.get(current.element) || new Set();
      
      for (const neighbor of neighbors) {
        const edgeWeight = this.getEdgeWeight(current.element, neighbor);
        const altDistance = distances.get(current.element) + edgeWeight;
        
        // Shorter path found
        if (altDistance < distances.get(neighbor)) {
          distances.set(neighbor, altDistance);
          sigma.set(neighbor, sigma.get(current.element));
          predecessors.set(neighbor, [current.element]);
          queue.enqueue(neighbor, altDistance);
        }
        // Equal shortest path found
        else if (Math.abs(altDistance - distances.get(neighbor)) < this.EPSILON) {
          sigma.set(neighbor, sigma.get(neighbor) + sigma.get(current.element));
          predecessors.get(neighbor).push(current.element);
        }
      }
    }
    
    return { predecessors, distances, sigma };
  }

  calculateEigenvectorCentrality(graph) {
    const nodes = Array.from(graph.keys());
    const n = nodes.length;
    
    if (n === 0) return new Map();
    
    // Initialize eigenvector with uniform distribution
    let eigenvector = new Map();
    const initialValue = 1.0 / Math.sqrt(n);
    nodes.forEach(node => eigenvector.set(node, initialValue));
    
    let iteration = 0;
    let hasConverged = false;
    
    while (iteration < this.MAX_ITERATIONS && !hasConverged) {
      const newEigenvector = new Map();
      let eigenvalue = 0;
      
      // Matrix-vector multiplication: Ax = λx
      for (const node of nodes) {
        let sum = 0;
        const neighbors = graph.get(node) || new Set();
        
        for (const neighbor of neighbors) {
          const weight = this.getEdgeWeight(node, neighbor);
          sum += weight * eigenvector.get(neighbor);
        }
        
        newEigenvector.set(node, sum);
        eigenvalue += sum * sum; // For normalization
      }
      
      // Normalize eigenvector (L2 norm)
      eigenvalue = Math.sqrt(eigenvalue);
      if (eigenvalue > this.EPSILON) {
        for (const [node, value] of newEigenvector) {
          newEigenvector.set(node, value / eigenvalue);
        }
      }
      
      // Check convergence
      hasConverged = this.checkConvergence(eigenvector, newEigenvector);
      eigenvector = newEigenvector;
      iteration++;
    }
    
    return eigenvector;
  }

  // =============================================================================
  // NETWORK EFFECTS ANALYSIS
  // =============================================================================

  calculateNetworkEffects(network, centralityScores, detectedWallets) {
    const walletSet = new Set(detectedWallets);
    
    // 1. Calculate clustering coefficient for detected wallets
    const clusteringCoefficient = this.calculateNetworkClustering(network, walletSet);
    
    // 2. Identify network components and their sizes
    const components = this.findNetworkComponents(network, walletSet);
    
    // 3. Calculate influence propagation paths
    const influencePaths = this.calculateInfluencePropagation(network, centralityScores, walletSet);
    
    // 4. Measure network cohesion
    const cohesionMetrics = this.calculateNetworkCohesion(network, walletSet);
    
    // 5. Detect network patterns (hubs, bridges, clusters)
    const networkPatterns = this.detectNetworkPatterns(network, centralityScores, walletSet);
    
    return {
      clusteringCoefficient: clusteringCoefficient,
      components: components,
      influencePaths: influencePaths,
      cohesion: cohesionMetrics,
      patterns: networkPatterns,
      totalWallets: walletSet.size,
      connectedWallets: Array.from(network.keys()).filter(w => walletSet.has(w)).length
    };
  }

  calculateNetworkClustering(network, detectedWallets) {
    let totalClustering = 0;
    let validWallets = 0;
    
    for (const wallet of detectedWallets) {
      if (!network.has(wallet)) continue;
      
      const neighbors = Array.from(network.get(wallet)).filter(n => detectedWallets.has(n));
      const neighborCount = neighbors.length;
      
      if (neighborCount < 2) continue; // Need at least 2 neighbors for clustering
      
      // Count triangles (connections between neighbors)
      let triangles = 0;
      for (let i = 0; i < neighbors.length; i++) {
        for (let j = i + 1; j < neighbors.length; j++) {
          const neighbor1 = neighbors[i];
          const neighbor2 = neighbors[j];
          
          if (network.has(neighbor1) && network.get(neighbor1).has(neighbor2)) {
            // Check if connection is strong enough
            const edgeKey = this.getEdgeKey(neighbor1, neighbor2);
            const weight = this.transactionWeights.get(edgeKey) || 0;
            if (weight >= this.networkThresholds.MIN_CONNECTION_STRENGTH) {
              triangles++;
            }
          }
        }
      }
      
      // Clustering coefficient = actual triangles / possible triangles
      const possibleTriangles = (neighborCount * (neighborCount - 1)) / 2;
      const clusteringCoeff = possibleTriangles > 0 ? triangles / possibleTriangles : 0;
      
      totalClustering += clusteringCoeff;
      validWallets++;
    }
    
    return validWallets > 0 ? totalClustering / validWallets : 0;
  }

  findNetworkComponents(network, detectedWallets) {
    const visited = new Set();
    const components = [];
    
    for (const wallet of detectedWallets) {
      if (visited.has(wallet) || !network.has(wallet)) continue;
      
      // BFS to find connected component
      const component = new Set();
      const queue = [wallet];
      
      while (queue.length > 0) {
        const current = queue.shift();
        if (visited.has(current)) continue;
        
        visited.add(current);
        component.add(current);
        
        const neighbors = network.get(current) || new Set();
        for (const neighbor of neighbors) {
          if (detectedWallets.has(neighbor) && !visited.has(neighbor)) {
            // Check connection strength
            const edgeKey = this.getEdgeKey(current, neighbor);
            const weight = this.transactionWeights.get(edgeKey) || 0;
            if (weight >= this.networkThresholds.MIN_CONNECTION_STRENGTH) {
              queue.push(neighbor);
            }
          }
        }
      }
      
      if (component.size >= this.networkThresholds.MIN_CLUSTER_SIZE) {
        components.push({
          size: component.size,
          wallets: Array.from(component),
          density: this.calculateComponentDensity(network, component)
        });
      }
    }
    
    return components.sort((a, b) => b.size - a.size); // Sort by size desc
  }

  calculateInfluencePropagation(network, centralityScores, detectedWallets) {
    const influence = new Map();
    
    // Initialize influence based on centrality scores
    for (const wallet of detectedWallets) {
      const centrality = centralityScores.get(wallet) || 0;
      influence.set(wallet, centrality);
    }
    
    // Propagate influence for 3 iterations (diminishing returns after)
    for (let iteration = 0; iteration < 3; iteration++) {
      const newInfluence = new Map(influence);
      
      for (const wallet of detectedWallets) {
        if (!network.has(wallet)) continue;
        
        const neighbors = network.get(wallet);
        let receivedInfluence = 0;
        
        for (const neighbor of neighbors) {
          if (detectedWallets.has(neighbor)) {
            const edgeKey = this.getEdgeKey(wallet, neighbor);
            const weight = this.transactionWeights.get(edgeKey) || 0;
            
            if (weight >= this.networkThresholds.MIN_CONNECTION_STRENGTH) {
              const neighborInfluence = influence.get(neighbor) || 0;
              const decay = Math.exp(-this.networkThresholds.INFLUENCE_DECAY_RATE * iteration);
              receivedInfluence += neighborInfluence * decay * Math.log(1 + weight) * 0.1;
            }
          }
        }
        
        const currentInfluence = influence.get(wallet) || 0;
        newInfluence.set(wallet, currentInfluence + receivedInfluence);
      }
      
      influence.clear();
      for (const [wallet, inf] of newInfluence) {
        influence.set(wallet, inf);
      }
    }
    
    return influence;
  }

  calculateNetworkCohesion(network, detectedWallets) {
    const totalWallets = detectedWallets.size;
    let totalConnections = 0;
    let strongConnections = 0;
    let totalWeight = 0;
    
    for (const wallet of detectedWallets) {
      if (!network.has(wallet)) continue;
      
      const neighbors = network.get(wallet);
      for (const neighbor of neighbors) {
        if (detectedWallets.has(neighbor) && wallet < neighbor) { // Count each edge once
          const edgeKey = this.getEdgeKey(wallet, neighbor);
          const weight = this.transactionWeights.get(edgeKey) || 0;
          
          totalConnections++;
          totalWeight += weight;
          
          if (weight >= this.networkThresholds.MIN_CONNECTION_STRENGTH * 2) {
            strongConnections++;
          }
        }
      }
    }
    
    const maxPossibleConnections = (totalWallets * (totalWallets - 1)) / 2;
    const density = maxPossibleConnections > 0 ? totalConnections / maxPossibleConnections : 0;
    const strongConnectionRatio = totalConnections > 0 ? strongConnections / totalConnections : 0;
    const avgWeight = totalConnections > 0 ? totalWeight / totalConnections : 0;
    
    return {
      density: density,
      strongConnectionRatio: strongConnectionRatio,
      avgWeight: avgWeight,
      totalConnections: totalConnections,
      cohesionScore: (density * 0.4) + (strongConnectionRatio * 0.4) + (Math.min(avgWeight / 1000, 1.0) * 0.2)
    };
  }

  detectNetworkPatterns(network, centralityScores, detectedWallets) {
    const patterns = {
      hubs: [],        // High-degree nodes
      bridges: [],     // High-betweenness nodes
      influencers: [], // High-eigenvector nodes
      isolates: []     // Low-connection nodes
    };
    
    // Calculate thresholds based on distribution
    const centralityValues = Array.from(centralityScores.values());
    if (centralityValues.length === 0) return patterns;
    
    centralityValues.sort((a, b) => b - a);
    const top25Percentile = centralityValues[Math.floor(centralityValues.length * 0.25)] || 0;
    const bottom25Percentile = centralityValues[Math.floor(centralityValues.length * 0.75)] || 0;
    
    for (const wallet of detectedWallets) {
      const centrality = centralityScores.get(wallet) || 0;
      const connections = network.has(wallet) ? network.get(wallet).size : 0;
      
      if (centrality >= top25Percentile) {
        if (connections >= 5) {
          patterns.hubs.push({ wallet, centrality, connections });
        }
        patterns.influencers.push({ wallet, centrality, connections });
      } else if (centrality <= bottom25Percentile || connections <= 1) {
        patterns.isolates.push({ wallet, centrality, connections });
      }
    }
    
    return patterns;
  }

  calculateComponentDensity(network, component) {
    const wallets = Array.from(component);
    let edges = 0;
    
    for (let i = 0; i < wallets.length; i++) {
      for (let j = i + 1; j < wallets.length; j++) {
        const wallet1 = wallets[i];
        const wallet2 = wallets[j];
        
        if (network.has(wallet1) && network.get(wallet1).has(wallet2)) {
          const edgeKey = this.getEdgeKey(wallet1, wallet2);
          const weight = this.transactionWeights.get(edgeKey) || 0;
          if (weight >= this.networkThresholds.MIN_CONNECTION_STRENGTH) {
            edges++;
          }
        }
      }
    }
    
    const maxPossibleEdges = (wallets.length * (wallets.length - 1)) / 2;
    return maxPossibleEdges > 0 ? edges / maxPossibleEdges : 0;
  }

  extractWalletFeatures(walletAddress, historicalData, centralityScore) {
    const trades = historicalData.trades || [];
    const holdings = historicalData.holdings || [];
    
    if (trades.length === 0) {
      // Handle no-data case with prior-only classification
      return {
        roi_6mo: 0,
        win_rate: 0.5,
        avg_hold_time: 24,
        portfolio_diversity: 1,
        network_centrality: centralityScore || 0,
        sampleSize: 0,
        hasData: false
      };
    }
    
    // ROI calculation (6-month rolling)
    const roi6mo = this.calculateROI(trades, 180); // 180 days
    
    // Win rate calculation
    const winRate = this.calculateWinRate(trades);
    
    // Average holding time (hours)
    const avgHoldTime = this.calculateAverageHoldTime(holdings);
    
    // Portfolio diversity (Shannon entropy)
    const portfolioDiversity = this.calculateShannonDiversity(holdings);
    
    return {
      roi_6mo: roi6mo,
      win_rate: winRate,
      avg_hold_time: avgHoldTime,
      portfolio_diversity: portfolioDiversity,
      network_centrality: centralityScore || 0,
      sampleSize: trades.length,
      hasData: true
    };
  }

  calculateLogPosteriorProbabilities(features) {
    const classes = ['smart', 'average', 'poor'];
    const logPosteriors = new Map();
    
    for (const walletClass of classes) {
      // Log prior probability
      const logPrior = Math.log(this.bayesianParams.priors[walletClass] || 0.33);
      
      // Log likelihood calculation
      let logLikelihood = 0;
      
      // Only calculate likelihood if we have actual data
      if (features.hasData && features.sampleSize > 0) {
        logLikelihood = this.calculateLogLikelihood(features, walletClass);
      }
      
      // Log posterior = log prior + log likelihood
      logPosteriors.set(walletClass, logPrior + logLikelihood);
    }
    
    return logPosteriors;
  }

  calculateLogLikelihood(features, walletClass) {
    let logLikelihood = 0;
    
    // Iterate through each feature and calculate log-normal PDF
    const featureNames = ['roi_6mo', 'win_rate', 'avg_hold_time', 'network_centrality'];
    
    for (const featureName of featureNames) {
      const featureValue = features[featureName];
      const params = this.bayesianParams.likelihoods[featureName];
      
      if (params && params[walletClass]) {
        const { mu, sigma } = params[walletClass];
        
        // Log-normal probability density function
        const logPdf = this.calculateLogNormalPDF(featureValue, mu, sigma);
        logLikelihood += logPdf;
      }
    }
    
    // Add portfolio diversity with exponential likelihood
    const diversityLogLikelihood = this.calculateDiversityLogLikelihood(
      features.portfolio_diversity, 
      walletClass
    );
    logLikelihood += diversityLogLikelihood;
    
    return logLikelihood;
  }

  calculateLogNormalPDF(x, mu, sigma) {
    // Avoid log(0) by adding small epsilon
    const adjustedX = Math.max(x, this.EPSILON);
    
    // Log-normal PDF: ln(f(x)) = -ln(x) - ln(σ√(2π)) - (ln(x) - μ)²/(2σ²)
    const logX = Math.log(adjustedX);
    const logSigma = Math.log(sigma);
    const logTwoPi = Math.log(2 * Math.PI);
    
    const logPdf = -logX - logSigma - 0.5 * logTwoPi - 
                   Math.pow(logX - mu, 2) / (2 * sigma * sigma);
    
    return logPdf;
  }

  calculateDiversityLogLikelihood(diversity, walletClass) {
    // Exponential distribution for portfolio diversity
    const lambdaParams = {
      smart: 0.5,    // λ = 0.5 (higher diversity)
      average: 1.0,  // λ = 1.0 (medium diversity)
      poor: 2.0      // λ = 2.0 (lower diversity)
    };
    
    const lambda = lambdaParams[walletClass] || 1.0;
    
    // Log-exponential PDF: ln(f(x)) = ln(λ) - λx
    return Math.log(lambda) - lambda * diversity;
  }

  normalizeLogProbabilities(logPosteriors) {
    // Find maximum log probability for numerical stability
    const maxLogProb = Math.max(...Array.from(logPosteriors.values()));
    
    // Subtract max and exponentiate
    const unnormalizedProbs = new Map();
    let totalProb = 0;
    
    for (const [walletClass, logProb] of logPosteriors) {
      const prob = Math.exp(logProb - maxLogProb);
      unnormalizedProbs.set(walletClass, prob);
      totalProb += prob;
    }
    
    // Normalize to sum to 1
    const normalizedProbs = new Map();
    for (const [walletClass, prob] of unnormalizedProbs) {
      normalizedProbs.set(walletClass, prob / totalProb);
    }
    
    return normalizedProbs;
  }

  // =============================================================================
  // SMART MONEY SIGNAL CALCULATION
  // =============================================================================

  calculateSmartMoneySignal(walletClassifications, tokenAddress) {
    let totalWeight = 0;
    let smartWeight = 0;
    let smartCount = 0;
    let totalCount = 0;
    
    for (const [walletAddress, classification] of walletClassifications) {
      const smartProb = classification.probabilities.get('smart') || 0;
      const confidence = classification.confidence.score || 0;
      const isSignificant = classification.significance.isSignificant;
      
      // Weight by confidence and significance
      const weight = confidence * (isSignificant ? 1.0 : 0.5);
      
      totalWeight += weight;
      smartWeight += smartProb * weight;
      totalCount++;
      
      if (smartProb > 0.6) smartCount++;
    }
    
    if (totalWeight === 0) {
      return {
        score: 0,
        confidence: 0,
        smartWalletRatio: 0,
        significantWallets: 0,
        totalWallets: totalCount
      };
    }
    
    // Weighted average smart money probability
    const weightedSmartProb = smartWeight / totalWeight;
    
    // Smart wallet ratio (simple count)
    const smartRatio = totalCount > 0 ? smartCount / totalCount : 0;
    
    // Combined signal with network effects
    const networkEffect = this.calculateNetworkEffect(walletClassifications);
    const baseSignal = (weightedSmartProb * 0.7) + (smartRatio * 0.3);
    const finalSignal = baseSignal * (1 + networkEffect);
    
    // Confidence based on sample size and significance
    const significantCount = Array.from(walletClassifications.values())
      .filter(c => c.significance.isSignificant).length;
    
    const confidence = this.calculateSignalConfidence(
      totalCount, 
      significantCount, 
      weightedSmartProb
    );
    
    return {
      score: Math.min(1.0, Math.max(0.0, finalSignal)),
      confidence: confidence,
      smartWalletRatio: smartRatio,
      significantWallets: significantCount,
      totalWallets: totalCount,
      networkEffect: networkEffect,
      weightedSmartProb: weightedSmartProb
    };
  }

  calculateNetworkEffect(walletClassifications) {
    // Network effect: smart wallets connected to other smart wallets
    let networkEffect = 0;
    let connections = 0;
    
    for (const [wallet1, classification1] of walletClassifications) {
      const smart1 = classification1.probabilities.get('smart') || 0;
      
      if (smart1 > 0.6) { // Consider as smart wallet
        const neighbors = this.walletGraph.get(wallet1) || new Set();
        
        for (const wallet2 of neighbors) {
          const classification2 = walletClassifications.get(wallet2);
          if (classification2) {
            const smart2 = classification2.probabilities.get('smart') || 0;
            
            if (smart2 > 0.6) {
              const edgeWeight = this.getEdgeWeight(wallet1, wallet2);
              networkEffect += edgeWeight * smart1 * smart2;
              connections++;
            }
          }
        }
      }
    }
    
    return connections > 0 ? networkEffect / connections : 0;
  }

  calculateSignalConfidence(totalWallets, significantWallets, smartProb) {
    // Confidence based on sample size, significance, and effect size
    const sampleSizeConfidence = Math.min(1.0, totalWallets / 50); // 50+ wallets = full confidence
    const significanceConfidence = totalWallets > 0 ? significantWallets / totalWallets : 0;
    const effectSizeConfidence = Math.abs(smartProb - 0.03) / 0.97; // Distance from prior
    
    return (sampleSizeConfidence * 0.4) + 
           (significanceConfidence * 0.4) + 
           (effectSizeConfidence * 0.2);
  }

  // =============================================================================
  // STATISTICAL SIGNIFICANCE TESTING
  // =============================================================================

  calculateSignalSignificance(smartMoneySignal, walletClassifications) {
    const smartWallets = Array.from(walletClassifications.values())
      .filter(c => c.probabilities.get('smart') > 0.6);
    
    const observedCount = smartWallets.length;
    const totalCount = walletClassifications.size;
    const expectedCount = totalCount * 0.03; // 3% prior
    
    // Chi-square test for goodness of fit
    const chiSquare = totalCount > 0 ? 
      Math.pow(observedCount - expectedCount, 2) / expectedCount : 0;
    
    // Degrees of freedom = 1 for binomial test
    const pValue = this.chiSquarePValue(chiSquare, 1);
    
    // Effect size (Cohen's h for proportions)
    const observedProp = totalCount > 0 ? observedCount / totalCount : 0;
    const expectedProp = 0.03;
    const cohenH = 2 * (Math.asin(Math.sqrt(observedProp)) - Math.asin(Math.sqrt(expectedProp)));
    
    return {
      chiSquare: chiSquare,
      pValue: pValue,
      isSignificant: pValue < 0.05,
      effectSize: cohenH,
      observedCount: observedCount,
      expectedCount: expectedCount,
      totalSample: totalCount
    };
  }

  chiSquarePValue(chiSquare, degreesOfFreedom) {
    // Approximate p-value for chi-square distribution (df=1)
    if (degreesOfFreedom === 1) {
      if (chiSquare >= 10.83) return 0.001;
      if (chiSquare >= 6.63) return 0.01;
      if (chiSquare >= 3.84) return 0.05;
      if (chiSquare >= 2.71) return 0.10;
      return 0.20;
    }
    
    // For other df values, use rough approximation
    return Math.max(0.001, Math.exp(-chiSquare / 2));
  }

  singleSourceShortestPaths(graph, source) {
    const nodes = Array.from(graph.keys());
    const predecessors = new Map();
    const distances = new Map();
    const sigma = new Map(); // number of shortest paths
    
    // Initialize
    nodes.forEach(node => {
      predecessors.set(node, []);
      distances.set(node, Infinity);
      sigma.set(node, 0);
    });
    
    distances.set(source, 0);
    sigma.set(source, 1);
    
    // Priority queue for Dijkstra's algorithm
    const queue = new PriorityQueue();
    queue.enqueue(source, 0);
    
    while (!queue.isEmpty()) {
      const current = queue.dequeue();
      const neighbors = graph.get(current.element) || new Set();
      
      for (const neighbor of neighbors) {
        const edgeWeight = this.getEdgeWeight(current.element, neighbor);
        const altDistance = distances.get(current.element) + edgeWeight;
        
        // Shorter path found
        if (altDistance < distances.get(neighbor)) {
          distances.set(neighbor, altDistance);
          sigma.set(neighbor, sigma.get(current.element));
          predecessors.set(neighbor, [current.element]);
          queue.enqueue(neighbor, altDistance);
        }
        // Equal shortest path found
        else if (Math.abs(altDistance - distances.get(neighbor)) < this.EPSILON) {
          sigma.set(neighbor, sigma.get(neighbor) + sigma.get(current.element));
          predecessors.get(neighbor).push(current.element);
        }
      }
    }
    
    return { predecessors, distances, sigma };
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  async fetchWalletHistory(walletAddress) {
    // Check cache first
    if (this.walletHistory.has(walletAddress)) {
      return this.walletHistory.get(walletAddress);
    }
    
    // In production, this would fetch from Helius/Chainstack
    // For now, return simulated data structure
    const mockData = {
      trades: this.generateMockTrades(walletAddress),
      holdings: this.generateMockHoldings(walletAddress)
    };
    
    this.walletHistory.set(walletAddress, mockData);
    return mockData;
  }

  generateMockTrades(walletAddress) {
    // Generate realistic mock data for testing
    const tradeCount = Math.floor(Math.random() * 50) + 5;
    const trades = [];
    
    for (let i = 0; i < tradeCount; i++) {
      const timestamp = Date.now() - (Math.random() * 180 * 24 * 60 * 60 * 1000); // Last 180 days
      const amountIn = Math.random() * 10000 + 100;
      const success = Math.random() > 0.4; // 60% success rate
      const amountOut = success ? amountIn * (1 + Math.random() * 2) : amountIn * Math.random() * 0.8;
      
      trades.push({
        timestamp: timestamp,
        amountIn: amountIn,
        amountOut: amountOut,
        tokenAddress: `token_${Math.floor(Math.random() * 1000)}`,
        success: success
      });
    }
    
    return trades;
  }

  generateMockHoldings(walletAddress) {
    const holdingCount = Math.floor(Math.random() * 20) + 3;
    const holdings = [];
    
    for (let i = 0; i < holdingCount; i++) {
      const buyTime = Date.now() - (Math.random() * 90 * 24 * 60 * 60 * 1000); // Last 90 days
      const sellTime = Math.random() > 0.3 ? buyTime + (Math.random() * 30 * 24 * 60 * 60 * 1000) : null;
      
      holdings.push({
        tokenAddress: `token_${Math.floor(Math.random() * 1000)}`,
        buyTime: buyTime,
        sellTime: sellTime,
        value: Math.random() * 5000 + 100
      });
    }
    
    return holdings;
  }

  calculateROI(trades, days) {
    const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    const relevantTrades = trades.filter(trade => trade.timestamp > cutoffDate);
    
    if (relevantTrades.length === 0) return 0;
    
    const totalInvested = relevantTrades.reduce((sum, trade) => sum + trade.amountIn, 0);
    const totalReturned = relevantTrades.reduce((sum, trade) => sum + trade.amountOut, 0);
    
    if (totalInvested === 0) return 0;
    
    return (totalReturned - totalInvested) / totalInvested;
  }

  calculateWinRate(trades) {
    if (trades.length === 0) return 0.5; // Neutral prior
    
    const winningTrades = trades.filter(trade => trade.amountOut > trade.amountIn);
    return winningTrades.length / trades.length;
  }

  calculateAverageHoldTime(holdings) {
    if (holdings.length === 0) return 24; // Default 24 hours
    
    const holdTimes = holdings.map(holding => {
      const holdDuration = (holding.sellTime || Date.now()) - holding.buyTime;
      return holdDuration / (1000 * 60 * 60); // Convert to hours
    });
    
    return holdTimes.reduce((sum, time) => sum + time, 0) / holdTimes.length;
  }

  calculateShannonDiversity(holdings) {
    if (holdings.length === 0) return 0;
    
    // Calculate proportions by value
    const totalValue = holdings.reduce((sum, holding) => sum + holding.value, 0);
    if (totalValue === 0) return 0;
    
    const proportions = holdings.map(holding => holding.value / totalValue);
    
    // Shannon entropy: H = -Σ(p_i * log(p_i))
    let entropy = 0;
    for (const p of proportions) {
      if (p > 0) {
        entropy -= p * Math.log(p);
      }
    }
    
    return entropy;
  }

  getEdgeKey(wallet1, wallet2) {
    return wallet1 < wallet2 ? `${wallet1}:${wallet2}` : `${wallet2}:${wallet1}`;
  }
  
  getEdgeWeight(wallet1, wallet2) {
    const edgeKey = this.getEdgeKey(wallet1, wallet2);
    const rawWeight = this.transactionWeights.get(edgeKey) || 1;
    
    // Log transformation for heavy-tailed transaction distributions
    return Math.log(1 + rawWeight);
  }

  checkConvergence(oldVector, newVector) {
    let maxDifference = 0;
    
    for (const [node, newValue] of newVector) {
      const oldValue = oldVector.get(node) || 0;
      const difference = Math.abs(newValue - oldValue);
      maxDifference = Math.max(maxDifference, difference);
    }
    
    return maxDifference < this.CONVERGENCE_THRESHOLD;
  }

  statisticallyNormalize(scores) {
    const values = Array.from(scores.values());
    
    if (values.length === 0) return new Map();
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    const normalizedScores = new Map();
    
    if (stdDev > this.EPSILON) {
      for (const [node, score] of scores) {
        const zScore = (score - mean) / stdDev;
        normalizedScores.set(node, zScore);
      }
    } else {
      // All scores are identical
      for (const [node] of scores) {
        normalizedScores.set(node, 0);
      }
    }
    
    return normalizedScores;
  }

  calculateClassificationSignificance(posteriors) {
    const smartProb = posteriors.get('smart') || 0;
    const averageProb = posteriors.get('average') || 0;
    
    // Calculate Bayes factor: P(smart|data) / P(average|data)
    const bayesFactor = smartProb / Math.max(averageProb, this.EPSILON);
    
    // Jeffrey's scale interpretation
    let significance = 'weak';
    if (bayesFactor > 100) significance = 'decisive';
    else if (bayesFactor > 30) significance = 'very_strong';
    else if (bayesFactor > 10) significance = 'strong';
    else if (bayesFactor > 3) significance = 'substantial';
    
    return {
      bayesFactor: bayesFactor,
      scale: significance,
      pValue: this.bayesFactorToPValue(bayesFactor),
      isSignificant: bayesFactor > 3.0 // Substantial evidence threshold
    };
  }

  calculateBayesianConfidence(posteriors, sampleSize) {
    const smartProb = posteriors.get('smart') || 0;
    
    // Beta distribution parameters for confidence interval
    const alpha = 0.5 + (sampleSize * smartProb);
    const beta = 0.5 + (sampleSize * (1 - smartProb));
    
    // 95% credible interval using beta quantiles
    const credibleInterval = this.betaCredibleInterval(alpha, beta, 0.95);
    
    // Confidence score based on interval width
    const intervalWidth = credibleInterval.upper - credibleInterval.lower;
    const confidence = Math.max(0, 1 - intervalWidth);
    
    return {
      score: confidence,
      credibleInterval: credibleInterval,
      effectiveSize: sampleSize,
      alpha: alpha,
      beta: beta
    };
  }

  getMaximumAPosterioriClass(posteriors) {
    let maxProb = 0;
    let maxClass = 'average';
    
    for (const [walletClass, prob] of posteriors) {
      if (prob > maxProb) {
        maxProb = prob;
        maxClass = walletClass;
      }
    }
    
    return {
      class: maxClass,
      probability: maxProb,
      threshold: maxProb > 0.6 // Minimum confidence threshold
    };
  }

  betaCredibleInterval(alpha, beta, confidence) {
    // Approximate beta quantiles using normal approximation
    const mean = alpha / (alpha + beta);
    const variance = (alpha * beta) / (Math.pow(alpha + beta, 2) * (alpha + beta + 1));
    const stdDev = Math.sqrt(variance);
    
    const zScore = this.getZScore((1 + confidence) / 2);
    const margin = zScore * stdDev;
    
    return {
      lower: Math.max(0, mean - margin),
      upper: Math.min(1, mean + margin),
      mean: mean
    };
  }

  getZScore(probability) {
    // Approximate inverse normal CDF
    const zScores = {
      0.975: 1.96,  // 95% confidence
      0.995: 2.58,  // 99% confidence
      0.9995: 3.29  // 99.9% confidence
    };
    
    return zScores[probability] || 1.96;
  }

  bayesFactorToPValue(bayesFactor) {
    // Approximate conversion from Bayes factor to p-value
    if (bayesFactor < 1) return 0.5;
    return Math.max(0.001, 1 / bayesFactor);
  }

  calculateNetworkMetrics(network) {
    const nodes = network.size;
    const edges = Array.from(network.values()).reduce((sum, neighbors) => sum + neighbors.size, 0) / 2;
    const density = nodes > 1 ? (2 * edges) / (nodes * (nodes - 1)) : 0;
    
    return {
      nodeCount: nodes,
      edgeCount: edges,
      density: density,
      avgDegree: nodes > 0 ? (2 * edges) / nodes : 0
    };
  }

  createEmptySignalResult(reason) {
    return {
      signal: {
        score: 0,
        confidence: 0,
        smartWalletRatio: 0,
        significantWallets: 0,
        totalWallets: 0
      },
      significance: {
        isSignificant: false,
        pValue: 1.0,
        reason: reason
      },
      walletClassifications: [],
      networkMetrics: { nodeCount: 0, edgeCount: 0, density: 0, avgDegree: 0 },
      performance: this.performanceMetrics
    };
  
  }

  calculateNetworkConfidenceSupplement(networkEffects) {
    const baseConfidence = networkEffects.clusteringCoefficient * 100;
    const cohesionBoost = networkEffects.cohesion.cohesionScore * 20;
    const componentBoost = networkEffects.components.length > 0 ? 
      Math.min(15, networkEffects.components[0].size * 3) : 0;
    
    const totalConfidence = baseConfidence + cohesionBoost + componentBoost;
    
    return Math.min(this.networkThresholds.MAX_NETWORK_EFFECT * 100, Math.max(0, totalConfidence));
  }
}

// Priority Queue for Dijkstra's algorithm
class PriorityQueue {
  constructor() {
    this.items = [];
  }
  
  enqueue(element, priority) {
    const queueElement = { element, priority };
    let added = false;
    
    for (let i = 0; i < this.items.length; i++) {
      if (queueElement.priority < this.items[i].priority) {
        this.items.splice(i, 0, queueElement);
        added = true;
        break;
      }
    }
    
    if (!added) {
      this.items.push(queueElement);
    }
  }
  
  dequeue() {
    return this.items.shift();
  }
  
  isEmpty() {
    return this.items.length === 0;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SmartWalletNetworkEffectsAnalyzer };
} else if (typeof window !== 'undefined') {
  window.SmartWalletNetworkEffectsAnalyzer = SmartWalletNetworkEffectsAnalyzer;
}

// ES6 Export for modern import syntax
export { SmartWalletNetworkEffectsAnalyzer };