//
//  Event.swift
//  Bikelonger
//
//  Created by Valentino Servizi on 17/11/2020.
//  Copyright © 2020 DTU. All rights reserved.
//
// https://docs.theoplayer.com/getting-started/02-frameworks/03-react-native/07-event-listeners.md
// https://stackoverflow.com/questions/43246051/send-event-to-js-from-swift-or-objective-c
// https://blog.theodo.com/2020/04/react-native-bridge-module/
// https://moduscreate.com/blog/swift-modules-for-react-native/
// https://gist.github.com/brennanMKE/1ebba84a0fd7c2e8b481e4f8a5349b99

import Foundation

/* RNEventEmitter.swift*/

@objc(RNEventEmitter)
open class RNEventEmitter: RCTEventEmitter {

  public static var emitter: RCTEventEmitter!

  override init() {
    super.init()
    RNEventEmitter.emitter = self
  }
  @objc
  public override static func requiresMainQueueSetup() -> Bool {
    return true;
  }

  open override func supportedEvents() -> [String] {
    ["socketEvent"]
  }
}
