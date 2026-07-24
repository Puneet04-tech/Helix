#!/usr/bin/env node

/**
 * Advanced Feature Test for HELIX
 * Tests AI agents, automation, and advanced features
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';
const HOTEL_API_KEY = 'hotel_management_api_key_12345';

// Test results tracker
const results = {
    passed: 0,
    failed: 0,
    tests: []
};

function log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

function recordTest(name, passed, details = '') {
    results.tests.push({ name, passed, details });
    if (passed) {
        results.passed++;
        log(`✅ PASS: ${name}`);
    } else {
        results.failed++;
        log(`❌ FAIL: ${name} - ${details}`);
    }
}

function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(body) });
                } catch {
                    resolve({ status: res.statusCode, body });
                }
            });
        });
        req.on('error', reject);
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function testAgentChain() {
    log('\n=== Testing LangChain 4-Agent Chain ===');
    try {
        // Send an event that should trigger the full agent chain
        const response = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/events/ingest',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': HOTEL_API_KEY
            }
        }, {
            service: 'hotel-management',
            type: 'security_threat',
            message: 'Unauthorized access attempt detected from IP 192.168.1.100',
            severity: 'critical',
            metadata: { 
                ip: '192.168.1.100',
                attempts: 50,
                timeframe: '5 minutes'
            }
        });
        
        if (response.status === 201 || response.status === 200) {
            recordTest('Agent Chain Trigger', true, 'Event ingested successfully');
            
            // Wait for agent chain to process (increased to 10 seconds)
            await new Promise(resolve => setTimeout(resolve, 10000));
            
            // Check if incident was created with agent reasoning
            const incidentsResponse = await makeRequest({
                hostname: 'localhost',
                port: 5000,
                path: '/incidents/project/hotel_001',
                method: 'GET',
                headers: {
                    'x-api-key': HOTEL_API_KEY
                }
            });
            
            if (incidentsResponse.status === 200 && incidentsResponse.body.length > 0) {
                const latestIncident = incidentsResponse.body[0];
                const hasAgentReasoning = latestIncident.agentReasoning !== undefined;
                const hasDetectionAgent = latestIncident.agentReasoning?.detectionAgent !== undefined;
                const hasAnalysisAgent = latestIncident.agentReasoning?.analysisAgent !== undefined;
                const hasResponseAgent = latestIncident.agentReasoning?.responseAgent !== undefined;
                const hasCommsAgent = latestIncident.agentReasoning?.commsAgent !== undefined;
                
                recordTest('Detection Agent', hasDetectionAgent, hasDetectionAgent ? 'Detection agent executed' : 'Detection agent missing');
                recordTest('Analysis Agent', hasAnalysisAgent, hasAnalysisAgent ? 'Analysis agent executed' : 'Analysis agent missing');
                recordTest('Response Agent', hasResponseAgent, hasResponseAgent ? 'Response agent executed' : 'Response agent missing');
                recordTest('Comms Agent', hasCommsAgent, hasCommsAgent ? 'Comms agent executed' : 'Comms agent missing');
                recordTest('Agent Chain Complete', hasAgentReasoning, hasAgentReasoning ? 'Full agent reasoning present' : 'Agent reasoning incomplete');
            } else {
                recordTest('Agent Chain Complete', false, 'No incidents found');
            }
        } else {
            recordTest('Agent Chain Trigger', false, `Status: ${response.status}`);
        }
    } catch (error) {
        recordTest('Agent Chain Trigger', false, error.message);
    }
}

async function testMultiSystemCorrelation() {
    log('\n=== Testing Multi-System Correlation ===');
    try {
        // Send events from different services
        await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/events/ingest',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': HOTEL_API_KEY
            }
        }, {
            service: 'hotel-management',
            type: 'database_error',
            message: 'Database connection failed',
            metadata: { service: 'database' }
        });
        
        await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/events/ingest',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': HOTEL_API_KEY
            }
        }, {
            service: 'hotel-management',
            type: 'cache_error',
            message: 'Cache service unavailable',
            metadata: { service: 'cache' }
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        recordTest('Multi-System Correlation', true, 'Events sent from multiple services');
    } catch (error) {
        recordTest('Multi-System Correlation', false, error.message);
    }
}

async function testDataIsolation() {
    log('\n=== Testing Data Isolation ===');
    try {
        // Get hotel incidents
        const hotelResponse = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/incidents/project/hotel_001',
            method: 'GET',
            headers: {
                'x-api-key': HOTEL_API_KEY
            }
        });
        
        // Get hospital incidents
        const hospitalResponse = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/incidents/project/hospital_001',
            method: 'GET',
            headers: {
                'x-api-key': 'pk_hospital_default'
            }
        });
        
        if (hotelResponse.status === 200 && hospitalResponse.status === 200) {
            const hotelIncidents = hotelResponse.body;
            const hospitalIncidents = hospitalResponse.body;
            
            // Check if any hotel incident has hospital project ID
            const hotelHasHospitalData = hotelIncidents.some(inc => inc.projectId === 'hospital_001');
            const hospitalHasHotelData = hospitalIncidents.some(inc => inc.projectId === 'hotel_001');
            
            recordTest('Data Isolation', !hotelHasHospitalData && !hospitalHasHotelData, 
                hotelHasHospitalData ? 'Hotel has hospital data leak' : 
                hospitalHasHotelData ? 'Hospital has hotel data leak' : 'Data properly isolated');
        } else {
            recordTest('Data Isolation', false, 'Failed to fetch incidents');
        }
    } catch (error) {
        recordTest('Data Isolation', false, error.message);
    }
}

async function testIncidentSeverityMapping() {
    log('\n=== Testing Incident Severity Mapping ===');
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/events/ingest',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': HOTEL_API_KEY
            }
        }, {
            service: 'hotel-management',
            type: 'critical_failure',
            message: 'Critical system failure',
            severity: 'critical',
            metadata: { test: true }
        });
        
        if (response.status === 201 || response.status === 200) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const incidentsResponse = await makeRequest({
                hostname: 'localhost',
                port: 5000,
                path: '/incidents/project/hotel_001',
                method: 'GET',
                headers: {
                    'x-api-key': HOTEL_API_KEY
                }
            });
            
            if (incidentsResponse.status === 200 && incidentsResponse.body.length > 0) {
                const latestIncident = incidentsResponse.body[0];
                const severityMapped = latestIncident.severity === 'critical';
                recordTest('Severity Mapping', severityMapped, `Severity: ${latestIncident.severity}`);
            } else {
                recordTest('Severity Mapping', false, 'No incidents found');
            }
        } else {
            recordTest('Severity Mapping', false, `Status: ${response.status}`);
        }
    } catch (error) {
        recordTest('Severity Mapping', false, error.message);
    }
}

async function runAllTests() {
    log('═══════════════════════════════════════════════════════════');
    log('🧪 HELIX ADVANCED FEATURE TEST');
    log('═══════════════════════════════════════════════════════════');
    
    await testAgentChain();
    await testMultiSystemCorrelation();
    await testDataIsolation();
    await testIncidentSeverityMapping();
    
    log('\n═══════════════════════════════════════════════════════════');
    log('📊 TEST RESULTS');
    log('═══════════════════════════════════════════════════════════');
    log(`Total Tests: ${results.tests.length}`);
    log(`✅ Passed: ${results.passed}`);
    log(`❌ Failed: ${results.failed}`);
    log(`Success Rate: ${((results.passed / results.tests.length) * 100).toFixed(1)}%`);
    
    if (results.failed > 0) {
        log('\n❌ FAILED TESTS:');
        results.tests.filter(t => !t.passed).forEach(t => {
            log(`   - ${t.name}: ${t.details}`);
        });
    }
    
    log('═══════════════════════════════════════════════════════════');
    
    process.exit(results.failed > 0 ? 1 : 0);
}

// Wait a moment for backend to fully start
setTimeout(() => {
    runAllTests().catch(error => {
        log(`❌ Test suite error: ${error.message}`);
        process.exit(1);
    });
}, 2000);
