//
//  Socket.swift
//  ReactSockets
//

import Foundation
import SocketIO

@objc(SocketIO)
class SocketIO: NSObject {

  var socket: SocketIOClient!
  var manager: SocketManager!
  var config: [String : Any]?
  
  @objc static func requiresMainQueueSetup() -> Bool {
      return false
  }

  @objc func initialise(_ socketURL: String, config: NSDictionary) -> Void {
    guard let config = config as? [String: Any] else {
        return
    }
    let manager = SocketManager(socketURL: URL(string: socketURL)!, config: [.log(true), .compress, .secure(true),.enableSOCKSProxy(true), .forceWebsockets(true), .connectParams(config)])

    self.manager = manager
    self.socket = manager.defaultSocket
    self.config = config
    self.onAnyEvent()
  }

  @objc func addHandlers(handlers: NSDictionary) -> Void {
    for handler in handlers {
      self.socket.on(handler.key as! String) { data, ack in
        RNEventEmitter.emitter.sendEvent(withName: "socketEvent", body: handler.key as! String)
      }
    }
  }

  private func onAnyEventHandler (sock: SocketAnyEvent) -> Void {
    print("sock.items", sock.items)
    if let items = sock.items {
      RNEventEmitter.emitter.sendEvent(withName: "socketEvent",
          body: ["name": sock.event, "items": items])
    } else {
      RNEventEmitter.emitter.sendEvent(withName: "socketEvent",
           body: ["name": sock.event])
    }
  }

  @objc func onAnyEvent() -> Void {
    self.socket.onAny(self.onAnyEventHandler)
  }

  // Connect to socket
  @objc func connect() -> Void {
    print("self",self.config)
    self.socket.connect(withPayload: self.config)
  }

  // Reconnect to socket
  @objc func reconnect() -> Void {
    self.manager.reconnect()
  }

  // Disconnect from socket
  @objc func close(fast: Bool) -> Void {
    self.socket.disconnect()
  }
}
