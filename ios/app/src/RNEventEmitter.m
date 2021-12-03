//
//  NSObject+Event.m
//  Bikelonger
//
//  Created by Valentino Servizi on 17/11/2020.
//  Copyright © 2020 DTU. All rights reserved.
//
// CalendarManagerBridge.m
#import "React/RCTBridgeModule.h"
#import "React/RCTEventEmitter.h"

@interface RCT_EXTERN_MODULE(RNEventEmitter, RCTEventEmitter)
  RCT_EXTERN_METHOD(supportedEvents)
@end
