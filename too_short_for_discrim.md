rafaltracz@Rafals-MacBook-Air thorpv1 % grep -n -A 10 -B 5 "too short for discriminator" ./src/**/*.js
./src/services/liquidity-pool-creation-detector.service 2.js-600-        console.log(`🔍 DEBUG: Instruction ${i} - data type: ${typeof instruction.data}, data: ${instruction.data?.substring ? instruction.data.substring(0, 20) + '...' : JSON.stringify(instruction.data)}`);
./src/services/liquidity-pool-creation-detector.service 2.js-601-        const instructionData = Buffer.from(instruction.data || '', 'base64');
./src/services/liquidity-pool-creation-detector.service 2.js-602-        console.log(`🔍 DEBUG: Instruction data length: ${instructionData.length} bytes`);
./src/services/liquidity-pool-creation-detector.service 2.js-603-        
./src/services/liquidity-pool-creation-detector.service 2.js-604-        if (instructionData.length < 8) {
./src/services/liquidity-pool-creation-detector.service 2.js:605:          console.log(`  ⚠️ Skipping - data too short for discriminator`);
./src/services/liquidity-pool-creation-detector.service 2.js-606-          continue; // Need at least discriminator
./src/services/liquidity-pool-creation-detector.service 2.js-607-        }
./src/services/liquidity-pool-creation-detector.service 2.js-608-        
./src/services/liquidity-pool-creation-detector.service 2.js-609-        // Extract instruction discriminator (first 8 bytes)
./src/services/liquidity-pool-creation-detector.service 2.js-610-        const discriminator = instructionData.slice(0, 8);
./src/services/liquidity-pool-creation-detector.service 2.js-611-        console.log(`🔍 DEBUG: Found discriminator: ${discriminator.toString("hex")} for program ${programId}`);
./src/services/liquidity-pool-creation-detector.service 2.js-612-        
./src/services/liquidity-pool-creation-detector.service 2.js-613-        // Check if this is an LP creation instruction
./src/services/liquidity-pool-creation-detector.service 2.js-614-        const lpCandidate = await this.analyzeBinaryInstruction(
./src/services/liquidity-pool-creation-detector.service 2.js-615-          programId, 
--
./src/services/liquidity-pool-creation-detector.service 3.js-600-        console.log(`🔍 DEBUG: Instruction ${i} - data type: ${typeof instruction.data}, data: ${instruction.data?.substring ? instruction.data.substring(0, 20) + '...' : JSON.stringify(instruction.data)}`);
./src/services/liquidity-pool-creation-detector.service 3.js-601-        const instructionData = Buffer.from(instruction.data || '', 'base64');
./src/services/liquidity-pool-creation-detector.service 3.js-602-        console.log(`🔍 DEBUG: Instruction data length: ${instructionData.length} bytes`);
./src/services/liquidity-pool-creation-detector.service 3.js-603-        
./src/services/liquidity-pool-creation-detector.service 3.js-604-        if (instructionData.length < 8) {
./src/services/liquidity-pool-creation-detector.service 3.js:605:          console.log(`  ⚠️ Skipping - data too short for discriminator`);
./src/services/liquidity-pool-creation-detector.service 3.js-606-          continue; // Need at least discriminator
./src/services/liquidity-pool-creation-detector.service 3.js-607-        }
./src/services/liquidity-pool-creation-detector.service 3.js-608-        
./src/services/liquidity-pool-creation-detector.service 3.js-609-        // Extract instruction discriminator (first 8 bytes)
./src/services/liquidity-pool-creation-detector.service 3.js-610-        const discriminator = instructionData.slice(0, 8);
./src/services/liquidity-pool-creation-detector.service 3.js-611-        console.log(`🔍 DEBUG: Found discriminator: ${discriminator.toString("hex")} for program ${programId}`);
./src/services/liquidity-pool-creation-detector.service 3.js-612-        
./src/services/liquidity-pool-creation-detector.service 3.js-613-        // Check if this is an LP creation instruction
./src/services/liquidity-pool-creation-detector.service 3.js-614-        const lpCandidate = await this.analyzeBinaryInstruction(
./src/services/liquidity-pool-creation-detector.service 3.js-615-          programId, 
--
./src/services/liquidity-pool-creation-detector.service-old.js-717-        // console.log(`🔍 DEBUG: Instruction ${i} - data type: ${typeof instruction.data}, data: ${instruction.data?.substring ? instruction.data.substring(0, 20) + '...' : JSON.stringify(instruction.data)}`);
./src/services/liquidity-pool-creation-detector.service-old.js-718-        const instructionData = Buffer.from(instruction.data || '', 'base64');
./src/services/liquidity-pool-creation-detector.service-old.js-719-        // console.log(`🔍 DEBUG: Instruction data length: ${instructionData.length} bytes`);
./src/services/liquidity-pool-creation-detector.service-old.js-720-        
./src/services/liquidity-pool-creation-detector.service-old.js-721-        if (instructionData.length < 8) {
./src/services/liquidity-pool-creation-detector.service-old.js:722:          console.log(`  ⚠️ Skipping - data too short for discriminator`);
./src/services/liquidity-pool-creation-detector.service-old.js-723-          continue; // Need at least discriminator
./src/services/liquidity-pool-creation-detector.service-old.js-724-        }
./src/services/liquidity-pool-creation-detector.service-old.js-725-        
./src/services/liquidity-pool-creation-detector.service-old.js-726-        // Extract instruction discriminator (first 8 bytes)
./src/services/liquidity-pool-creation-detector.service-old.js-727-        const discriminator = instructionData.slice(0, 8);
./src/services/liquidity-pool-creation-detector.service-old.js-728-        // console.log(`🔍 DEBUG: Found discriminator: ${discriminator.toString("hex")} for program ${programId}`);
./src/services/liquidity-pool-creation-detector.service-old.js-729-        
./src/services/liquidity-pool-creation-detector.service-old.js-730-        // Check if this is an LP creation instruction
./src/services/liquidity-pool-creation-detector.service-old.js-731-        const lpCandidate = await this.analyzeBinaryInstruction(
./src/services/liquidity-pool-creation-detector.service-old.js-732-          programId, 
--
./src/services/liquidity-pool-creation-detector.service.js-884-            console.log(`  📍 Normalized accounts: ${normalizedAccounts}`);
./src/services/liquidity-pool-creation-detector.service.js-885-          }
./src/services/liquidity-pool-creation-detector.service.js-886-        }
./src/services/liquidity-pool-creation-detector.service.js-887-        
./src/services/liquidity-pool-creation-detector.service.js-888-        if (instructionData.length < 8) {
./src/services/liquidity-pool-creation-detector.service.js:889:          console.log(`  ⚠️ Skipping - data too short for discriminator`);
./src/services/liquidity-pool-creation-detector.service.js-890-          continue; // Need at least discriminator
./src/services/liquidity-pool-creation-detector.service.js-891-        }
./src/services/liquidity-pool-creation-detector.service.js-892-        
./src/services/liquidity-pool-creation-detector.service.js-893-        // Extract instruction discriminator (first 8 bytes)
./src/services/liquidity-pool-creation-detector.service.js-894-        const discriminator = instructionData.slice(0, 8);
./src/services/liquidity-pool-creation-detector.service.js-895-        // console.log(`🔍 DEBUG: Found discriminator: ${discriminator.toString("hex")} for program ${programId}`);
./src/services/liquidity-pool-creation-detector.service.js-896-        
./src/services/liquidity-pool-creation-detector.service.js-897-        // Check if this is an LP creation instruction
./src/services/liquidity-pool-creation-detector.service.js-898-        const lpCandidate = await this.analyzeBinaryInstruction(
./src/services/liquidity-pool-creation-detector.service.js-899-          programId, 
rafaltracz@Rafals-MacBook-Air thorpv1 % 
