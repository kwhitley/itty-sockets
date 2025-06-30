#!/usr/bin/env bun

import { connect } from './src/connect.ts'

class IttySocketsRobustnessTest {
  constructor() {
    this.results = {
      connectionTests: [],
      throughputTests: [],
      resilienceTests: [],
      edgeCaseTests: []
    }
    this.activeConnections = new Set()
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`)
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  generateTestChannel() {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Test 1: Concurrent Connection Load
  async testConcurrentConnections(count = 50) {
    this.log(`Starting concurrent connection test with ${count} connections`)
    const channel = this.generateTestChannel()
    const connections = []
    const startTime = Date.now()
    
    try {
      // Create connections in batches to avoid overwhelming
      const batchSize = 10
      for (let i = 0; i < count; i += batchSize) {
        const batch = []
        const batchEnd = Math.min(i + batchSize, count)
        
        for (let j = i; j < batchEnd; j++) {
          const conn = connect(channel, { as: `tester-${j}`, announce: true })
          batch.push(conn)
          connections.push(conn)
          this.activeConnections.add(conn)
        }
        
        // Wait a bit between batches
        await this.delay(100)
      }

      // Wait for all connections to stabilize
      await this.delay(2000)

      const duration = Date.now() - startTime
      this.log(`${count} connections established in ${duration}ms`)
      
      this.results.connectionTests.push({
        test: 'concurrent_connections',
        count,
        duration,
        success: true
      })

      // Clean up
      connections.forEach(conn => {
        conn.close()
        this.activeConnections.delete(conn)
      })

      return { success: true, duration, count }
    } catch (error) {
      this.log(`Concurrent connection test failed: ${error.message}`, 'error')
      this.results.connectionTests.push({
        test: 'concurrent_connections',
        count,
        error: error.message,
        success: false
      })
      return { success: false, error: error.message }
    }
  }

  // Test 2: Message Throughput and Latency
  async testThroughputAndLatency(messageCount = 100, connectionCount = 5) {
    this.log(`Testing throughput with ${messageCount} messages across ${connectionCount} connections`)
    const channel = this.generateTestChannel()
    const connections = []
    const receivedMessages = []
    const sentTimes = new Map()
    
    try {
      // Create connections
      for (let i = 0; i < connectionCount; i++) {
        const conn = connect(channel, { as: `throughput-${i}` })
        
        conn.on('message', (event) => {
          const receiveTime = Date.now()
          const sentTime = sentTimes.get(event.message.id)
          if (sentTime) {
            const latency = receiveTime - sentTime
            receivedMessages.push({ id: event.message.id, latency, size: JSON.stringify(event.message).length })
          }
        })
        
        connections.push(conn)
        this.activeConnections.add(conn)
      }

      // Wait for connections to establish
      await this.delay(1000)

      // Send messages
      const startTime = Date.now()
      for (let i = 0; i < messageCount; i++) {
        const messageId = `msg-${i}-${Date.now()}`
        const message = {
          id: messageId,
          data: 'x'.repeat(100), // 100 byte payload
          timestamp: Date.now()
        }
        
        sentTimes.set(messageId, Date.now())
        connections[i % connectionCount].send(message)
        
        // Small delay to avoid overwhelming
        if (i % 10 === 0) await this.delay(10)
      }

      // Wait for all messages to be received
      await this.delay(3000)

      const totalTime = Date.now() - startTime
      const avgLatency = receivedMessages.length > 0 
        ? receivedMessages.reduce((sum, msg) => sum + msg.latency, 0) / receivedMessages.length 
        : 0
      
      const throughput = (receivedMessages.length / totalTime) * 1000 // messages per second

      this.log(`Throughput: ${throughput.toFixed(2)} msg/s, Avg Latency: ${avgLatency.toFixed(2)}ms`)
      this.log(`Sent: ${messageCount}, Received: ${receivedMessages.length}, Loss: ${((messageCount - receivedMessages.length) / messageCount * 100).toFixed(2)}%`)

      this.results.throughputTests.push({
        test: 'throughput_latency',
        messagesSent: messageCount,
        messagesReceived: receivedMessages.length,
        avgLatency,
        throughput,
        lossRate: (messageCount - receivedMessages.length) / messageCount,
        duration: totalTime
      })

      // Clean up
      connections.forEach(conn => {
        conn.close()
        this.activeConnections.delete(conn)
      })

      return { throughput, avgLatency, lossRate: (messageCount - receivedMessages.length) / messageCount }
    } catch (error) {
      this.log(`Throughput test failed: ${error.message}`, 'error')
      return { success: false, error: error.message }
    }
  }

  // Test 3: Connection Resilience
  async testResilience() {
    this.log('Testing connection resilience and reconnection')
    const channel = this.generateTestChannel()
    let messagesReceived = 0
    let connectionEvents = []
    
    try {
      const conn = connect(channel, { as: 'resilience-tester' })
      this.activeConnections.add(conn)
      
      conn.on('open', () => {
        connectionEvents.push({ type: 'open', time: Date.now() })
        this.log('Connection opened')
      })
      
      conn.on('close', () => {
        connectionEvents.push({ type: 'close', time: Date.now() })
        this.log('Connection closed')
      })
      
      conn.on('message', () => {
        messagesReceived++
      })

      // Test normal operation
      await this.delay(1000)
      conn.send({ test: 'initial' })
      await this.delay(500)

      // Force close and test reconnection
      this.log('Forcing connection close...')
      conn.close()
      await this.delay(1000)

      // Try to send message (should queue and reconnect)
      this.log('Attempting to send after close...')
      conn.send({ test: 'after-close' })
      await this.delay(2000)

      this.results.resilienceTests.push({
        test: 'reconnection',
        events: connectionEvents,
        messagesReceived,
        success: true
      })

      conn.close()
      this.activeConnections.delete(conn)
      return { success: true, events: connectionEvents }
    } catch (error) {
      this.log(`Resilience test failed: ${error.message}`, 'error')
      return { success: false, error: error.message }
    }
  }

  // Test 4: Edge Cases
  async testEdgeCases() {
    this.log('Testing edge cases and error handling')
    const results = []
    
    try {
      // Test large messages
      const channel1 = this.generateTestChannel()
      const conn1 = connect(channel1)
      this.activeConnections.add(conn1)
      
      await this.delay(1000)
      
      const largeMessage = { data: 'x'.repeat(10000) } // 10KB message
      conn1.send(largeMessage)
      results.push({ test: 'large_message', success: true })
      
      // Test rapid fire messages
      for (let i = 0; i < 50; i++) {
        conn1.send({ rapid: i })
      }
      results.push({ test: 'rapid_fire', success: true })
      
      conn1.close()
      this.activeConnections.delete(conn1)

      // Test invalid JSON (this should be handled gracefully)
      const channel2 = this.generateTestChannel()
      const conn2 = connect(channel2)
      this.activeConnections.add(conn2)
      
      await this.delay(1000)
      
      // Test with special characters
      conn2.send({ unicode: '🚀💻🔥', emoji: true })
      results.push({ test: 'unicode_handling', success: true })
      
      conn2.close()
      this.activeConnections.delete(conn2)

      this.results.edgeCaseTests = results
      return results
    } catch (error) {
      this.log(`Edge case test failed: ${error.message}`, 'error')
      results.push({ test: 'edge_cases', success: false, error: error.message })
      return results
    }
  }

  // Test 5: Memory and Resource Usage
  async testResourceUsage() {
    this.log('Testing resource usage with connection churn')
    const initialMemory = process.memoryUsage()
    
    try {
      // Create and destroy connections rapidly
      for (let round = 0; round < 5; round++) {
        const connections = []
        const channel = this.generateTestChannel()
        
        // Create 20 connections
        for (let i = 0; i < 20; i++) {
          const conn = connect(channel, { as: `churn-${round}-${i}` })
          connections.push(conn)
          this.activeConnections.add(conn)
        }
        
        await this.delay(500)
        
        // Send some messages
        connections.forEach((conn, i) => {
          conn.send({ round, connection: i, data: Math.random() })
        })
        
        await this.delay(200)
        
        // Close all connections
        connections.forEach(conn => {
          conn.close()
          this.activeConnections.delete(conn)
        })
        
        await this.delay(300)
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      const finalMemory = process.memoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
      
      this.log(`Memory usage change: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`)
      
      return {
        initialMemory: initialMemory.heapUsed,
        finalMemory: finalMemory.heapUsed,
        increase: memoryIncrease
      }
    } catch (error) {
      this.log(`Resource usage test failed: ${error.message}`, 'error')
      return { success: false, error: error.message }
    }
  }

  async runAllTests() {
    this.log('Starting comprehensive ittysockets.io robustness test suite')
    
    try {
      // Run tests sequentially to avoid interference
      await this.testConcurrentConnections(30)
      await this.delay(2000)
      
      await this.testThroughputAndLatency(50, 3)
      await this.delay(2000)
      
      await this.testResilience()
      await this.delay(2000)
      
      await this.testEdgeCases()
      await this.delay(2000)
      
      const resourceUsage = await this.testResourceUsage()
      
      // Generate summary report
      this.generateReport(resourceUsage)
      
    } catch (error) {
      this.log(`Test suite failed: ${error.message}`, 'error')
    } finally {
      // Clean up any remaining connections
      this.activeConnections.forEach(conn => {
        try {
          conn.close()
        } catch (e) {
          // Ignore cleanup errors
        }
      })
      this.activeConnections.clear()
    }
  }

  generateReport(resourceUsage) {
    console.log('\n' + '='.repeat(60))
    console.log('ITTYSOCKETS.IO ROBUSTNESS TEST REPORT')
    console.log('='.repeat(60))
    
    console.log('\n📊 CONNECTION TESTS:')
    this.results.connectionTests.forEach(test => {
      console.log(`  ${test.success ? '✅' : '❌'} ${test.test}: ${test.success ? `${test.count} connections in ${test.duration}ms` : test.error}`)
    })
    
    console.log('\n🚀 THROUGHPUT TESTS:')
    this.results.throughputTests.forEach(test => {
      console.log(`  📈 Throughput: ${test.throughput.toFixed(2)} msg/s`)
      console.log(`  ⏱️  Avg Latency: ${test.avgLatency.toFixed(2)}ms`)
      console.log(`  📦 Loss Rate: ${(test.lossRate * 100).toFixed(2)}%`)
      console.log(`  📊 Messages: ${test.messagesReceived}/${test.messagesSent}`)
    })
    
    console.log('\n🔄 RESILIENCE TESTS:')
    this.results.resilienceTests.forEach(test => {
      console.log(`  ${test.success ? '✅' : '❌'} ${test.test}: ${test.events.length} connection events`)
    })
    
    console.log('\n🧪 EDGE CASE TESTS:')
    this.results.edgeCaseTests.forEach(test => {
      console.log(`  ${test.success ? '✅' : '❌'} ${test.test}`)
    })
    
    console.log('\n💾 RESOURCE USAGE:')
    if (resourceUsage.increase !== undefined) {
      console.log(`  Memory change: ${(resourceUsage.increase / 1024 / 1024).toFixed(2)}MB`)
    }
    
    console.log('\n🎯 RECOMMENDATIONS:')
    this.generateRecommendations()
    
    console.log('\n' + '='.repeat(60))
  }

  generateRecommendations() {
    const recommendations = []
    
    // Analyze results and provide recommendations
    const throughputTest = this.results.throughputTests[0]
    if (throughputTest) {
      if (throughputTest.lossRate > 0.05) {
        recommendations.push('📉 High message loss rate detected - consider implementing message acknowledgments')
      }
      if (throughputTest.avgLatency > 500) {
        recommendations.push('⏰ High latency detected - consider geographic distribution or CDN')
      }
      if (throughputTest.throughput < 10) {
        recommendations.push('🐌 Low throughput - consider connection pooling or batching')
      }
    }
    
    recommendations.push('🔒 Consider implementing client-side message encryption for sensitive data')
    recommendations.push('📝 Implement message deduplication for critical applications')
    recommendations.push('⚡ Consider WebRTC for peer-to-peer scenarios to reduce server load')
    recommendations.push('📊 Add application-level heartbeat/keepalive for better connection monitoring')
    
    recommendations.forEach(rec => console.log(`  ${rec}`))
  }
}

// Run the tests
const tester = new IttySocketsRobustnessTest()
tester.runAllTests().catch(console.error)