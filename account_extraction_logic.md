rafaltracz@Rafals-MacBook-Air thorpv1 % grep -n -A 15 "accounts\[1\]" ./src/**/*.js      
./src/scripts-js/data-enricher.js:374:              destination: accountKeys[accounts[1]],
./src/scripts-js/data-enricher.js-375-              authority: accountKeys[accounts[2]]
./src/scripts-js/data-enricher.js-376-            };
./src/scripts-js/data-enricher.js-377-          }
./src/scripts-js/data-enricher.js-378-          break;
./src/scripts-js/data-enricher.js-379-          
./src/scripts-js/data-enricher.js-380-        case 12: // TransferChecked
./src/scripts-js/data-enricher.js-381-          if (buffer.length >= 10) {
./src/scripts-js/data-enricher.js-382-            const amount = this.readUInt64LE(buffer, 1);
./src/scripts-js/data-enricher.js-383-            const decimals = buffer.readUInt8(9);
./src/scripts-js/data-enricher.js-384-            return {
./src/scripts-js/data-enricher.js-385-              type: 'transferChecked',
./src/scripts-js/data-enricher.js-386-              amount: amount.toString(),
./src/scripts-js/data-enricher.js-387-              decimals,
./src/scripts-js/data-enricher.js-388-              source: accountKeys[accounts[0]],
./src/scripts-js/data-enricher.js:389:              mint: accountKeys[accounts[1]],
./src/scripts-js/data-enricher.js-390-              destination: accountKeys[accounts[2]],
./src/scripts-js/data-enricher.js-391-              authority: accountKeys[accounts[3]]
./src/scripts-js/data-enricher.js-392-            };
./src/scripts-js/data-enricher.js-393-          }
./src/scripts-js/data-enricher.js-394-          break;
./src/scripts-js/data-enricher.js-395-          
./src/scripts-js/data-enricher.js-396-        case 7: // MintTo
./src/scripts-js/data-enricher.js-397-          if (buffer.length >= 9) {
./src/scripts-js/data-enricher.js-398-            const amount = this.readUInt64LE(buffer, 1);
./src/scripts-js/data-enricher.js-399-            return {
./src/scripts-js/data-enricher.js-400-              type: 'mintTo',
./src/scripts-js/data-enricher.js-401-              amount: amount.toString(),
./src/scripts-js/data-enricher.js-402-              mint: accountKeys[accounts[0]],
./src/scripts-js/data-enricher.js:403:              destination: accountKeys[accounts[1]],
./src/scripts-js/data-enricher.js-404-              authority: accountKeys[accounts[2]]
./src/scripts-js/data-enricher.js-405-            };
./src/scripts-js/data-enricher.js-406-          }
./src/scripts-js/data-enricher.js-407-          break;
./src/scripts-js/data-enricher.js-408-          
./src/scripts-js/data-enricher.js-409-        case 8: // Burn
./src/scripts-js/data-enricher.js-410-          if (buffer.length >= 9) {
./src/scripts-js/data-enricher.js-411-            const amount = this.readUInt64LE(buffer, 1);
./src/scripts-js/data-enricher.js-412-            return {
./src/scripts-js/data-enricher.js-413-              type: 'burn',
./src/scripts-js/data-enricher.js-414-              amount: amount.toString(),
./src/scripts-js/data-enricher.js-415-              source: accountKeys[accounts[0]],
./src/scripts-js/data-enricher.js:416:              mint: accountKeys[accounts[1]],
./src/scripts-js/data-enricher.js-417-              authority: accountKeys[accounts[2]]
./src/scripts-js/data-enricher.js-418-            };
./src/scripts-js/data-enricher.js-419-          }
./src/scripts-js/data-enricher.js-420-          break;
./src/scripts-js/data-enricher.js-421-          
./src/scripts-js/data-enricher.js-422-        case 0: // InitializeMint
./src/scripts-js/data-enricher.js-423-          return {
./src/scripts-js/data-enricher.js-424-            type: 'initializeMint',
./src/scripts-js/data-enricher.js-425-            mint: accountKeys[accounts[0]],
./src/scripts-js/data-enricher.js-426-            decimals: buffer.length > 1 ? buffer.readUInt8(1) : 0
./src/scripts-js/data-enricher.js-427-          };
./src/scripts-js/data-enricher.js-428-          
./src/scripts-js/data-enricher.js-429-        case 1: // InitializeAccount
./src/scripts-js/data-enricher.js-430-          return {
./src/scripts-js/data-enricher.js-431-            type: 'initializeAccount',
--
./src/scripts-js/data-enricher.js:433:            mint: accountKeys[accounts[1]],
./src/scripts-js/data-enricher.js-434-            owner: accountKeys[accounts[2]]
./src/scripts-js/data-enricher.js-435-          };
./src/scripts-js/data-enricher.js-436-      }
./src/scripts-js/data-enricher.js-437-      
./src/scripts-js/data-enricher.js-438-      return {
./src/scripts-js/data-enricher.js-439-        type: 'unknown_spl_token',
./src/scripts-js/data-enricher.js-440-        discriminator,
./src/scripts-js/data-enricher.js-441-        dataLength: buffer.length
./src/scripts-js/data-enricher.js-442-      };
./src/scripts-js/data-enricher.js-443-      
./src/scripts-js/data-enricher.js-444-    } catch (error) {
./src/scripts-js/data-enricher.js-445-      console.warn('SPL Token instruction parsing error:', error);
./src/scripts-js/data-enricher.js-446-      return null;
./src/scripts-js/data-enricher.js-447-    }
./src/scripts-js/data-enricher.js-448-  }
--
./src/scripts-js/data-enricher.js:466:          pool: accountKeys[accounts[1]] || 'unknown',
./src/scripts-js/data-enricher.js-467-          userSource: accountKeys[accounts[16]] || 'unknown',
./src/scripts-js/data-enricher.js-468-          userDestination: accountKeys[accounts[17]] || 'unknown',
./src/scripts-js/data-enricher.js-469-          authority: accountKeys[accounts[18]] || 'unknown'
./src/scripts-js/data-enricher.js-470-        };
./src/scripts-js/data-enricher.js-471-      }
./src/scripts-js/data-enricher.js-472-      
./src/scripts-js/data-enricher.js-473-      if (discriminator.equals(this.instructionDiscriminators.raydium.initialize)) {
./src/scripts-js/data-enricher.js-474-        return {
./src/scripts-js/data-enricher.js-475-          type: 'initialize',
./src/scripts-js/data-enricher.js-476-          dex: 'raydium',
./src/scripts-js/data-enricher.js-477-          pool: accountKeys[accounts[4]] || 'unknown'
./src/scripts-js/data-enricher.js-478-        };
./src/scripts-js/data-enricher.js-479-      }
./src/scripts-js/data-enricher.js-480-      
./src/scripts-js/data-enricher.js-481-      return {
--
./src/services/liquidity-pool-creation-detector.service 2.js:916:        const bondingCurve = accounts[1] ? accountKeys[accounts[1]] : null;
./src/services/liquidity-pool-creation-detector.service 2.js-917-        const creator = accounts[2] ? accountKeys[accounts[2]] : null;
./src/services/liquidity-pool-creation-detector.service 2.js-918-        
./src/services/liquidity-pool-creation-detector.service 2.js-919-        if (!tokenMint || !bondingCurve) {
./src/services/liquidity-pool-creation-detector.service 2.js-920-          console.log(`    ⚠️ Missing required pump.fun accounts`);
./src/services/liquidity-pool-creation-detector.service 2.js-921-          return null;
./src/services/liquidity-pool-creation-detector.service 2.js-922-        }
./src/services/liquidity-pool-creation-detector.service 2.js-923-        
./src/services/liquidity-pool-creation-detector.service 2.js-924-        // Calculate information entropy from reserves data
./src/services/liquidity-pool-creation-detector.service 2.js-925-        const entropyScore = this.calculateInformationEntropy([
./src/services/liquidity-pool-creation-detector.service 2.js-926-          Number(virtualTokenReserves & 0xFFFFFFFFn),
./src/services/liquidity-pool-creation-detector.service 2.js-927-          Number(virtualSolReserves & 0xFFFFFFFFn),
./src/services/liquidity-pool-creation-detector.service 2.js-928-          Number(realTokenReserves & 0xFFFFFFFFn),
./src/services/liquidity-pool-creation-detector.service 2.js-929-          Number(realSolReserves & 0xFFFFFFFFn)
./src/services/liquidity-pool-creation-detector.service 2.js-930-        ]);
./src/services/liquidity-pool-creation-detector.service 2.js-931-        
--
./src/services/liquidity-pool-creation-detector.service 3.js:918:        const bondingCurve = accounts[1] ? accountKeys[accounts[1]] : null;
./src/services/liquidity-pool-creation-detector.service 3.js-919-        const creator = accounts[2] ? accountKeys[accounts[2]] : null;
./src/services/liquidity-pool-creation-detector.service 3.js-920-        
./src/services/liquidity-pool-creation-detector.service 3.js-921-        if (!tokenMint || !bondingCurve) {
./src/services/liquidity-pool-creation-detector.service 3.js-922-          console.log(`    ⚠️ Missing required pump.fun accounts`);
./src/services/liquidity-pool-creation-detector.service 3.js-923-          return null;
./src/services/liquidity-pool-creation-detector.service 3.js-924-        }
./src/services/liquidity-pool-creation-detector.service 3.js-925-        
./src/services/liquidity-pool-creation-detector.service 3.js-926-        // Calculate information entropy from reserves data
./src/services/liquidity-pool-creation-detector.service 3.js-927-        const entropyScore = this.calculateInformationEntropy([
./src/services/liquidity-pool-creation-detector.service 3.js-928-          Number(virtualTokenReserves & 0xFFFFFFFFn),
./src/services/liquidity-pool-creation-detector.service 3.js-929-          Number(virtualSolReserves & 0xFFFFFFFFn),
./src/services/liquidity-pool-creation-detector.service 3.js-930-          Number(realTokenReserves & 0xFFFFFFFFn),
./src/services/liquidity-pool-creation-detector.service 3.js-931-          Number(realSolReserves & 0xFFFFFFFFn)
./src/services/liquidity-pool-creation-detector.service 3.js-932-        ]);
./src/services/liquidity-pool-creation-detector.service 3.js-933-        
--
./src/services/liquidity-pool-creation-detector.service-old.js:1527:        const bondingCurve = accounts[1] || null;
./src/services/liquidity-pool-creation-detector.service-old.js-1528-        const creator = accounts[2] || null;
./src/services/liquidity-pool-creation-detector.service-old.js-1529-        
./src/services/liquidity-pool-creation-detector.service-old.js-1530-        if (!tokenMint || !bondingCurve) {
./src/services/liquidity-pool-creation-detector.service-old.js-1531-          console.log(`    ⚠️ Missing required pump.fun accounts`);
./src/services/liquidity-pool-creation-detector.service-old.js-1532-          return null;
./src/services/liquidity-pool-creation-detector.service-old.js-1533-        }
./src/services/liquidity-pool-creation-detector.service-old.js-1534-        
./src/services/liquidity-pool-creation-detector.service-old.js-1535-        // Calculate information entropy from reserves data
./src/services/liquidity-pool-creation-detector.service-old.js-1536-        const entropyScore = this.calculateInformationEntropy([
./src/services/liquidity-pool-creation-detector.service-old.js-1537-          Number(virtualTokenReserves & 0xFFFFFFFFn),
./src/services/liquidity-pool-creation-detector.service-old.js-1538-          Number(virtualSolReserves & 0xFFFFFFFFn),
./src/services/liquidity-pool-creation-detector.service-old.js-1539-          Number(realTokenReserves & 0xFFFFFFFFn),
./src/services/liquidity-pool-creation-detector.service-old.js-1540-          Number(realSolReserves & 0xFFFFFFFFn)
./src/services/liquidity-pool-creation-detector.service-old.js-1541-        ]);
./src/services/liquidity-pool-creation-detector.service-old.js-1542-        
--
./src/services/liquidity-pool-creation-detector.service.js:1827:          accounts_1: accounts[1], // Variable (token or bonding curve)
./src/services/liquidity-pool-creation-detector.service.js-1828-          accounts_2: accounts[2], // Often "pump" suffixed tokens
./src/services/liquidity-pool-creation-detector.service.js-1829-          accounts_3: accounts[3], // Backup
./src/services/liquidity-pool-creation-detector.service.js-1830-          resolved_accounts: {
./src/services/liquidity-pool-creation-detector.service.js-1831-            account_0: accountKeys[accounts[0]]?.pubkey || accountKeys[accounts[0]],
./src/services/liquidity-pool-creation-detector.service.js:1832:            account_1: accountKeys[accounts[1]]?.pubkey || accountKeys[accounts[1]], 
./src/services/liquidity-pool-creation-detector.service.js-1833-            account_2: accountKeys[accounts[2]]?.pubkey || accountKeys[accounts[2]],
./src/services/liquidity-pool-creation-detector.service.js-1834-            account_3: accountKeys[accounts[3]]?.pubkey || accountKeys[accounts[3]]
./src/services/liquidity-pool-creation-detector.service.js-1835-          }
./src/services/liquidity-pool-creation-detector.service.js-1836-        });
./src/services/liquidity-pool-creation-detector.service.js-1837-        
./src/services/liquidity-pool-creation-detector.service.js-1838-        // Smart account selection logic
./src/services/liquidity-pool-creation-detector.service.js-1839-        const KNOWN_NON_TOKENS = [
./src/services/liquidity-pool-creation-detector.service.js-1840-          '4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf', // Vault
./src/services/liquidity-pool-creation-detector.service.js-1841-          'CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM'  // Bonding curve
./src/services/liquidity-pool-creation-detector.service.js-1842-        ];
./src/services/liquidity-pool-creation-detector.service.js-1843-        
./src/services/liquidity-pool-creation-detector.service.js-1844-        function selectBestTokenAccount(accounts, accountKeys) {
./src/services/liquidity-pool-creation-detector.service.js:1845:          const candidates = [1, 2, 3]; // Try accounts[1], [2], [3] in priority order
./src/services/liquidity-pool-creation-detector.service.js-1846-          
./src/services/liquidity-pool-creation-detector.service.js-1847-          for (const accountIndex of candidates) {
./src/services/liquidity-pool-creation-detector.service.js-1848-            if (!accountKeys[accounts[accountIndex]]) continue;
./src/services/liquidity-pool-creation-detector.service.js-1849-            
./src/services/liquidity-pool-creation-detector.service.js-1850-            const address = typeof accountKeys[accounts[accountIndex]] === 'object' 
./src/services/liquidity-pool-creation-detector.service.js-1851-              ? accountKeys[accounts[accountIndex]].pubkey 
./src/services/liquidity-pool-creation-detector.service.js-1852-              : accountKeys[accounts[accountIndex]];
./src/services/liquidity-pool-creation-detector.service.js-1853-            
./src/services/liquidity-pool-creation-detector.service.js-1854-            // Skip known non-token addresses
./src/services/liquidity-pool-creation-detector.service.js-1855-            if (KNOWN_NON_TOKENS.includes(address)) {
./src/services/liquidity-pool-creation-detector.service.js-1856-              console.log(`    ⚠️ Skipping known non-token at accounts[${accountIndex}]: ${address}`);
./src/services/liquidity-pool-creation-detector.service.js-1857-              continue;
./src/services/liquidity-pool-creation-detector.service.js-1858-            }
./src/services/liquidity-pool-creation-detector.service.js-1859-            
./src/services/liquidity-pool-creation-detector.service.js-1860-            // Prioritize addresses ending with "pump" (likely token mints)
--
./src/services/liquidity-pool-creation-detector.service.js:1886:        const bondingCurveKey = accounts[1] !== undefined ? 
./src/services/liquidity-pool-creation-detector.service.js:1887:          (typeof accounts[1] === 'number' ? accountKeys[accounts[1]] : accounts[1]) : null;
./src/services/liquidity-pool-creation-detector.service.js-1888-        const creatorKey = accounts[2] !== undefined ? 
./src/services/liquidity-pool-creation-detector.service.js-1889-          (typeof accounts[2] === 'number' ? accountKeys[accounts[2]] : accounts[2]) : null;
./src/services/liquidity-pool-creation-detector.service.js-1890-        
./src/services/liquidity-pool-creation-detector.service.js-1891-        console.log(`🔍 ACCOUNTKEYS FULL DEBUG:`, {
./src/services/liquidity-pool-creation-detector.service.js-1892-          accountKeys_length: accountKeys?.length || 0,
./src/services/liquidity-pool-creation-detector.service.js-1893-          accountKeys_first_10: accountKeys?.slice(0, 10)?.map((key, idx) => ({
./src/services/liquidity-pool-creation-detector.service.js-1894-            index: idx,
./src/services/liquidity-pool-creation-detector.service.js-1895-            address: typeof key === 'object' ? key.pubkey : key,
./src/services/liquidity-pool-creation-detector.service.js-1896-            type: typeof key
./src/services/liquidity-pool-creation-detector.service.js-1897-          })),
./src/services/liquidity-pool-creation-detector.service.js-1898-          accounts_0_value: accounts[0],
./src/services/liquidity-pool-creation-detector.service.js-1899-          accounts_0_resolved: accountKeys?.[accounts[0]],
./src/services/liquidity-pool-creation-detector.service.js-1900-          duplicate_addresses: this.findDuplicateAddresses(accountKeys)
./src/services/liquidity-pool-creation-detector.service.js-1901-        });
./src/services/liquidity-pool-creation-detector.service.js-1902-        
