import { loadFeature, defineFeature } from 'jest-cucumber'
import Publish from '../../../src/Publish'
import PeerConnection from '../../../src/PeerConnection'
import PeerConnectionStats, { peerConnectionStatsEvents } from '../../../src/PeerConnectionStats'
import '../../../src/Signaling'
import './__mocks__/MockRTCPeerConnection'
import './__mocks__/MockMediaStream'
import './__mocks__/MockBrowser'

const feature = loadFeature('../PeerStats.feature', { loadRelativePath: true, errors: true })

jest.useFakeTimers()
jest.mock('../../../src/Signaling')

const mockTokenGenerator = jest.fn(() => {
  return {
    urls: [
      'ws://localhost:8080'
    ],
    jwt: 'this-is-a-jwt-dummy-token'
  }
})

const mediaStream = new MediaStream([{ kind: 'video' }, { kind: 'audio' }])
const handler = jest.fn()

beforeEach(() => {
  jest.restoreAllMocks()
  jest.clearAllTimers()
  jest.spyOn(PeerConnection.prototype, 'getRTCIceServers').mockReturnValue([])
})

defineFeature(feature, test => {
  test('Get stats with default interval', ({ given, when, then }) => {
    let publisher

    given('I am connected with the peer', async () => {
      publisher = new Publish('streamName', mockTokenGenerator)
      await publisher.connect({ mediaStream })
      expect(publisher.webRTCPeer.getRTCPeerStatus()).toEqual('connected')
    })

    when('I want to get the peer stats', () => {
      publisher.webRTCPeer.on(peerConnectionStatsEvents.stats, handler)
      publisher.webRTCPeer.getStats()
      publisher.webRTCPeer.peerConnectionStats.firstIntervalExecuted = true
      expect(handler).not.toBeCalled()
    })

    then('every 1 second returns the peer stats parsed', () => {
      for (let i = 1; i <= 10; i++) {
        jest.advanceTimersByTime(1000)
        expect(handler).toBeCalledTimes(i)
      }
    })
  })

  test('Get stats when first iteration is completed', ({ given, when, then }) => {
    let publisher

    given('I am connected with the peer', async () => {
      publisher = new Publish('streamName', mockTokenGenerator)
      await publisher.connect({ mediaStream })
      expect(publisher.webRTCPeer.getRTCPeerStatus()).toEqual('connected')
    })

    when('I want to get the peer stats', () => {
      publisher.webRTCPeer.on(peerConnectionStatsEvents.stats, handler)
      publisher.webRTCPeer.getStats()
      expect(handler).not.toBeCalled()
    })

    then('peer stats is not fired until the first report is generated', () => {
      jest.advanceTimersByTime(5000)
      expect(handler).not.toBeCalled()
      publisher.webRTCPeer.peerConnectionStats.firstIntervalExecuted = true
      jest.advanceTimersByTime(1000)
      expect(handler).toBeCalledTimes(1)
    })
  })

  test('Get stats with custom interval', ({ given, when, then }) => {
    let publisher

    given('I am connected with the peer', async () => {
      publisher = new Publish('streamName', mockTokenGenerator)
      await publisher.connect({ mediaStream })
      expect(publisher.webRTCPeer.getRTCPeerStatus()).toEqual('connected')
    })

    when('I want to get the peer stats every 4 seconds', () => {
      publisher.webRTCPeer.on(peerConnectionStatsEvents.stats, handler)
      publisher.webRTCPeer.getStats(4)
      publisher.webRTCPeer.peerConnectionStats.firstIntervalExecuted = true
      expect(handler).not.toBeCalled()
    })

    then('every 4 seconds returns the peer stats parsed', () => {
      for (let i = 1; i <= 10; i++) {
        jest.advanceTimersByTime(4000)
        expect(handler).toBeCalledTimes(i)
      }
    })
  })

  test('Stop get stats', ({ given, when, then }) => {
    let publisher

    given('I am getting stats', async () => {
      publisher = new Publish('streamName', mockTokenGenerator)
      await publisher.connect({ mediaStream })
      expect(publisher.webRTCPeer.getRTCPeerStatus()).toEqual('connected')

      publisher.webRTCPeer.on(peerConnectionStatsEvents.stats, handler)
      publisher.webRTCPeer.getStats(1)
      publisher.webRTCPeer.peerConnectionStats.firstIntervalExecuted = true
      jest.advanceTimersByTime(1000)
      expect(handler).toBeCalledTimes(1)
    })

    when('I want to stop get stats', () => {
      publisher.webRTCPeer.stopStats()
    })

    then('no new peer stats is received', () => {
      jest.advanceTimersByTime(8000)
      expect(handler).toBeCalledTimes(1)
    })
  })

  test('Get stats when it is already initiated', ({ given, when, then }) => {
    let publisher

    given('I am getting stats', async () => {
      publisher = new Publish('streamName', mockTokenGenerator)
      await publisher.connect({ mediaStream })
      expect(publisher.webRTCPeer.getRTCPeerStatus()).toEqual('connected')

      jest.spyOn(PeerConnectionStats.prototype, 'init').mockImplementation(jest.fn)
      publisher.webRTCPeer.getStats(1)
      expect(publisher.webRTCPeer.peerConnectionStats.init).toBeCalledTimes(1)
    })

    when('I want to get stats', () => {
      publisher.webRTCPeer.getStats()
    })

    then('the get stats is not initialized again', () => {
      expect(publisher.webRTCPeer.peerConnectionStats.init).toBeCalledTimes(1)
    })
  })

  test('Get stats with no existing peer', ({ given, when, then }) => {
    let publisher

    given('I do not have peer connected', async () => {
      publisher = new Publish('streamName', mockTokenGenerator)
    })

    when('I want to get stats', () => {
      publisher.webRTCPeer.getStats()
    })

    then('the get stats is not initialized', () => {
      expect(publisher.webRTCPeer.peerConnectionStats).toBeNull()
    })
  })

  test('Get stats with characters interval', ({ given, when, then }) => {
    const interval = 'InvalidInterval'
    let publisher
    let expectError

    given('I am connected with the peer', async () => {
      publisher = new Publish('streamName', mockTokenGenerator)
      await publisher.connect({ mediaStream })
      expect(publisher.webRTCPeer.getRTCPeerStatus()).toEqual('connected')
    })

    when('I want to get the peer stats with invalid interval', () => {
      try {
        publisher.webRTCPeer.getStats(interval)
      } catch (e) {
        expectError = e
      }
    })

    then('throws invalid interval value error', () => {
      expect(expectError.message).toBe(`Invalid interval value ${interval}`)
    })
  })

  test('Get stats with 0 interval', ({ given, when, then }) => {
    const interval = 0
    let publisher
    let expectError

    given('I am connected with the peer', async () => {
      publisher = new Publish('streamName', mockTokenGenerator)
      await publisher.connect({ mediaStream })
      expect(publisher.webRTCPeer.getRTCPeerStatus()).toEqual('connected')
    })

    when('I want to get the peer stats every 0 seconds', () => {
      try {
        publisher.webRTCPeer.getStats(interval)
      } catch (e) {
        expectError = e
      }
    })

    then('throws invalid interval value error', () => {
      expect(expectError.message).toBe(`Invalid interval value ${interval}`)
    })
  })
})
